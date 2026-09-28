import { createTimer } from 'Utils/mapUtils'
import { getSpawnedMonsterId, globals, udg_monsters, udg_spawned_monsters } from '../../../../globals'
import { Constants } from '../../01_libraries/Constants'
import type { Monster } from './Monster'

/**
 * Where every monster can be found, without looking at all of them.
 *
 * MEC's own contact check asks, fifty times a second and for every hero, what that hero touches.
 * Walking the 1518 monsters of a map for each of the 24 heroes is 1.8M tests a second, which no
 * Warcraft III machine survives - so each monster is registered once in the chunks of a grid it
 * can be found in, and a hero only ever looks at the chunk it stands in.
 *
 * The invariant that makes so few lookups enough: a monster is registered in EVERY chunk its own
 * reach overlaps around everywhere it can stand, and a hero asks for the chunks its step went
 * through, widened by its own collision size. Whatever the two sizes are, the point lying at the
 * monster's reach from it, towards the hero, belongs to both - so one chunk holds the monster and
 * is asked for, and no contact can be missed.
 *
 * Each side is therefore paid for by the one it belongs to: the monster pads with its reach, the
 * hero widens its own query with its own size, and the step it took is asked for rather than padded
 * in. Padding is read at every tick of every hero, while a query is only ever the business of the
 * one hero making it - which also means a hero growing during the game costs the index nothing.
 *
 * The index is only an accelerator over synced state: as long as it stays exact, the contacts
 * found do not depend on the tier sizes, which makes them a pure performance knob (see
 * docs/MEC_CONTACT_CHECK_TO_REPLACE_IMMOLATION.md).
 */

/**
 * The longest step a hero can take between two contact checks. A step longer than this is not a
 * step at all - a revive, a teleport, a level change - and the check treats it as a landing, so
 * this is a real bound, and a step is never wider than one chunk of the finest tier.
 */
export const MAX_SWEPT_STEP = 2 * Constants.LARGEUR_CASE

/**
 * Chunk sizes in units, from the finest up. Units rather than divisions: the same number means the
 * same thing on any map, and it is directly comparable to a monster's reach and to the padding.
 * A tier holding the whole map is always added on top of these - a monster patrolling the whole
 * map on its own has to live somewhere.
 */
const DEFAULT_TIER_SIZES = [512, 4096]

/**
 * How many chunks of a tier a single monster may occupy before it is moved up to a coarser tier.
 * It has to promote rather than drop: a monster missing from the index is a contact never found.
 *
 * Generous on purpose. An entry is a table slot, while a promotion multiplies by four the ground
 * over which every hero has to hear about that monster - a monster spawn walking its mobs across
 * the map is exactly the case that would suffer from a tight cap.
 */
const MAX_CHUNKS_PER_MONSTER = 48

/** A circle mob is carried around its trigger mob; some of its shapes reach well past the radius */
const CIRCLE_MOB_REACH_FACTOR = 5

/**
 * How long the first registration waits: the monsters of the first level appear as the game starts
 * and register themselves one by one, and this is the moment their count can be told.
 */
const INITIAL_REGISTRATION_DELAY = 1

/** A rebuild waits this long for the rest of the burst that asked for it */
const REBUILD_REQUEST_DELAY = 0.1

const SHAPE_RECT = 0
const SHAPE_SEGMENT = 1

/** The same numbers as CONTACT_KIND in AsyncHeroSync, which is what a contact travels as */
const CONTACT_KIND_LEVEL_MONSTER = 0
const CONTACT_KIND_SPAWNED_MONSTER = 1

/**
 * What a chunk holds: everything the check needs about one thing that can be touched, so that
 * testing a candidate reads Lua fields rather than asking the engine again. One entry per monster,
 * shared by every chunk it sits in and reused when it registers again.
 */
export type ChunkEntry = {
    unit: unit
    reach: number
    kind: number
    id: number
    /** A monster of a level, whose immolation can be taken away for a while. Absent for a spawned one. */
    monster?: Monster
    membership: Membership
}

type ChunkBucket = {
    entries: (ChunkEntry | undefined)[]
    /** Filled up to here; the slots beyond are free for the next entry to take */
    count: number
}

