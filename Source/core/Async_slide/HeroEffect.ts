import { EffectUtils } from 'Utils/EffectUtils'
import { GetLocZ } from 'Utils/LocationUtils'
import { createEvent } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../globals'
import { EscaperEffectFunctions } from '../04_STRUCTURES/Escaper/EscaperEffect_functions'
import { Natives } from '../wc3_natives_unsecured/Natives'

/**
 * The effect the left click test moves, so that the ways of catching a click can be compared on
 * the same object: whichever one just moved it is the one that reacted.
 *
 * It is created on demand, by the "-testLeftClicks" command, and on every machine: a handle
 * creation may never be local only. Only its position is allowed to diverge afterwards.
 */
const heroEffect = {
    effect: undefined as effect | undefined,
}

/** Per player, as each one turns the test on for themselves */
const testLeftClicks: { [escaperId: number]: boolean } = {}

export const isTestingLeftClicks = (escaperId: number) => testLeftClicks[escaperId] === true

/**
 * Made on every machine, as a handle has to be, but only seen by the players testing: the others
 * would watch it sit where it was made, moved by clicks they cannot see. Only a look, so it may
 * differ from one machine to another.
 */
const refreshHeroEffectVisibility = () => {
    heroEffect.effect &&
        BlzSetSpecialEffectAlpha(heroEffect.effect, isTestingLeftClicks(GetPlayerId(GetLocalPlayer()!)) ? 255 : 0)
}

/**
 * Creates the model of the "-effect light" command on the hero of that player, and destroys it
 * when the test is turned off. Called from a chat command, hence from a synchronized event,
 * hence on every machine at the same moment: the handle comes and goes for everybody at once.
 */
export const setTestLeftClicks = (escaperId: number, isTesting: boolean) => {
    testLeftClicks[escaperId] = isTesting

    if (!isTesting) {
        // as long as somebody else is still testing, the effect has to stay
        for (const [_id, isSomeoneTesting] of pairs(testLeftClicks)) {
            if (isSomeoneTesting) {
                refreshHeroEffectVisibility()

                return
            }
        }

        EffectUtils.destroyEffect(heroEffect.effect)
        heroEffect.effect = undefined

        return
    }

    if (!heroEffect.effect) {
        const escaper = getUdgEscapers().get(escaperId)
        const modelName = EscaperEffectFunctions.String2EffectStr('light')

        if (escaper?.getHero() && modelName) {
            heroEffect.effect = EffectUtils.addSpecialEffect(modelName, escaper.getHeroX(), escaper.getHeroY())
        }
    }

    refreshHeroEffectVisibility()
}

/** Teleports the effect, on the terrain surface. Creates no handle: local only calls are safe. */
export const setHeroEffectPosition = (x: number, y: number) => {
    heroEffect.effect && BlzSetSpecialEffectPosition(heroEffect.effect, x, y, GetLocZ(x, y))
}

/**
 * Last position of the mouse of the local player, tracked apart because neither a frame event
 * nor a key event carries coordinates.
 *
 * Local only: every machine writes the position of its own player, so it may never be read by
 * synced logic. The mouse move event does keep giving terrain coordinates over a frame.
 */
/**
 * Last position of the mouse of every player, tracked apart because neither a frame event nor a
 * key event carries coordinates.
 *
 * The mouse move event is synchronized, so every machine knows where every player points: these
 * positions are the same everywhere and can feed synced logic, unlike the asynchronous lattice.
 * They are just as late as the network is.
 *
 * That is also what makes it costly: the mouse of every player travels to every machine, through
 * the same queue as the orders, and the game waits for the slowest of them. The trigger of a
 * player is therefore created when something starts reading their mouse and destroyed when
 * nothing does any more. Disabling it is not enough: the game sends the mouse over because the
 * event is registered, not because the trigger acts on it, which is why Follow_mouse destroys its
 * own rather than turning it off.
 */
const mousePositions: { [escaperId: number]: { x: number; y: number } } = {}
const mouseTriggers: { [escaperId: number]: trigger } = {}

const createMouseTrigger = (escaperId: number) => {
    const escaper = getUdgEscapers().get(escaperId)

    if (!escaper) {
        return
    }

    mouseTriggers[escaperId] = createEvent({
        events: [t => TriggerRegisterPlayerEvent(t, escaper.getPlayer(), EVENT_PLAYER_MOUSE_MOVE)],
        actions: [
            () => {
                const x = BlzGetTriggerPlayerMouseX()
                const y = BlzGetTriggerPlayerMouseY()

                if (x === 0 && y === 0) {
                    // the mouse is not over the terrain (UI, minimap...)
                    return
                }

                mousePositions[GetPlayerId(Natives.UGetTriggerPlayer())] = { x, y }
            },
        ],
    })
}

/**
 * Whether the mouse of that player is worth carrying over the network. Decided from what the
 * commands set, which every machine knows alike, so they all listen to the same players and their
 * handles come and go together.
 */
export const setMouseTrackingEnabled = (escaperId: number, isEnabled: boolean) => {
    const existing = mouseTriggers[escaperId]

    if (isEnabled === (existing !== undefined)) {
        return
    }

    if (!isEnabled) {
        DestroyTrigger(existing)
        delete mouseTriggers[escaperId]

        return
    }

    createMouseTrigger(escaperId)
}

/** Undefined until that player has had their mouse over the terrain at least once */
export const getMousePosition = (escaperId: number) => mousePositions[escaperId]

/** Same thing for the player sitting in front of this machine */
export const getLocalMousePosition = () => getMousePosition(GetPlayerId(GetLocalPlayer()!))

/**
 * os.clock() of the last click caught by the asynchronous path, so that the synchronized one can
 * tell how late it arrives for that same click. Local only, like everything it is compared to.
 */
const lastLocalClick = { time: undefined as number | undefined }

export const setLastLocalClickTime = (time: number) => {
    lastLocalClick.time = time
}

/** Reading it consumes it: one synchronized click can only be the twin of one local click */
export const takeLastLocalClickTime = () => {
    const time = lastLocalClick.time
    lastLocalClick.time = undefined

    return time
}
