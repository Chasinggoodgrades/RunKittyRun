import { createEvent, createTimer } from 'Utils/mapUtils'
import { Timer } from 'w3ts'
import { getUdgEscapers } from '../../../globals'
import { Constants } from '../01_libraries/Constants'
import { TurnOnSlide } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/To_turn_on_slide'
import { AfkMode } from '../08_GAME/Afk_mode/Afk_mode'
import { Natives } from '../wc3_natives_unsecured/Natives'
import { getAsyncMousePosition, isAsyncMousePositionFresh, setAsyncMouseActive } from './AsyncMouse'
import { getMousePosition, isTestingLeftClicks } from './HeroEffect'
import { screen2World } from './Screen2World'

/**
 * Made for the slide: on ice the hero is carried along whatever the player does, and all that is
 * controlled is where it looks. So instead of ordering it around, the mode keeps turning it
 * towards the cursor, over and over, while the right click still gives its instant smart order
 * for the parts of the map where one walks.
 *
 * Right click turns it on, left click turns it off.
 *
 * When this is on, the click catcher of "hero-effect-locally-async" is not created: the clicks
 * are read from the synchronized mouse event, the only one that hears the right button. The
 * cursor, on the other hand, still comes from the asynchronous lattice, so the hero faces where
 * the cursor is now rather than where the network says it was a latency ago. That target differs
 * from one machine to another, hence solo only, like the rest of the asynchronous path.
 */
export const AUTO_TURN_MODE = true

/**
 * The slide reads the facing of the hero every SLIDE_PERIOD to know where to carry it, so turning
 * more often than that changes nothing: no one reads it in between.
 */
const AUTO_TURN_PERIOD = Constants.SLIDE_PERIOD

/**
 * off:   nothing is steered, the game behaves as it always did,
 * sync:  the cursor comes from the synchronized mouse event, the same on every machine, and as
 *        late as the network is. No divergence between players,
 * async: the cursor comes from the asynchronous lattice: instant, but only known on the machine
 *        of the player pointing, so it differs from one machine to another.
 */
export type AutoTurnMode = 'off' | 'sync' | 'async'

export const AUTO_TURN_MODES: AutoTurnMode[] = ['off', 'sync', 'async']

/** The mode every player starts the game with, as if each had typed "-autoTurn" with it (see applyDefaultAutoTurnMode) */
export const DEFAULT_AUTO_TURN_MODE: AutoTurnMode = 'async'

const modes: { [escaperId: number]: AutoTurnMode } = {}
/** The mode says where the cursor is read, this says whether the hero is being steered right now */
const steering: { [escaperId: number]: boolean } = {}
const state = { timer: undefined as Timer | undefined }

/**
 * A player sliding async steers with the cursor alone, and gives the game none of the orders the afk
 * mode listens to: they would be taken for afk while playing, and killed with the afk heroes. So once
 * a second, the machine of that player tells every machine that they are still there, as long as
 * their cursor moved on the screen since. On the screen rather than in the world: a locked camera
 * moves the world under a cursor nobody touched.
 */
const ACTIVITY_PREFIX = 'MEC_AHK'
const ACTIVITY_CHECK_TICKS = Math.round(1 / AUTO_TURN_PERIOD)

const activity = { ticks: 0, lastX: -1, lastY: -1 }

const sendActivityIfCursorMoved = () => {
    const localEscaper = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))

    if (!localEscaper?.isAsyncControlledHere() || !isAsyncMousePositionFresh()) {
        return
    }

    const cursor = getAsyncMousePosition()

    if (!cursor || (cursor.x === activity.lastX && cursor.y === activity.lastY)) {
        return
    }

    activity.lastX = cursor.x
    activity.lastY = cursor.y

    BlzSendSyncData(ACTIVITY_PREFIX, '1')
}

export const getAutoTurnMode = (escaperId: number) => modes[escaperId] ?? 'off'

export const isSteering = (escaperId: number) => getAutoTurnMode(escaperId) !== 'off' && steering[escaperId] === true

/** The right click hands the steering to the mouse, the left click gives it back */
export const setAutoTurnSteering = (escaperId: number, isOn: boolean) => {
    steering[escaperId] = isOn
}