type ChunkTier = {
    chunkSize: number
    cols: number
    rows: number
    buckets: { [chunkIndex: number]: ChunkBucket }
    /** Which walk last visited a chunk, so that the same one is not collected twice */
    visitedBy: { [chunkIndex: number]: number }
}

/** Where one monster sits, so that removing it costs no search */
type Membership = {
    entry?: ChunkEntry
    buckets: (ChunkBucket | undefined)[]
    indices: number[]
    count: number
    /**
     * The line a spawned monster was told to walk, kept so that a rebuild can put it back: a
     * monster of a level describes its own area again instead.
     */
    spawnedX1: number
    spawnedY1: number
    spawnedX2: number
    spawnedY2: number
    /** How the audit names it: a monster of a level is asked, a spawned one is told at registration */
    spawnedLabel: string
    /** For a spawned monster, the order its membership was made in: see spawnedMembershipsInOrder */
    sequence: number
}

const state = {
    isInitialized: false,
    tierSizes: DEFAULT_TIER_SIZES,
    tiers: [] as ChunkTier[],
    memberships: {} as { [monsterId: number]: Membership },
    spawnedMemberships: {} as { [handleId: number]: Membership },
    /**
     * The same memberships, keyed by the order they were made in, which is what every loop over them
     * walks. Walking the table above would follow handle ids, which Lua recycles on each machine at
     * the pace of its own garbage collector: each machine would rebuild and repair the chunks in an
     * order of its own, and end up with buckets ordered differently.
     */
    spawnedMembershipsInOrder: {} as { [sequence: number]: Membership },
    lastSpawnedSequence: 0,
    monsterCount: 0,
    spawnedCount: 0,
    entryCount: 0,
    walk: 0,
    lastRebuildDuration: 0,
    isRebuildRequested: false,
    isFirstRegistrationDone: false,
}

/**
 * The area of the monster being registered, refilled for each of them and never given back: a
 * table dropped once per monster is a table the Lua of Warcraft III has to collect.
 */
const shape = {
    kinds: [] as number[],
    ax: [] as number[],
    ay: [] as number[],
    bx: [] as number[],
    by: [] as number[],
    count: 0,
    padding: 0,
}

/** The chunks the area covers at the tier being tried */
const collected = { indices: [] as number[], count: 0, isOverCap: false }

export type ContactAreaBuilder = {
    /** A place the monster can stand at */
    addPoint: (x: number, y: number) => void
    /** A line the monster travels along */
    addSegment: (x1: number, y1: number, x2: number, y2: number) => void
    /** An area the monster can be anywhere in */
    addRect: (minX: number, minY: number, maxX: number, maxY: number) => void
}

const pushShape = (kind: number, ax: number, ay: number, bx: number, by: number) => {
    shape.kinds[shape.count] = kind
    shape.ax[shape.count] = ax
    shape.ay[shape.count] = ay
    shape.bx[shape.count] = bx
    shape.by[shape.count] = by
    shape.count++
}

const areaBuilder: ContactAreaBuilder = {
    addPoint: (x, y) => pushShape(SHAPE_RECT, x, y, x, y),
    addSegment: (x1, y1, x2, y2) => pushShape(SHAPE_SEGMENT, x1, y1, x2, y2),
    addRect: (minX, minY, maxX, maxY) =>
        pushShape(SHAPE_RECT, RMinBJ(minX, maxX), RMinBJ(minY, maxY), RMaxBJ(minX, maxX), RMaxBJ(minY, maxY)),
}

const colOf = (tier: ChunkTier, x: number) => {
    const col = Math.floor((x - globals.MAP_MIN_X) / tier.chunkSize)

    return col < 0 ? 0 : col > tier.cols - 1 ? tier.cols - 1 : col
}

const rowOf = (tier: ChunkTier, y: number) => {
    const row = Math.floor((y - globals.MAP_MIN_Y) / tier.chunkSize)

    return row < 0 ? 0 : row > tier.rows - 1 ? tier.rows - 1 : row
}

const collectChunk = (tier: ChunkTier, col: number, row: number) => {
    const chunkIndex = row * tier.cols + col

    if (tier.visitedBy[chunkIndex] === state.walk) {
        return
    }

    tier.visitedBy[chunkIndex] = state.walk

    if (collected.count >= MAX_CHUNKS_PER_MONSTER) {
        collected.isOverCap = true
        return
    }

    collected.indices[collected.count] = chunkIndex
    collected.count++
}

