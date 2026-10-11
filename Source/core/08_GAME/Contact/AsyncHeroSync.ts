import { ServiceManager } from 'Services'
import { createEvent, createTimer } from 'Utils/mapUtils'
import { getUdgEscapers, udg_monsters, udg_spawned_monster_units } from '../../../../globals'
import { Constants } from '../../01_libraries/Constants'
import { Natives } from '../../wc3_natives_unsecured/Natives'

/**
 * What the machine of an async player tells the others about its hero.
 *
 * While the hero is an effect, only that machine knows where it really is, and it moves it alone:
 * the slide never waits for the network. The others replay. BlzSendSyncData carries what they need,
 * and the event it raises fires on every machine in the same game turn, which is what turns a local
 * truth into synchronized state.
 *
 * The kinds of packets:
 *  - POSITION, ten times a second: everything the others need to carry the movement on by
 *    themselves, slide speed and rotation speed included. A slide terrain or a static slide
 *    changes nothing else, so they travel no other way,
 *  - TERRAIN, the one moment the slide waits: where it ends on walkable ground or on a death
 *    terrain that does not forgive. It carries no conclusion: every machine, the sender included,
 *    runs the very same check at the position and with the state it carries, and the map being
 *    the same for everybody, they reach the same conclusion,
 *  - DEATH, the moment this machine sees the hero die, so it dies at the same spot everywhere,
 *  - CONTACT, whenever the hero touches something. Its consequences change the game itself, from
 *    a score to a revived ally, so they cannot be drawn by the machine that noticed alone,
 *  - EVENT, what the others should see or hear about without it deciding anything: the hooks of a
 *    terrain change, an effect of the god mode,
 *  - CASTER AIM, what a caster that picked the hero does about it: only the machine of the hero knows
 *    whether it is in range and where to aim at the effect, and the shot makes a unit,
 *  - MORTAR HIT, the damage the shell of a mortar does to the hero: only the machine of the hero knows
 *    how far from the impact it stands (see MortarSplash).
 */
const POSITION_PREFIX = 'MEC_AHP'
const DEATH_PREFIX = 'MEC_AHD'
const TERRAIN_PREFIX = 'MEC_AHT'
const CONTACT_PREFIX = 'MEC_AHC'
const EVENT_PREFIX = 'MEC_AHE'
const CASTER_AIM_PREFIX = 'MEC_AHA'
const MORTAR_HIT_PREFIX = 'MEC_AHM'
const FIELD_SEPARATOR = '|'

/** Ten a second: the packets travel at network speed whatever the rate, so a higher one would only
 * refine the shape of a path the receivers can compute themselves between two snapshots. */
const POSITION_PERIOD = 0.1

/**
 * Everything needed to carry on the movement between two packets, so that a receiving machine
 * runs the very same slide as the machine that sent it:
 *  - where the hero is, where it looks, and how high it flies,
 *  - targetAngle, the angle the mouse asks for. Absolute rather than "degrees left to turn": a
 *    relative value would drift, an absolute one corrects itself at every packet,
 *  - turnPerPeriod, the current angular speed. The slide accelerates its turns, so without it a
 *    receiver would restart that acceleration from its own value and draw another curve,
 *  - the vertical state, as for a death,
 *  - slideSpeed, rotationSpeed and slideInertia, which the terrain and the static slides under the
 *    hero change on its own machine only,
 *  - terrainTypeId, the terrain the hero was last seen on (0 for none): its gravity and whether it
 *    lets the hero turn, and the state a replayed check starts from,
 *  - staticSlideId (-1 for none) and staticSlidePreviousSpeed, the static slide its own machine has
 *    it in and the speed that lane gives back. Only read at its death: every machine gives the body
 *    back to that lane, which carries it on.
 */
export type HeroMovementState = {
    x: number
    y: number
    facing: number
    targetAngle: number
    flyHeight: number
    speedZ: number
    lastZ: number
    oldDiffZ: number
    slideSpeed: number
    rotationSpeed: number
    slideInertia: number
    turnPerPeriod: number
    terrainTypeId: number
    staticSlideId: number
    staticSlidePreviousSpeed: number
}