/** Where that player points, according to the mode they chose */
const getCursorWorldPosition = (escaperId: number) => {
    if (getAutoTurnMode(escaperId) === 'async') {
        // The lattice only knows about the cursor of this machine, and nothing else is needed:
        // where an async hero looks is told to the others ten times a second, so they have nothing
        // to aim for it. Their own guess would fight the packets, and the mouse of that player
        // would have to cross the network for nothing.
        if (escaperId !== GetPlayerId(GetLocalPlayer()!)) {
            return undefined
        }

        // Turned on as the slide starts, the lattice still sits where it starts from, the center of the
        // screen - about where the hero is, so aiming there throws it any way. Nothing is steered
        // until the cursor is found: on a reverse slide, that stray turn sent the hero back out.
        if (!isAsyncMousePositionFresh()) {
            return undefined
        }

        const asyncMouse = getAsyncMousePosition()

        return asyncMouse && screen2World(asyncMouse.x, asyncMouse.y)
    }

    return getMousePosition(escaperId)
}

const turnSliderTowardsCursor = (escaperId: number) => {
    const escaper = getUdgEscapers().get(escaperId)
    const hero = escaper?.getHero()

    // only while sliding: on normal ground the hero is ordered around, not steered
    if (!escaper || !hero || !escaper.isSliding()) {
        return
    }

    // The asynchronous cursor only ever steers the effect, which its own machine moves alone. A hero
    // sliding as a unit - its body carried on after its death, or revived on the ice - is the same
    // on every machine, and turning it from a cursor only this machine knows desyncs the game.
    if (getAutoTurnMode(escaperId) === 'async' && !escaper.isHeroAsEffect()) {
        return
    }

    const target = getCursorWorldPosition(escaperId)

    if (!target) {
        return
    }

    // from where the hero really is: its unit only follows the packets, a packet behind, while it slides
    const angle = Atan2(target.y - escaper.getHeroY(), target.x - escaper.getHeroX()) * bj_RADTODEG

    // not SetUnitFacing, which turns progressively, and not BlzSetUnitFacingEx either: this is
    // what the map itself uses, and it honours what the terrain allows (canTurn, canTurnAngle,
    // drunk mode, secondary heroes)
    // only this machine makes this call in async mode: it must not draw anything the others would not
    TurnOnSlide.turnSliderToDirection(escaper, angle, null, getAutoTurnMode(escaperId) === 'async')
}

/**
 * The lattice covers the cursor with frames, and those swallow the clicks they cover. But on ice
 * the hero is carried along and nobody clicks, while on walkable ground clicking is everything
 * and the cursor needs no local reading. So the lattice only runs while the hero of this machine
 * is actually sliding, which costs no click at all.
 *
 * The left click test is the exception: it is there to be clicked on, wherever the hero stands.
 */
const updateAsyncMouseNeed = () => {
    const localEscaperId = GetPlayerId(GetLocalPlayer()!)
    const isSlidingWithAsyncTurn =
        getAutoTurnMode(localEscaperId) === 'async' && getUdgEscapers().get(localEscaperId)?.isSliding() === true

    setAsyncMouseActive(isTestingLeftClicks(localEscaperId) || isSlidingWithAsyncTurn)
}

/** One timer for everybody: it is created once and never destroyed, so no handle comes and goes */
const startAutoTurnTimer = () => {
    if (state.timer) {
        return
    }

    // made with the timer, from the command every machine hears: every machine resets the afk timer
    // of the player who sent it, read from the event itself
    createEvent({
        events: [
            t => {
                for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
                    BlzTriggerRegisterPlayerSyncEvent(t, Natives.UPlayer(i), ACTIVITY_PREFIX, false)
                }
            },
        ],
        actions: [() => AfkMode.resetAfk(GetPlayerId(Natives.UGetTriggerPlayer()))],
    })

    state.timer = createTimer(AUTO_TURN_PERIOD, true, () => {
        updateAsyncMouseNeed()

        activity.ticks++

        if (activity.ticks >= ACTIVITY_CHECK_TICKS) {
            activity.ticks = 0
            sendActivityIfCursorMoved()
        }

        getUdgEscapers().forAll(escaper => {
            escaper.updateHeroEffect()

            if (isSteering(escaper.getId())) {
                turnSliderTowardsCursor(escaper.getId())
            }
        })
    })
}

export const setAutoTurnMode = (escaperId: number, mode: AutoTurnMode) => {
    modes[escaperId] = mode

    // steering right away, so the mode can be tried without having to right click first
    steering[escaperId] = mode !== 'off'

    if (mode !== 'off') {
        startAutoTurnTimer()
    }

    // The Escaper owns the hand over from there on: it happens wherever the sliding state
    // changes, and the command may well land in the middle of a slide.
    getUdgEscapers()
        .get(escaperId)
        ?.setAsyncSlideEnabled(mode === 'async')
}