const collectRectChunks = (tier: ChunkTier, minX: number, minY: number, maxX: number, maxY: number) => {
    const firstCol = colOf(tier, minX - shape.padding)
    const lastCol = colOf(tier, maxX + shape.padding)
    const firstRow = rowOf(tier, minY - shape.padding)
    const lastRow = rowOf(tier, maxY + shape.padding)

    for (let col = firstCol; col <= lastCol; col++) {
        for (let row = firstRow; row <= lastRow; row++) {
            collectChunk(tier, col, row)

            if (collected.isOverCap) {
                return
            }
        }
    }
}

/**
 * The chunks a padded line covers, walked column by column (or row by row when the line is steeper
 * than wide) rather than over its bounding box: the bounding box of a long diagonal is mostly empty
 * space, and it is what would push a patrolling monster up to a coarse tier for nothing.
 */
const collectSegmentChunks = (tier: ChunkTier, x1: number, y1: number, x2: number, y2: number) => {
    const padding = shape.padding
    const minX = RMinBJ(x1, x2)
    const maxX = RMaxBJ(x1, x2)
    const minY = RMinBJ(y1, y2)
    const maxY = RMaxBJ(y1, y2)

    if (maxX - minX >= maxY - minY) {
        const slope = maxX - minX > 0 ? (y2 - y1) / (x2 - x1) : 0
        const firstCol = colOf(tier, minX - padding)
        const lastCol = colOf(tier, maxX + padding)

        for (let col = firstCol; col <= lastCol; col++) {
            const chunkMinX = globals.MAP_MIN_X + col * tier.chunkSize
            const fromX = RMaxBJ(minX, chunkMinX - padding)
            const toX = RMinBJ(maxX, chunkMinX + tier.chunkSize + padding)

            if (fromX > toX) {
                continue
            }

            const fromY = y1 + (fromX - x1) * slope
            const toY = y1 + (toX - x1) * slope
            const firstRow = rowOf(tier, RMinBJ(fromY, toY) - padding)
            const lastRow = rowOf(tier, RMaxBJ(fromY, toY) + padding)

            for (let row = firstRow; row <= lastRow; row++) {
                collectChunk(tier, col, row)

                if (collected.isOverCap) {
                    return
                }
            }
        }

        return
    }

    const slope = (x2 - x1) / (y2 - y1)
    const firstRow = rowOf(tier, minY - padding)
    const lastRow = rowOf(tier, maxY + padding)

    for (let row = firstRow; row <= lastRow; row++) {
        const chunkMinY = globals.MAP_MIN_Y + row * tier.chunkSize
        const fromY = RMaxBJ(minY, chunkMinY - padding)
        const toY = RMinBJ(maxY, chunkMinY + tier.chunkSize + padding)

        if (fromY > toY) {
            continue
        }

        const fromX = x1 + (fromY - y1) * slope
        const toX = x1 + (toY - y1) * slope
        const firstCol = colOf(tier, RMinBJ(fromX, toX) - padding)
        const lastCol = colOf(tier, RMaxBJ(fromX, toX) + padding)

        for (let col = firstCol; col <= lastCol; col++) {
            collectChunk(tier, col, row)

            if (collected.isOverCap) {
                return
            }
        }
    }
}

/** The chunks of one tier the area covers, or nothing when there are more of them than the cap */
const collectTierChunks = (tier: ChunkTier) => {
    state.walk++
    collected.count = 0
    collected.isOverCap = false

    for (let i = 0; i < shape.count; i++) {
        if (shape.kinds[i] === SHAPE_SEGMENT) {
            collectSegmentChunks(tier, shape.ax[i], shape.ay[i], shape.bx[i], shape.by[i])
        } else {
            collectRectChunks(tier, shape.ax[i], shape.ay[i], shape.bx[i], shape.by[i])
        }

        if (collected.isOverCap) {
            return false
        }
    }

    return collected.count > 0
}

const newMembership = (): Membership => ({
    buckets: [],
    indices: [],
    count: 0,
    spawnedX1: 0,
    spawnedY1: 0,
    spawnedX2: 0,
    spawnedY2: 0,
    spawnedLabel: 'spawnMob',
    sequence: 0,
})