const state = { isInitialized: false, sequence: 0 }

// todo check for leaks and find solutions if needed
const encode = (escaperId: number, sequence: number, movement: HeroMovementState) =>
    string.format(
        `%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.2f` +
            `${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.4f${FIELD_SEPARATOR}%.2f` +
            `${FIELD_SEPARATOR}%.4f${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.4f${FIELD_SEPARATOR}%.4f` +
            `${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.4f`,
        escaperId,
        sequence,
        movement.x,
        movement.y,
        movement.facing,
        movement.targetAngle,
        movement.flyHeight,
        movement.speedZ,
        movement.lastZ,
        movement.oldDiffZ,
        movement.slideSpeed,
        movement.rotationSpeed,
        movement.turnPerPeriod,
        movement.terrainTypeId,
        movement.staticSlideId,
        movement.staticSlidePreviousSpeed,
        movement.slideInertia
    )

const decodeNumbers = (data: string) => {
    const fields: number[] = []

    // gmatch hands its captures back as a multiple return, which has to be destructured
    for (const [field] of string.gmatch(data, `[^${FIELD_SEPARATOR}]+`)) {
        fields[fields.length] = tonumber(field) ?? 0
    }

    return fields
}

const decode = (data: string) => {
    const fields = decodeNumbers(data)

    if (fields.length < 17) {
        return undefined
    }

    return {
        escaperId: fields[0],
        sequence: fields[1],
        movement: {
            x: fields[2],
            y: fields[3],
            facing: fields[4],
            targetAngle: fields[5],
            flyHeight: fields[6],
            speedZ: fields[7],
            lastZ: fields[8],
            oldDiffZ: fields[9],
            slideSpeed: fields[10],
            rotationSpeed: fields[11],
            turnPerPeriod: fields[12],
            terrainTypeId: fields[13],
            staticSlideId: fields[14],
            staticSlidePreviousSpeed: fields[15],
            slideInertia: fields[16],
        },
    }
}

/**
 * How the thing a hero touched is named from one machine to another. A unit handle cannot travel,
 * so what travels is where to find it again: monsters of a level and power circles carry an
 * identifier in their user data, the temporary monsters are held by their handle id, which every
 * machine agrees on as long as they create their handles in step.
 */
/** mortar: the shell of a mortar, by monster id, only ever awaited (see MortarSplash), never touched */
export const CONTACT_KIND = { levelMonster: 0, spawnedMonster: 1, powerCircle: 2, mortar: 3 }

/** What a hero sliding as an effect lets the others see or hear about */
export const ASYNC_HERO_EVENT = {
    /** the hooks of a terrain change, which belong to whoever wrote them and may touch the game */
    terrainChanged: 0,
    godModeTouchedDeathTerrain: 1,
    godModeLeftStaticSlide: 2,
}

export const findContactUnit = (kind: number, id: number) => {
    if (kind === CONTACT_KIND.levelMonster) {
        return udg_monsters[id]?.u
    }

    if (kind === CONTACT_KIND.spawnedMonster) {
        return udg_spawned_monster_units[id] ?? undefined
    }

    return getUdgEscapers().get(id)?.getDummyPowerCircle()
}

const registerSyncEvent = (prefix: string, onPacket: (data: string) => void) => {
    createEvent({
        events: [
            t => {
                for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                    BlzTriggerRegisterPlayerSyncEvent(t, Natives.UPlayer(i), prefix, false)
                }
            },
        ],
        actions: [() => onPacket(Natives.UBlzGetTriggerSyncData())],
    })
}

/** Sends the state of the local hero, while it is an effect and only from its own machine */
const sendLocalHeroPosition = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))

    if (!escaper?.isHeroAsEffect()) {
        return
    }

    state.sequence++

    BlzSendSyncData(POSITION_PREFIX, encode(escaper.getId(), state.sequence, escaper.getHeroMovementState()))
}

