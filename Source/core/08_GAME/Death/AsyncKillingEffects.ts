import { EffectUtils } from 'Utils/EffectUtils'
import { createTimer } from 'Utils/mapUtils'
import { Timer } from 'w3ts'
import { getUdgMonsterTypes } from '../../../../globals'

/**
 * The killing effect of a monster, for a hero sliding async: shown at once to its own player, and
 * exploding where the hero dies for every player.
 *
 * An effect is an agent, and making or destroying an agent on one machine alone desyncs the game.
 * So every machine makes, for each such player, one effect per killing model any monster type has,
 * and keeps it under the ground at 0, 0. The machine of that player only moves the one it needs onto
 * its hero the moment it is touched, and replays it: moving an effect makes nothing, and may differ
 * from one machine to another. When the hero dies, every machine plays that model on its unit, named
 * by the death packet: see takeKillingEffectModelOfDeath.
 */
const PARKED_Z = -1000

/**
 * How long, on the clock of this machine, the killing effect it showed on its own hero plays before it
 * goes back under the ground: the death comes back from the network long before the effect is over,
 * and taking it away then cut it after a fraction of a second - which looked like no effect at all.
 */
const PREVIEW_SHOWN_DURATION = 2

/** How often the effects shown long enough are looked for */
const PARK_CHECK_PERIOD = 0.1

type KillingEffectPool = {
    /** The killing models the pool was made for, to make it again only when they change */
    signature: string
    models: string[]
    effects: (effect | undefined)[]
}

/** By escaper id, the same on every machine */
const pools: { [escaperId: number]: KillingEffectPool } = {}

/** The pool effect this machine moved onto its own hero, by escaper id: this machine only */
const previewedIndexes: { [escaperId: number]: number } = {}

/** Until when that effect plays, on the clock of this machine: this machine only */
const previewShownUntil: { [escaperId: number]: number } = {}

/** The effects shown for a death that came: left to play to the end, whatever else happens to the hero */
const isPreviewOfDeath: { [escaperId: number]: boolean } = {}

/**
 * Puts back under the ground the effects shown long enough. Made on every machine at once, the first
 * time an async slide starts (see prepareKillingEffects), and only moves effects every machine has.
 */
let parkTimer: Timer | undefined

/** The pool effect of what is killing that hero, for its death packet to name: see rememberKillingEffectOfDeath */
const deathIndexes: { [escaperId: number]: number } = {}

/**
 * A killing effect is seen as a new effect destroyed at once: the model chosen by the mapper plays its
 * opening, and its death if it has one. One made in advance has to look just as new when it is shown:
 * it waits frozen at the start of its animation, and goes back there once shown (see freezeAtStart).
 */
const freezeAtStart = (killingEffect: effect) => {
    // back to the opening, for a model that has one; any other keeps the animation it has
    BlzPlaySpecialEffect(killingEffect, ANIM_TYPE_BIRTH)
    BlzSetSpecialEffectTime(killingEffect, 0)
    BlzSetSpecialEffectTimeScale(killingEffect, 0)
}

const makeParkedEffect = (model: string) => {
    const killingEffect = EffectUtils.addSpecialEffect(model, 0, 0)

    if (killingEffect) {
        BlzSetSpecialEffectZ(killingEffect, PARKED_Z)
        // made now, so that the opening of the model is not played out under the ground
        BlzSetSpecialEffectTimeScale(killingEffect, 0)
    }

    return killingEffect
}

/** Every distinct killing model, in the order of the monster type ids, which every machine walks alike */
const listKillingModels = () => {
    const models: string[] = []
    const isListed: { [model: string]: boolean } = {}

    for (const [_, monsterType] of pairs(getUdgMonsterTypes().getAll())) {
        const model = monsterType.getKillingEffectStr()

        if (model && !isListed[model]) {
            isListed[model] = true
            models[models.length] = model
        }
    }

    return models
}

/**
 * Makes the effects of that player, on every machine at once: called as its hero starts to slide
 * async. Made again only if the killing models of the monster types changed since.
 */
export const prepareKillingEffects = (escaperId: number) => {
    if (!parkTimer) {
        parkTimer = createTimer(PARK_CHECK_PERIOD, true, parkEffectsShownLongEnough)
    }

    const models = listKillingModels()
    const signature = models.join('\n')
    const existing = pools[escaperId]

    if (existing !== undefined && existing.signature === signature) {
        return
    }

    if (existing !== undefined) {
        for (let i = 0; i < existing.models.length; i++) {
            EffectUtils.destroyEffect(existing.effects[i])
        }
    }

    const effects: (effect | undefined)[] = []

    for (let i = 0; i < models.length; i++) {
        effects[i] = makeParkedEffect(models[i])
    }

    pools[escaperId] = { signature, models, effects }
    delete previewedIndexes[escaperId]
    delete deathIndexes[escaperId]
}