const getMonsterMembership = (monsterId: number) => {
    const existing = state.memberships[monsterId]

    if (existing !== undefined) {
        return existing
    }

    const membership = newMembership()
    state.memberships[monsterId] = membership

    return membership
}

const getSpawnedMembership = (handleId: number) => {
    const existing = state.spawnedMemberships[handleId]

    if (existing !== undefined) {
        return existing
    }

    const membership = newMembership()
    state.spawnedMemberships[handleId] = membership

    state.lastSpawnedSequence++
    membership.sequence = state.lastSpawnedSequence
    state.spawnedMembershipsInOrder[membership.sequence] = membership

    return membership
}

/** One entry per monster, reused every time it registers again rather than made anew */
const getEntry = (membership: Membership, unit: unit, reach: number, kind: number, id: number, monster?: Monster) => {
    const existing = membership.entry

    if (existing !== undefined) {
        existing.unit = unit
        existing.reach = reach
        existing.kind = kind
        existing.id = id
        existing.monster = monster

        return existing
    }

    const entry: ChunkEntry = { unit, reach, kind, id, monster, membership }
    membership.entry = entry

    return entry
}

const addToChunk = (tier: ChunkTier, chunkIndex: number, entry: ChunkEntry, membership: Membership) => {
    let bucket = tier.buckets[chunkIndex]

    if (bucket === undefined) {
        bucket = { entries: [], count: 0 }
        tier.buckets[chunkIndex] = bucket
    }

    bucket.entries[bucket.count] = entry
    membership.buckets[membership.count] = bucket
    membership.indices[membership.count] = bucket.count
    bucket.count++
    membership.count++
    state.entryCount++
}

/** Swaps the last entry of the chunk into the hole, and tells it where it now sits */
const removeFromChunk = (bucket: ChunkBucket, index: number, entry: ChunkEntry) => {
    const lastIndex = bucket.count - 1
    const moved = bucket.entries[lastIndex]

    bucket.entries[index] = moved
    bucket.entries[lastIndex] = undefined
    bucket.count = lastIndex
    state.entryCount--

    if (moved === undefined || moved === entry) {
        return
    }

    const movedMembership = moved.membership

    for (let i = 0; i < movedMembership.count; i++) {
        if (movedMembership.buckets[i] === bucket && movedMembership.indices[i] === lastIndex) {
            movedMembership.indices[i] = index
            return
        }
    }
}

const leaveChunks = (membership: Membership) => {
    if (membership.count === 0) {
        return false
    }

    const entry = membership.entry

    for (let i = 0; i < membership.count; i++) {
        const bucket = membership.buckets[i]

        if (bucket !== undefined && entry !== undefined) {
            removeFromChunk(bucket, membership.indices[i], entry)
        }

        membership.buckets[i] = undefined
    }

    membership.count = 0

    return true
}

/**
 * Puts one thing in every chunk of the finest tier that can hold the area just described in
 * `shape`. Nothing that cannot be touched is indexed at all.
 */
const joinChunks = (membership: Membership, unit: unit, reach: number, kind: number, id: number, monster?: Monster) => {
    if (shape.count === 0) {
        return false
    }

    for (let tierIndex = 0; tierIndex < state.tiers.length; tierIndex++) {
        const tier = state.tiers[tierIndex]

        if (!collectTierChunks(tier)) {
            continue
        }

        const entry = getEntry(membership, unit, reach, kind, id, monster)

        for (let i = 0; i < collected.count; i++) {
            addToChunk(tier, collected.indices[i], entry, membership)
        }

        return true
    }

    return false
}

export const unregisterMonsterFromChunks = (monster: Monster) => {
    const membership = state.memberships[monster.getId()]

    if (membership !== undefined && leaveChunks(membership)) {
        state.monsterCount--
    }
}

/** For a monster that is gone for good: its chunks are left, and its own bookkeeping dropped */
export const forgetMonsterInChunks = (monster: Monster) => {
    unregisterMonsterFromChunks(monster)
    delete state.memberships[monster.getId()]
}

/**
 * Puts a monster of a level in the chunks it can be found in. Called whenever its unit appears; a
 * monster nothing can touch is left out of the index entirely.
 */