export const initAsyncHeroSync = () => {
    if (state.isInitialized) {
        return
    }

    state.isInitialized = true

    registerSyncEvent(POSITION_PREFIX, data => {
        const packet = decode(data)

        packet && getUdgEscapers().get(packet.escaperId)?.applyAsyncPosition(packet.sequence, packet.movement)
    })

    registerSyncEvent(TERRAIN_PREFIX, data => {
        const packet = decode(data)

        packet && getUdgEscapers().get(packet.escaperId)?.applyAsyncTerrainChange(packet.sequence, packet.movement)
    })

    registerSyncEvent(CONTACT_PREFIX, data => {
        const fields = decodeNumbers(data)

        if (fields.length < 4) {
            return
        }

        applyContact(fields[0], fields[1], fields[2], fields[3])

        // after it: a contact that killed the hero has frozen its effect for its death by now
        settleAwaitedContact(fields[0], fields[1], fields[2])
    })

    registerSyncEvent(EVENT_PREFIX, data => {
        const fields = decodeNumbers(data)

        if (fields.length < 6) {
            return
        }

        getUdgEscapers().get(fields[0])?.applyAsyncHeroEvent(fields[1], fields[2], fields[3], fields[4], fields[5])
    })

    registerSyncEvent(CASTER_AIM_PREFIX, data => {
        const fields = decodeNumbers(data)

        if (fields.length < 5) {
            return
        }

        casterAimHandler?.(fields[0], fields[1], fields[2], fields[3], fields[4])
    })

    registerSyncEvent(MORTAR_HIT_PREFIX, data => {
        const fields = decodeNumbers(data)

        if (fields.length < 3) {
            return
        }

        mortarHitHandler?.(fields[0], fields[1], fields[2])

        // after it: a shell that killed the hero has frozen its effect for its death by now
        settleAwaitedContact(fields[0], CONTACT_KIND.mortar, fields[1])
    })

    registerSyncEvent(DEATH_PREFIX, data => {
        const packet = decode(data)

        // the killing effect the machine of that hero showed, for every machine to destroy (-1 for none)
        const fields = decodeNumbers(data)
        const killingEffectIndex = fields.length > 17 ? fields[17] : -1

        packet &&
            getUdgEscapers()
                .get(packet.escaperId)
                ?.applyAsyncDeath(packet.sequence, packet.movement, killingEffectIndex)
    })

    createTimer(POSITION_PERIOD, true, sendLocalHeroPosition)
}

/**
 * The contacts the machine of an async hero stopped its effect for, sure that they kill it: by escaper
 * id, then by contact. This machine only. Each one is let go when it comes back from the network, and
 * the effect moves on again once none is left and none of them killed it (see
 * Escaper.stopHeroEffectForContact). Plain tables made once per hero, never from the shared pool.
 */
const awaitedKillingContacts: { [escaperId: number]: { [contactKey: number]: boolean } } = {}

/** Names one contact with a single number, as the contact check does. No id ever comes close to it. */
const AWAITED_CONTACT_KIND_FACTOR = 0x100000000

/** Stops the effect of that hero until this contact, which its machine is sure kills it, comes back */
export const awaitKillingContact = (escaperId: number, kind: number, id: number) => {
    let awaited = awaitedKillingContacts[escaperId]

    if (awaited === undefined) {
        awaited = {}
        awaitedKillingContacts[escaperId] = awaited
    }

    awaited[kind * AWAITED_CONTACT_KIND_FACTOR + id] = true

    getUdgEscapers().get(escaperId)?.stopHeroEffectForContact()
}

/** A contact came back: once none is awaited any more, an effect it did not kill moves on */
const settleAwaitedContact = (escaperId: number, kind: number, id: number) => {
    const awaited = awaitedKillingContacts[escaperId]

    if (awaited === undefined) {
        return
    }

    delete awaited[kind * AWAITED_CONTACT_KIND_FACTOR + id]

    for (const [_] of pairs(awaited)) {
        return
    }

    getUdgEscapers().get(escaperId)?.releaseHeroEffectContactStop()
}

/** Nothing awaited any more for that hero, when it stops sliding as an effect */
export const forgetAwaitedKillingContacts = (escaperId: number) => {
    const awaited = awaitedKillingContacts[escaperId]

    if (awaited === undefined) {
        return
    }

    for (const [contactKey] of pairs(awaited)) {
        delete awaited[contactKey]
    }
}

