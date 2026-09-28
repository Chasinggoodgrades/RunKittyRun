import { ServiceManager } from 'Services'
import { createEvent, createTimer } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../../globals'
import { Constants } from '../../01_libraries/Constants'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import type { ChunkEntry } from '../../04_STRUCTURES/Monster/ContactChunks'
import { forEachMonsterAround, MAX_SWEPT_STEP } from '../../04_STRUCTURES/Monster/ContactChunks'
import { previewKillingEffect } from '../Death/AsyncKillingEffects'
import { applyContact, awaitKillingContact, CONTACT_KIND, findContactUnit, sendAsyncContact } from './AsyncHeroSync'

/**
 * Finds what a hero touches, by hand, which is how a contact is found at all: the monsters carry no
 * immolation any more (see IMMOLATION_SYSTEM_ENABLED), so this answers for every hero of the game.
 *
 * A hero sliding as an effect no longer carries its invisible unit around, so the immolation of
 * the monsters has nothing to burn: the contact has to be looked for. Only the machine owning that
 * hero looks, since it is the only one knowing where it really is, and it only looks: what follows
 * a contact belongs to the game, from a score to a revived ally, so it is announced and every
 * machine runs the very same handler the immolation used to call, on the same turn.
 *
 * Any other hero stands on every machine at once, so every machine looks for its contacts itself
 * and handles them on the spot, telling nothing: everything read is synced state, so the same
 * contacts are found everywhere on the same turn, and a packet per machine per contact would
 * multiply what one machine alone has to say.
 *
 * The reach is the collision size of the hero, which the invisible unit was built from.
 *
 * Monsters carry the ability Locust to be unclickable, and the enumeration natives ignore those,
 * so the engine cannot be asked what stands nearby: the candidates come from MEC's own index, the
 * contact chunks, which answer with the monsters of the one chunk the hero stands in per tier.
 */
const CONTACT_CHECK_PERIOD = 0.02

/**
 * How long the same thing waits before counting again, while the hero keeps standing on it. The
 * immolation burned at its own pace rather than at every frame, and a hero resting on a jump pad or
 * on a harmless monster has to be as quiet: fifty contacts a second would be handled for nothing.
 *
 * Counted in checks rather than in seconds: the clock of a machine is its own, while the ticks of a
 * timer started at the same turn everywhere are the same for everyone, which the contacts handled
 * on the spot by every machine need.
 */
const CONTACT_REPEAT_CHECKS = Math.floor(1 / CONTACT_CHECK_PERIOD)

/** Names one thing touched with a single number. No handle id ever comes close to it. */
const CONTACT_KEY_KIND_FACTOR = 0x100000000

const state = { isInitialized: false, isEnabledForEveryHero: true, checkCount: 0 }

/**
 * Whether the check answers for every hero or only for the ones an effect carries. It answers for
 * all of them, which is how a game runs now that the monsters carry no immolation - see
 * IMMOLATION_SYSTEM_ENABLED.
 *
 * Turning it off leaves the walking heroes to the immolation of the engine, which has to be handed
 * out again (e2e test "immolationOn") or nothing will find their contacts at all. Both on at once
 * lead to the same handler, and every contact is then handled twice.
 */
export const setContactCheckEnabledForEveryHero = (enabled: boolean) => {
    state.isEnabledForEveryHero = enabled
}

/**
 * Squared distance from a point to the segment the hero travelled. Tested against the segment
 * rather than the arrival point, so that a fast slide cannot step over a monster between two
 * checks: it makes the detection independent from the speed, which is what allows this to run
 * fifty times a second rather than at every slide step.
 */
const squaredDistanceToStep = (fromX: number, fromY: number, toX: number, toY: number, x: number, y: number) => {
    const stepX = toX - fromX
    const stepY = toY - fromY
    const squaredStepLength = stepX * stepX + stepY * stepY

    let ratio = 0

    if (squaredStepLength > 0) {
        ratio = ((x - fromX) * stepX + (y - fromY) * stepY) / squaredStepLength
        ratio = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio
    }

    const closestX = fromX + ratio * stepX - x
    const closestY = fromY + ratio * stepY - y

    return closestX * closestX + closestY * closestY
}

type ContactContext = {
    escaper: Escaper
    fromX: number
    fromY: number
    toX: number
    toY: number
    heroRadius: number
    /**
     * All of them, not the first one found: the immolation fired the handler once per monster
     * burning the hero, so touching a jump pad and a monster at the same instant, or two life
     * bonuses at once, must still count twice.
     *
     * What is kept is how to name them to the other machines rather than the units themselves.
     * Filled up to touchedCount and never emptied: a table dropped fifty times a second is a leak
     * in the Lua of Warcraft III. It settles on the largest number of contacts ever seen at once.
     */
    touchedKinds: number[]
    touchedIds: number[]
    touchedCount: number
    /** At which check each thing touched last counted, so a lasting contact counts at its own pace */
    lastContactChecks: { [contactKey: number]: number }
    /** Which check looked at this hero last, and whether it was the machine of an effect telling */
    lastCheck: number
    wasTold: boolean
}