export const registerMonsterInChunks = (monster: Monster) => {
    unregisterMonsterFromChunks(monster)

    if (!state.isInitialized || monster.u === undefined) {
        return
    }

    const reach = monster.getMonsterType()?.getImmolationRadius() ?? 0

    if (reach <= 0) {
        // no immolation is no contact: the hero passes through it
        return
    }

    shape.count = 0
    shape.padding = reach
    monster.describeContactArea(areaBuilder)

    const membership = getMonsterMembership(monster.getId())

    if (joinChunks(membership, monster.u, reach, CONTACT_KIND_LEVEL_MONSTER, monster.getId(), monster)) {
        state.monsterCount++
    }
}

/**
 * Puts a spawned monster in the chunks of the line it was just told to walk - the whole of its
 * life, since it is removed at the end of it, and since the waypoints of a long move all sit on
 * that very line.
 *
 * Told at the moment it is spawned rather than followed tick by tick: a spawned monster moves
 * without pause, but never off the line, which is all the index needs to know.
 */
export const registerSpawnedUnitInChunks = (
    spawnedUnit: unit,
    reach: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label = 'spawnMob'
) => {
    const handleId = GetHandleId(spawnedUnit)
    const membership = getSpawnedMembership(handleId)

    if (leaveChunks(membership)) {
        state.spawnedCount--
    }

    if (!state.isInitialized || reach <= 0) {
        return
    }

    membership.spawnedX1 = x1
    membership.spawnedY1 = y1
    membership.spawnedX2 = x2
    membership.spawnedY2 = y2
    membership.spawnedLabel = label

    shape.count = 0
    shape.padding = reach
    areaBuilder.addSegment(x1, y1, x2, y2)

    // named by its registration number rather than its handle: a contact with it travels to every machine
    const spawnedMonsterId = getSpawnedMonsterId(spawnedUnit) ?? 0

    if (joinChunks(membership, spawnedUnit, reach, CONTACT_KIND_SPAWNED_MONSTER, spawnedMonsterId, undefined)) {
        state.spawnedCount++
    }
}

/**
 * Takes a spawned monster out of the chunks, keeping what is known about it: the unit of a monster
 * spawn is hidden and handed back to its recycler rather than removed, and comes back under the
 * very same handle at the next spawn.
 */
export const unregisterSpawnedUnitFromChunks = (spawnedUnit: unit) => {
    const membership = state.spawnedMemberships[GetHandleId(spawnedUnit)]

    if (membership !== undefined && leaveChunks(membership)) {
        state.spawnedCount--
    }
}

/** For a spawned unit that is really removed, a caster shot at the end of its flight: nothing kept */
export const forgetSpawnedUnitInChunks = (spawnedUnit: unit) => {
    unregisterSpawnedUnitFromChunks(spawnedUnit)

    const handleId = GetHandleId(spawnedUnit)
    const membership = state.spawnedMemberships[handleId]

    if (membership !== undefined) {
        delete state.spawnedMembershipsInOrder[membership.sequence]
    }

    delete state.spawnedMemberships[handleId]
}

const buildTiers = () => {
    const mapWidth = globals.MAP_MAX_X - globals.MAP_MIN_X
    const mapHeight = globals.MAP_MAX_Y - globals.MAP_MIN_Y
    const mapSpan = RMaxBJ(mapWidth, mapHeight)

    state.tiers = []

    const pushTier = (chunkSize: number) => {
        state.tiers[state.tiers.length] = {
            chunkSize,
            cols: Math.floor(mapWidth / chunkSize) + 1,
            rows: Math.floor(mapHeight / chunkSize) + 1,
            buckets: {},
            visitedBy: {},
        }
    }

    for (let i = 0; i < state.tierSizes.length; i++) {
        if (state.tierSizes[i] > 0 && state.tierSizes[i] < mapSpan) {
            pushTier(state.tierSizes[i])
        }
    }

    // the whole map, always last: a single chunk nothing can be too big for
    pushTier(mapSpan + 1)
}

/**
 * Registers every monster unit standing on the map again, from nothing. Cheap enough to be the
 * answer to anything the index cannot follow on its own - a changed immolation radius, a patrol
 * edited while making a level, a new tier ladder.
 *
 * Says what came of it only when somebody asked for it by hand: the ones the game triggers by
 * itself would be talking to nobody, and `-contactChunks stats` tells the same at any time.
 */