/**
 * What a contact does, wherever the news comes from: a packet told by the machine of a hero only it
 * can see, or the check of this machine for a hero every machine can see. This is the very handler
 * the immolation of the monsters used to call.
 */
export const applyContact = (escaperId: number, kind: number, id: number, heroZ?: number) => {
    const escaper = getUdgEscapers().get(escaperId)
    const touched = findContactUnit(kind, id)

    escaper &&
        touched &&
        ServiceManager.getService('InvisUnit_is_getting_damage').onEscaperTouchingUnit(escaper, touched, 0, heroZ)
}

/**
 * Tells every machine what the hero touched, this one included: what follows a contact belongs to
 * the game, so it has to happen everywhere, on the same turn.
 *
 * The height of the hero travels along: a contact only counts when the hero is at the height of
 * what it touched, and only the machine sending this knows how high the hero is.
 */
export const sendAsyncContact = (escaperId: number, kind: number, id: number, heroZ: number) => {
    BlzSendSyncData(
        CONTACT_PREFIX,
        string.format(`%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.2f`, escaperId, kind, id, heroZ)
    )
}

/**
 * Tells every machine, this one included, where the slide of the hero ends: they all read the
 * terrain there, from the state it carries, and hand the hero back to its unit on the same turn.
 */
export const sendAsyncTerrainChange = (escaperId: number, movement: HeroMovementState) => {
    state.sequence++

    BlzSendSyncData(TERRAIN_PREFIX, encode(escaperId, state.sequence, movement))
}

/**
 * Tells every machine, this one included, something to show or to call about the hero. It carries
 * no movement: the hero goes on exactly as its own machine decided.
 */
export const sendAsyncHeroEvent = (
    escaperId: number,
    event: number,
    x: number,
    y: number,
    terrainTypeId: number,
    lastTerrainTypeId: number
) => {
    BlzSendSyncData(
        EVENT_PREFIX,
        string.format(
            `%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%.2f${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%d`,
            escaperId,
            event,
            x,
            y,
            terrainTypeId,
            lastTerrainTypeId
        )
    )
}

type MortarHitHandler = (escaperId: number, monsterId: number, damage: number) => void

/** Set by MortarSplash, which this module cannot import without a cycle */
let mortarHitHandler: MortarHitHandler | undefined

export const setAsyncMortarHitHandler = (handler: MortarHitHandler) => {
    mortarHitHandler = handler
}

/** Tells every machine, this one included, the damage the shell of that mortar does to the hero of this machine */
export const sendAsyncMortarHit = (escaperId: number, monsterId: number, damage: number) => {
    BlzSendSyncData(
        MORTAR_HIT_PREFIX,
        string.format(`%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.3f`, escaperId, monsterId, damage)
    )
}

type CasterAimHandler = (casterId: number, request: number, escaperId: number, result: number, angle: number) => void

/** Set by the casters (see Caster.ts), which this module cannot import without a cycle */
let casterAimHandler: CasterAimHandler | undefined

export const setAsyncCasterAimHandler = (handler: CasterAimHandler) => {
    casterAimHandler = handler
}

/**
 * Tells every machine, this one included, what a caster does about the hero of this machine, which only
 * this machine sees where it is: out of range, no shot, or a shot at that angle. The same numbers, read
 * from the same text, on every machine.
 */
export const sendAsyncCasterAim = (
    casterId: number,
    request: number,
    escaperId: number,
    result: number,
    angle: number
) => {
    BlzSendSyncData(
        CASTER_AIM_PREFIX,
        string.format(
            `%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%d${FIELD_SEPARATOR}%.4f`,
            casterId,
            request,
            escaperId,
            result,
            angle
        )
    )
}

/** Only the player owning that hero sends it: they are the only one knowing where it stopped */
export const sendAsyncHeroDeath = (escaperId: number, movement: HeroMovementState, killingEffectIndex: number) => {
    state.sequence++

    BlzSendSyncData(
        DEATH_PREFIX,
        encode(escaperId, state.sequence, movement) + FIELD_SEPARATOR + string.format('%d', killingEffectIndex)
    )
}