/**
 * One context per hero, kept for the whole game: everything the check needs is written into it
 * rather than built again at every turn.
 */
const contexts: { [escaperId: number]: ContactContext } = {}

/**
 * Where a contact found here is handled from: a thread a trigger starts, rather than the timer of the
 * check. What follows a contact may wait - a coop revive does, before giving its hero back its speed
 * and then its mortality - and a wait ends a timer thread on the spot, which left the revived hero
 * frozen and immortal. The immolation handed its contacts over through a damage trigger, and the
 * packet of an async hero comes through a sync one: both threads that may wait.
 *
 * One trigger for them all: each execution runs in a thread of its own, and reads what to handle
 * before anything in it can wait.
 */
const contactThread = { trigger: undefined as trigger | undefined, escaperId: 0, kind: 0, id: 0 }

const applyContactInItsOwnThread = (escaperId: number, kind: number, id: number) => {
    if (!contactThread.trigger) {
        applyContact(escaperId, kind, id)

        return
    }

    contactThread.escaperId = escaperId
    contactThread.kind = kind
    contactThread.id = id

    TriggerExecute(contactThread.trigger)
}

/**
 * The machine of a hero sliding async acts the moment it sees a contact that kills, rather than when
 * that contact comes back from the network: it stops the effect there, so that the hero dies where it
 * touched, and shows the killing effect on it. It only stops and moves an effect every machine has
 * (see AsyncKillingEffects), and only for what kills for sure - asked the very questions every machine
 * will ask when the contact reaches them. Called before the contact is sent.
 */
const anticipateKillingContact = (escaper: Escaper, kind: number, id: number, heroZ: number) => {
    if (kind === CONTACT_KIND.powerCircle || escaper.isAsyncDeathPending() || escaper.isAsyncHandBackPending()) {
        return
    }

    const touched = findContactUnit(kind, id)

    if (!touched) {
        return
    }

    const touches = ServiceManager.getService('InvisUnit_is_getting_damage')

    if (!touches.doesTouchKill(escaper, touched, heroZ)) {
        return
    }

    awaitKillingContact(escaper.getId(), kind, id)

    const model = touches.getKillingEffectOfTouch(escaper, touched, heroZ)

    model && previewKillingEffect(escaper.getId(), model, escaper.getHeroX(), escaper.getHeroY(), heroZ)
}

const getContext = (escaper: Escaper) => {
    const existing = contexts[escaper.getId()]

    if (existing !== undefined) {
        return existing
    }

    const x = escaper.getHeroX()
    const y = escaper.getHeroY()
    const context: ContactContext = {
        escaper,
        fromX: x,
        fromY: y,
        toX: x,
        toY: y,
        heroRadius: 0,
        touchedKinds: [],
        touchedIds: [],
        touchedCount: 0,
        lastContactChecks: {},
        lastCheck: -1,
        wasTold: false,
    }

    contexts[escaper.getId()] = context

    return context
}

/**
 * Arithmetic first, the engine last. Reading a position is one native; asking whether a monster
 * exists, is alive and is shown is three more, and almost every candidate is going to be rejected
 * on distance anyway - those three natives per monster are what made this check too expensive to
 * give to every hero.
 */
const testCandidate = (
    context: ContactContext,
    candidate: unit | undefined,
    contactRadius: number,
    kind: number,
    id: number
) => {
    if (!candidate || contactRadius <= 0) {
        return
    }

    const x = GetUnitX(candidate)
    const y = GetUnitY(candidate)
    const reach = contactRadius + context.heroRadius

    // rejected on one axis at a time, before anything is multiplied
    if (RAbsBJ(x - context.toX) > reach && RAbsBJ(x - context.fromX) > reach) {
        return
    }

    if (RAbsBJ(y - context.toY) > reach && RAbsBJ(y - context.fromY) > reach) {
        return
    }

    if (squaredDistanceToStep(context.fromX, context.fromY, context.toX, context.toY, x, y) > reach * reach) {
        return
    }

    // a removed unit reads as a position of 0, 0, so this still has to be asked before it counts
    if (GetUnitTypeId(candidate) === 0 || !IsUnitAliveBJ(candidate) || IsUnitHidden(candidate)) {
        return
    }

    context.touchedKinds[context.touchedCount] = kind
    context.touchedIds[context.touchedCount] = id
    context.touchedCount++
}

/**
 * The hero whose contacts the chunks are currently being asked about. Held here rather than passed
 * along, so that the very same function can be given to the index at every tick of every hero
 * instead of a new one each time.
 */
const queried = { context: undefined as ContactContext | undefined }

const testChunkEntry = (entry: ChunkEntry) => {
    // a temporarily disabled monster had its immolation taken away: it burns nobody either
    if (queried.context === undefined || entry.monster?.isDisabled()) {
        return
    }

    testCandidate(queried.context, entry.unit, entry.reach, entry.kind, entry.id)
}