export const rebuildContactChunks = (isAsked = false) => {
    const startTime = os.clock()

    isAsked && print('Starting monsters contact check registration...')

    buildTiers()
    state.isInitialized = true

    // the chunks they sat in are gone with the old tiers, so every membership starts over
    for (const [_, membership] of pairs(state.memberships)) {
        membership.count = 0
    }

    for (const [_, membership] of pairs(state.spawnedMembershipsInOrder)) {
        membership.count = 0
    }

    state.monsterCount = 0
    state.spawnedCount = 0
    state.entryCount = 0

    for (const [_, monster] of pairs(udg_monsters)) {
        registerMonsterInChunks(monster)
    }

    // a spawned monster cannot describe itself: what it was told to walk is kept for this moment
    for (const [_, membership] of pairs(state.spawnedMembershipsInOrder)) {
        const entry = membership.entry

        if (entry !== undefined) {
            registerSpawnedUnitInChunks(
                entry.unit,
                udg_spawned_monsters[GetHandleId(entry.unit)]?.getImmolationRadius() ?? entry.reach,
                membership.spawnedX1,
                membership.spawnedY1,
                membership.spawnedX2,
                membership.spawnedY2,
                membership.spawnedLabel
            )
        }
    }

    state.lastRebuildDuration = os.clock() - startTime
    state.isFirstRegistrationDone = true

    isAsked &&
        print(
            `Monsters contact check registration done. ${state.monsterCount} monster units on the map ` +
                `and ${state.spawnedCount} spawned ones, ${state.entryCount} entries in ` +
                `${state.tiers.length} tiers, ${Math.floor(state.lastRebuildDuration * 1000 + 0.5)} ms. ` +
                `The monsters of a level to come register as it starts.`
        )
}

/**
 * Asks for a rebuild instead of doing one: a single command can change the immolation of every
 * monster type in a row, or the collision size of every hero, and the index only has to be right
 * once such a burst has settled.
 *
 * One rebuild is pending at a time, and anything asked for before the first registration of the
 * game is answered by that one - which registers everything anyway, and is the only one to say so.
 */
export const requestContactChunksRebuild = () => {
    if (state.isRebuildRequested || !state.isFirstRegistrationDone) {
        return
    }

    state.isRebuildRequested = true

    createTimer(REBUILD_REQUEST_DELAY, false, () => {
        state.isRebuildRequested = false
        rebuildContactChunks()
    })
}

export const setContactChunkTierSizes = (tierSizes: number[]) => {
    state.tierSizes = tierSizes
    rebuildContactChunks(true)
}

export const getContactChunkTierSizes = () => state.tierSizes

export const getContactChunkTierCount = () => state.tiers.length

/** The monsters registered in one chunk of one tier, taken by the position of the chunk */
export const getContactChunkBucket = (tierIndex: number, x: number, y: number) => {
    const tier = state.tiers[tierIndex]

    if (tier === undefined) {
        return undefined
    }

    return tier.buckets[rowOf(tier, y) * tier.cols + colOf(tier, x)]
}

/**
 * Every monster a hero going from one point to the other may have touched: the ones registered in
 * the chunks that step went through, widened by the hero's own collision size, at every tier.
 * Nothing else is ever heard of.
 *
 * A monster registered in two of those chunks is visited twice, which costs one more distance test
 * and nothing else - the contact it may report is told once, since the same one cannot be told
 * twice in the same check.
 */
export const forEachMonsterAround = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    heroRadius: number,
    visit: (entry: ChunkEntry) => void
) => {
    for (let tierIndex = 0; tierIndex < state.tiers.length; tierIndex++) {
        const tier = state.tiers[tierIndex]
        const firstCol = colOf(tier, RMinBJ(fromX, toX) - heroRadius)
        const lastCol = colOf(tier, RMaxBJ(fromX, toX) + heroRadius)
        const firstRow = rowOf(tier, RMinBJ(fromY, toY) - heroRadius)
        const lastRow = rowOf(tier, RMaxBJ(fromY, toY) + heroRadius)

        for (let col = firstCol; col <= lastCol; col++) {
            for (let row = firstRow; row <= lastRow; row++) {
                const bucket = tier.buckets[row * tier.cols + col]

                if (bucket === undefined) {
                    continue
                }

                for (let i = 0; i < bucket.count; i++) {
                    const entry = bucket.entries[i]

                    entry && visit(entry)
                }
            }
        }
    }
}