/** Where that model sits in the pool of that player, -1 for nowhere: the same answer on every machine */
export const getKillingEffectIndex = (escaperId: number, model: string) => {
    const pool = pools[escaperId]

    return pool === undefined ? -1 : pool.models.indexOf(model)
}

/** Puts back under the ground the effect this machine showed on its hero, if any: this machine only */
export const cancelKillingEffectPreview = (escaperId: number) => {
    const index = previewedIndexes[escaperId]

    delete previewShownUntil[escaperId]
    delete isPreviewOfDeath[escaperId]

    if (index === undefined) {
        return
    }

    delete previewedIndexes[escaperId]

    const killingEffect = pools[escaperId]?.effects[index]

    if (killingEffect) {
        BlzSetSpecialEffectPosition(killingEffect, 0, 0, PARKED_Z)
        freezeAtStart(killingEffect)
    }
}

/** Only moves effects, in whatever order: nothing here is shared with the other machines */
const parkEffectsShownLongEnough = () => {
    const now = os.clock()

    for (const [escaperId, shownUntil] of pairs(previewShownUntil)) {
        if (now >= shownUntil) {
            cancelKillingEffectPreview(escaperId)
        }
    }
}

/**
 * Shows the killing effect of that model where the hero is, on the machine of its player only, the
 * moment it touches what kills it. Moves and replays an effect every machine has: makes nothing.
 */
export const previewKillingEffect = (escaperId: number, model: string, x: number, y: number, z: number) => {
    const index = getKillingEffectIndex(escaperId, model)
    const killingEffect = index === -1 ? undefined : pools[escaperId].effects[index]

    if (killingEffect === undefined) {
        return
    }

    cancelKillingEffectPreview(escaperId)

    BlzSetSpecialEffectPosition(killingEffect, x, y, z)

    // As a new effect destroyed at once: its death for a model that has one, from its start, and the
    // opening it waits frozen at for any other, which asking for a death it has not leaves as it is.
    BlzPlaySpecialEffect(killingEffect, ANIM_TYPE_DEATH)
    BlzSetSpecialEffectTime(killingEffect, 0)
    BlzSetSpecialEffectTimeScale(killingEffect, 1)

    previewedIndexes[escaperId] = index
    previewShownUntil[escaperId] = os.clock() + PREVIEW_SHOWN_DURATION
}

/**
 * What is killing that hero, remembered right before it is killed, for its death packet to name the
 * effect every machine explodes. Written on every machine, read by the machine of that hero only.
 */
export const rememberKillingEffectOfDeath = (escaperId: number, model: string) => {
    deathIndexes[escaperId] = getKillingEffectIndex(escaperId, model)
}

/** The pool index the death packet of that hero names, -1 for none, forgotten once read */
export const takeKillingEffectOfDeath = (escaperId: number) => {
    const index = deathIndexes[escaperId] ?? -1

    delete deathIndexes[escaperId]

    return index
}

/**
 * The model this machine plays on the hero that died, named by its death packet: an effect made on
 * the unit of the hero, now back where every machine agrees it died, and destroyed at once - which is
 * what plays it, on every machine on the same turn. The machine of that hero showed it already the
 * moment it was touched, so it plays no model: the handle is still made there, as a handle has to be
 * made everywhere. Undefined when there is nothing to play, alike on every machine.
 *
 * To be asked before the hero stops being an effect, which forgets what this machine showed.
 */
export const takeKillingEffectModelOfDeath = (escaperId: number, index: number): string | undefined => {
    delete deathIndexes[escaperId]

    const pool = pools[escaperId]
    const isValid = pool !== undefined && index >= 0 && index < pool.models.length
    const wasShownHere = isValid && previewedIndexes[escaperId] === index

    if (wasShownHere) {
        // left to play: it goes back under the ground once shown long enough
        isPreviewOfDeath[escaperId] = true
    } else {
        cancelKillingEffectPreview(escaperId)
    }

    if (!isValid) {
        return undefined
    }

    return wasShownHere ? '' : pool.models[index]
}

/**
 * Nothing shown nor remembered any more for that hero, when it stops sliding as an effect - but the
 * effect of the death that stops it, which plays to the end.
 */
export const forgetKillingEffects = (escaperId: number) => {
    if (!isPreviewOfDeath[escaperId]) {
        cancelKillingEffectPreview(escaperId)
    }

    delete deathIndexes[escaperId]
}