/**
 * Everything in the chunks the hero's step went through, at every tier: the monsters of any level,
 * since one is in the index for as long as its unit stands on the map, and the spawned ones, each
 * held by the line it was told to walk. However far the others are, they sit in other chunks and
 * are never heard of.
 */
const testMonstersAround = (context: ContactContext) => {
    queried.context = context

    forEachMonsterAround(context.fromX, context.fromY, context.toX, context.toY, context.heroRadius, testChunkEntry)
}

/**
 * The circle a dead ally leaves behind, which revives them when touched. Its reach is the revive
 * distance rather than its collision size: the circle is a dummy unit, whose collision is nothing,
 * and it is its immolation that used to catch the hero.
 */
const testPowerCircles = (context: ContactContext) => {
    getUdgEscapers().forAll(other => {
        if (other === context.escaper) {
            return
        }

        const circle = other.getDummyPowerCircle()

        testCandidate(context, circle, Constants.COOP_REVIVE_DIST, CONTACT_KIND.powerCircle, other.getId())
    })
}

/**
 * A hero carried by an effect is only known to the machine of its player, which has to tell the
 * others what it touched. Any other hero is on every machine, which all find the very same
 * contacts: they are handled where they are found, and the network hears nothing.
 */
const isToldOverTheNetwork = (escaper: Escaper) => escaper.isHeroAsEffect()

const checkEscaperContacts = (escaper: Escaper) => {
    const context = getContext(escaper)
    const isTold = isToldOverTheNetwork(escaper)

    // where it was at the previous check, so that the step is swept rather than its arrival tested
    context.fromX = context.toX
    context.fromY = context.toY
    context.toX = escaper.getHeroX()
    context.toY = escaper.getHeroY()
    context.heroRadius = escaper.getHeroCollisionSize()
    context.touchedCount = 0

    const stepX = context.toX - context.fromX
    const stepY = context.toY - context.fromY

    // A step is only a step if it follows the previous check, taken the same way: a hero coming
    // back from an async slide, or one this machine had stopped looking at, seems to have crossed
    // the map since. And a step that long was not walked either - revived, teleported or taken to
    // another level - so nothing standing on the way was touched: only where it landed counts.
    if (
        context.lastCheck !== state.checkCount - 1 ||
        context.wasTold !== isTold ||
        stepX * stepX + stepY * stepY > MAX_SWEPT_STEP * MAX_SWEPT_STEP
    ) {
        context.fromX = context.toX
        context.fromY = context.toY

        // and nothing touched before still counts as touched: a machine that was not looking then
        // would handle again what this one takes for the same contact
        context.lastContactChecks = {}
    }

    context.lastCheck = state.checkCount
    context.wasTold = isTold

    testMonstersAround(context)
    testPowerCircles(context)

    // Handled once everything has been walked, rather than as each contact is found: what is read
    // must not change under the reader. What follows a contact belongs to the game, so it has to
    // happen on every machine on the same turn - either because every machine just found it too,
    // or because the only machine that could find it tells them all, this one included.
    for (let i = 0; i < context.touchedCount; i++) {
        const kind = context.touchedKinds[i]
        const id = context.touchedIds[i]
        const contactKey = kind * CONTACT_KEY_KIND_FACTOR + id
        const lastContactCheck = context.lastContactChecks[contactKey]

        // the same thing again, so soon: the hero has not left it yet, nothing new happened
        if (lastContactCheck !== undefined && state.checkCount - lastContactCheck < CONTACT_REPEAT_CHECKS) {
            continue
        }

        context.lastContactChecks[contactKey] = state.checkCount

        if (isTold) {
            const heroZ = escaper.getHeroZ()

            anticipateKillingContact(escaper, kind, id, heroZ)
            sendAsyncContact(escaper.getId(), kind, id, heroZ)
        } else {
            applyContactInItsOwnThread(escaper.getId(), kind, id)
        }
    }
}

/**
 * Every hero of the game once the check is given all of them, and the one this machine carries as
 * an effect in any case. The hero an effect carries elsewhere is left to its own machine: this one
 * only believes it where the last packet put it.
 */
const isCheckedHere = (escaper: Escaper) => {
    if (escaper.isHeroAsEffect()) {
        return escaper.isAsyncControlledHere()
    }

    return state.isEnabledForEveryHero
}

export const initContactCheck = () => {
    if (state.isInitialized) {
        return
    }

    state.isInitialized = true

    contactThread.trigger = createEvent({
        events: [],
        actions: [() => applyContact(contactThread.escaperId, contactThread.kind, contactThread.id)],
    })

    createTimer(CONTACT_CHECK_PERIOD, true, () => {
        state.checkCount++

        getUdgEscapers().forAll(escaper => {
            // A hero whose death is already told is left alone: whatever killed it is still there,
            // and announcing it again would tell every machine to handle the same contact twice.
            if (isCheckedHere(escaper) && escaper.isAlive() && !escaper.isAsyncDeathPending()) {
                checkEscaperContacts(escaper)
            }
        })
    })
}