export const initContactChunks = () => {
    if (state.isInitialized) {
        return
    }

    buildTiers()
    state.isInitialized = true

    // From here on every monster unit created registers itself; this only tells what came of it,
    // once the first level has had the time to put its own monsters on the map.
    createTimer(INITIAL_REGISTRATION_DELAY, false, rebuildContactChunks)
}

export const getContactChunkStats = () => {
    const lines: string[] = []

    let definedMonsters = 0
    let monstersWithUnit = 0
    let untouchableMonsters = 0

    for (const [_, monster] of pairs(udg_monsters)) {
        definedMonsters++

        if (monster.u !== undefined) {
            monstersWithUnit++

            if ((monster.getMonsterType()?.getImmolationRadius() ?? 0) <= 0) {
                untouchableMonsters++
            }
        }
    }

    lines[0] =
        `Monsters: ${state.monsterCount} registered = ${monstersWithUnit} with a unit on the map - ` +
        `${untouchableMonsters} untouchable (no immolation, so no contact to find), ` +
        `out of ${definedMonsters} defined in all the levels`
    lines[1] = `Spawned monsters: ${state.spawnedCount} registered, on the line each was told to walk`
    lines[2] =
        `Tiers: ${state.tiers.length}, entries: ${state.entryCount}, ` +
        `padded with their reach only (the hero size and its ${MAX_SWEPT_STEP} step are asked for), ` +
        `last rebuild: ${Math.floor(state.lastRebuildDuration * 1000 + 0.5)} ms`

    for (let tierIndex = 0; tierIndex < state.tiers.length; tierIndex++) {
        const tier = state.tiers[tierIndex]
        let chunks = 0
        let entries = 0
        let worstChunk = 0

        for (const [_, bucket] of pairs(tier.buckets)) {
            if (bucket.count > 0) {
                chunks++
                entries += bucket.count

                if (bucket.count > worstChunk) {
                    worstChunk = bucket.count
                }
            }
        }

        lines[lines.length] =
            `  tier ${tierIndex} (${tier.chunkSize} units, ${tier.cols}x${tier.rows}): ` +
            `${entries} entries in ${chunks} chunks, worst chunk ${worstChunk}`
    }

    return lines
}

/**
 * Checks that every registered monster unit is really standing in one of its own chunks. Nothing
 * uses it at runtime: it is there to catch a monster moved in a way its movement class does not
 * describe, which is the one mistake that would cost a contact.
 */
/** Whether the unit of a registered thing really stands in one of the chunks it was put in */
const isStandingInItsOwnChunks = (membership: Membership) => {
    const entry = membership.entry

    if (entry === undefined || membership.count === 0 || GetUnitTypeId(entry.unit) === 0) {
        return true
    }

    const x = GetUnitX(entry.unit)
    const y = GetUnitY(entry.unit)

    for (let tierIndex = 0; tierIndex < state.tiers.length; tierIndex++) {
        const bucket = getContactChunkBucket(tierIndex, x, y)

        if (bucket === undefined) {
            continue
        }

        for (let i = 0; i < bucket.count; i++) {
            if (bucket.entries[i] === entry) {
                return true
            }
        }
    }

    return false
}

const AUDIT_WATCH_PERIOD = 1

const auditWatch = {
    isOn: false,
    isTimerStarted: false,
    /** How many offenders of each kind, refilled at every pass */
    counts: {} as { [label: string]: number },
    labels: [] as string[],
    labelCount: 0,
}

const countOffender = (label: string) => {
    if (auditWatch.counts[label] === undefined) {
        auditWatch.counts[label] = 0
        auditWatch.labels[auditWatch.labelCount] = label
        auditWatch.labelCount++
    }

    auditWatch.counts[label]++
}

/**
 * Puts a spawned monster back in the chunks, from the line it was told to walk AND from where it
 * really stands: whatever moved it there is not something this index knows how to follow.
 */
const repairSpawnedUnit = (membership: Membership) => {
    const entry = membership.entry

    if (entry === undefined || GetUnitTypeId(entry.unit) === 0) {
        return
    }

    if (leaveChunks(membership)) {
        state.spawnedCount--
    }

    shape.count = 0
    shape.padding = entry.reach
    areaBuilder.addSegment(membership.spawnedX1, membership.spawnedY1, membership.spawnedX2, membership.spawnedY2)
    areaBuilder.addPoint(GetUnitX(entry.unit), GetUnitY(entry.unit))

    if (joinChunks(membership, entry.unit, entry.reach, entry.kind, entry.id, undefined)) {
        state.spawnedCount++
    }
}

/** How many things are not standing in their own chunks, counted by kind into auditWatch */
const countOffenders = (repair: boolean) => {
    for (let i = 0; i < auditWatch.labelCount; i++) {
        auditWatch.counts[auditWatch.labels[i]] = 0
    }

    let total = 0

    for (const [_, monster] of pairs(udg_monsters)) {
        const membership = state.memberships[monster.getId()]

        if (monster.u !== undefined && membership !== undefined && !isStandingInItsOwnChunks(membership)) {
            countOffender(monster.getContactAreaLabel())
            total++

            // its own position is part of what it describes, so registering it again is the repair
            repair && registerMonsterInChunks(monster)
        }
    }

    for (const [_, membership] of pairs(state.spawnedMembershipsInOrder)) {
        if (!isStandingInItsOwnChunks(membership)) {
            countOffender(membership.spawnedLabel)
            total++

            repair && repairSpawnedUnit(membership)
        }
    }

    return total
}

const watchPass = () => {
    if (!auditWatch.isOn) {
        return
    }

    const total = countOffenders(true)

    // nothing is said while nothing is wrong: this runs for a whole game
    if (total === 0) {
        return
    }

    let byKind = ''

    for (let i = 0; i < auditWatch.labelCount; i++) {
        const label = auditWatch.labels[i]

        if (auditWatch.counts[label] > 0) {
            byKind =
                byKind === ''
                    ? `${label} ${auditWatch.counts[label]}`
                    : `${byKind}, ${label} ${auditWatch.counts[label]}`
        }
    }

    print(`Contact chunks audit: ${total} monsters outside their chunks (${byKind}), put back in`)
}

/**
 * Watches the index instead of being asked once: every second, and only when something is wrong,
 * it tells how many monsters are not standing in their own chunks and of what kind - and puts them
 * back in, so that whatever moved them costs at most one second of a wrong area rather than a hole
 * for the whole game. Meant to be left on for a whole game while playing every level of a map.
 */
export const setContactChunksAuditWatch = (enabled: boolean) => {
    auditWatch.isOn = enabled

    if (enabled && !auditWatch.isTimerStarted) {
        auditWatch.isTimerStarted = true
        createTimer(AUDIT_WATCH_PERIOD, true, watchPass)
    }
}

export const isContactChunksAuditWatched = () => auditWatch.isOn

export const auditContactChunks = () => {
    const offenders: string[] = []

    for (const [_, monster] of pairs(udg_monsters)) {
        const membership = state.memberships[monster.getId()]

        if (monster.u !== undefined && membership !== undefined && !isStandingInItsOwnChunks(membership)) {
            offenders[offenders.length] =
                `  monster ${monster.getId()} (${monster.constructor.name}) at ` +
                `${Math.floor(GetUnitX(monster.u))}, ${Math.floor(GetUnitY(monster.u))}`
        }
    }

    for (const [_, membership] of pairs(state.spawnedMembershipsInOrder)) {
        if (!isStandingInItsOwnChunks(membership)) {
            const entry = membership.entry

            offenders[offenders.length] =
                `  spawned monster ${entry!.id} at ` +
                `${Math.floor(GetUnitX(entry!.unit))}, ${Math.floor(GetUnitY(entry!.unit))}, told to walk ` +
                `${Math.floor(membership.spawnedX1)}, ${Math.floor(membership.spawnedY1)} -> ` +
                `${Math.floor(membership.spawnedX2)}, ${Math.floor(membership.spawnedY2)}`
        }
    }

    return offenders
}
