import { createTimer } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../globals'
import { arrayPush } from '../01_libraries/Basic_functions'
import { getAsyncMousePosition, initAsyncMouse } from './AsyncMouse'
import { getFullScreenFrameParent, getScreenWidth } from './FrameParent'
import { getLocalMousePosition, isTestingLeftClicks, setHeroEffectPosition, setLastLocalClickTime } from './HeroEffect'
import { initScreen2World, screen2World } from './Screen2World'

/**
 * Clicking moves this effect instantly, on the screen of the clicking player only. Fully
 * asynchronous: not one event is involved, as every input event of WC3 is turn gated.
 *
 *  - the click is detected by polling the "control push" child backdrop of a templated button,
 *    which the game shows client side, immediately, while the button is held down. Technique
 *    from "Async Buttons" by Antares (scripts/AsyncButtons.lua),
 *  - the cursor position comes from the lattice of ./async/AsyncMouse, in screen coordinates,
 *  - which ./async/Screen2World turns into a world point, through the local camera.
 *
 * Everything read here is local, so each player moves their own copy of the effect and nothing
 * may feed synced logic.
 */
const DEBUG = false
/** The click line itself, the only log left in normal use */

/**
 * Frames must not be created while the map is still initializing, so everything here waits.
 * The two pieces are switchable apart, to tell which one is at fault when the game misbehaves.
 */
/**
 * Orders the hero from here, as soon as the click is read, rather than waiting for the
 * synchronized event: the hero starts moving one latency earlier.
 *
 * SOLO ONLY, and off for that reason. An order changes the state of the game, so giving it on one
 * machine only makes the simulations diverge and desyncs a multiplayer game within seconds.
 * "hero-effect-on-network" gives the same order for everybody, and skips the left click while this
 * is on. Turn it on to measure what a latency of advance feels like, alone.
 */
const ISSUE_ORDER_LOCALLY = false

const INIT_DELAY = 3
const ENABLE_ASYNC_MOUSE = true
const ENABLE_CLICK_CATCHER = true
/**
 * Polls every frame of the catcher and reports whatever changes, to find which one carries a
 * given state. Measured with it: a right click changes nothing at all in the catcher, on any of
 * its frames, although the catcher does swallow that click. The game draws no pressed state for
 * the right button, so there is nothing to read locally: the right click cannot be caught this
 * way, and is left to the synchronized path of "hero-effect-on-network".
 */
const PROBE_RIGHT_CLICK = false
const PROBE_MAX_DEPTH = 3
const PROBE_MAX_FRAMES = 64

/**
 * Path of the control push backdrop, inside the button template: the game shows that frame while
 * the button is held down, and hides frame "0", the idle backdrop, at the same time.
 * Found in game by polling the whole subtree of a "ScriptDialogButton": adapt it for any other
 * template, as the indexes are template specific.
 */
const PUSH_BACKDROP_FRAME_INDEX = 1

const BUTTON_TEMPLATE = 'ScriptDialogButton'
const POLL_INTERVAL = 0.005
/** Delay between the steps of the catcher creation, so the last log tells where it crashed */
const STEP_DELAY = 1
/** 0 hides the catcher. 255 shows the button template, to see whether it reacts to the clicks. */
const CATCHER_ALPHA = 0

const FRAME_WIDTH_4_3 = 0.8
const FRAME_HEIGHT = 0.6
const BOTTOM_UI_PANEL_HEIGHT = 0.17
/** The bottom panel of the game overflows the 4:3 area a little, and must stay clickable */
const BOTTOM_UI_PANEL_OVERHANG = 0.03
/**
 * The game plays its button sound when the catcher is released, not when it is pressed, so
 * defocusing it on the press changes nothing: it is enabled again long before the release. The
 * button is therefore disabled on the press and only enabled again later, once the finger is
 * expected to be up. That also means no press can be caught during that delay.
 *
 * Off by default: disabling a full screen frame disturbs the mouse focus, hence the tooltips of
 * the lattice, hence the position the effect is sent to.
 */
const SILENCE_CLICK_SOUND = false
const SILENCE_REENABLE_DELAY = 0.15
/** Disabling the button makes the pushed backdrop flicker, so a second press is ignored for that long */
const PRESS_COOLDOWN = 0.05

const TEAL = '|cff1ce6b9'

const debugPrint = (message: string) => {
    if (DEBUG) {
        print(message)
    }
}

/** The local click, in teal, to tell it apart from its synchronized counterpart at a glance */
const printLocalClick = (message: string) => {
    print(TEAL + message + '|r')
}

type CatcherBounds = { left: number; bottom: number; right: number; top: number }

/**
 * The catchers are created for everybody, since a handle creation may never be local only, but
 * they start hidden. Disabling them is not enough: a disabled frame still takes up the screen and
 * still swallows the clicks that land on it, which cost the right click of the whole game.
 *
 * "-testLeftClicks" shows them, on the machine of the player running the test only, which is safe
 * as a frame is pure interface and belongs to no shared state.
 */
const catcherButtons: framehandle[] = []

export const setClickCatcherEnabled = (isEnabled: boolean) => {
    for (const button of catcherButtons) {
        BlzFrameSetVisible(button, isEnabled)
        BlzFrameSetEnable(button, isEnabled)
    }
}

/**
 * The parts of the screen the clicks are caught on: the 3D view, plus the two bottom corners of
 * a wide screen, where the terrain shows on either side of the game panel. The panel itself is
 * left alone, so the command card, the minimap and the inventory keep working.
 */
const getCatcherBounds = () => {
    const sideBandWidth = (getScreenWidth() - FRAME_WIDTH_4_3) / 2
    const bounds: CatcherBounds[] = [
        {
            left: -sideBandWidth,
            bottom: BOTTOM_UI_PANEL_HEIGHT,
            right: FRAME_WIDTH_4_3 + sideBandWidth,
            top: FRAME_HEIGHT,
        },
    ]

    // a 4:3 screen has no side band, hence no terrain next to the panel
    if (sideBandWidth > BOTTOM_UI_PANEL_OVERHANG) {
        arrayPush(bounds, {
            left: -sideBandWidth,
            bottom: 0,
            right: -BOTTOM_UI_PANEL_OVERHANG,
            top: BOTTOM_UI_PANEL_HEIGHT,
        })
        arrayPush(bounds, {
            left: FRAME_WIDTH_4_3 + BOTTOM_UI_PANEL_OVERHANG,
            bottom: 0,
            right: FRAME_WIDTH_4_3 + sideBandWidth,
            top: BOTTOM_UI_PANEL_HEIGHT,
        })
    }

    return bounds
}

/** The button has to stay visible to receive the mouse, so it is made fully transparent instead */
const createCatcherButton = (bounds: CatcherBounds) => {
    // not the game UI: its children cannot leave the 4:3 center of the screen
    const button = BlzCreateFrame(BUTTON_TEMPLATE, getFullScreenFrameParent(), 0, 0)

    if (!button) {
        return undefined
    }

    BlzFrameSetAbsPoint(button, FRAMEPOINT_BOTTOMLEFT, bounds.left, bounds.bottom)
    BlzFrameSetAbsPoint(button, FRAMEPOINT_TOPRIGHT, bounds.right, bounds.top)
    BlzFrameSetAlpha(button, CATCHER_ALPHA)
    BlzFrameSetVisible(button, false)
    BlzFrameSetEnable(button, false)

    return button
}

/** The frame the game shows while the button is held down */
const getPushBackdrop = (button: framehandle) => {
    const childrenCount = BlzFrameGetChildrenCount(button)

    if (PUSH_BACKDROP_FRAME_INDEX >= childrenCount) {
        return undefined
    }

    const pushBackdrop = BlzFrameGetChild(button, PUSH_BACKDROP_FRAME_INDEX)

    if (!pushBackdrop || GetHandleId(pushBackdrop) === 0) {
        return undefined
    }

    for (let i = 0; i < childrenCount; i++) {
        const child = BlzFrameGetChild(button, i)

        child && BlzFrameSetAlpha(child, CATCHER_ALPHA)
    }

    return pushBackdrop
}

/**
 * A clicked button keeps the keyboard focus: it then eats the arrow keys, and the enter key
 * activates it again, which reads as a click that was never made. Disabling and enabling it back
 * drops that focus. Same trick as DefocusFrame in scripts/AsyncButtons.lua.
 */
const defocusCatcher = (button: framehandle) => {
    BlzFrameSetEnable(button, false)
    BlzFrameSetEnable(button, true)
}

const onPressDetected = (button: framehandle) => {
    if (SILENCE_CLICK_SOUND) {
        // a disabled button is not activated on release, so the game plays no sound for it, and
        // it loses the keyboard focus on the way
        BlzFrameSetEnable(button, false)
        createTimer(SILENCE_REENABLE_DELAY, false, () => {
            // the test may have been turned off in between, and the catcher must stay quiet then
            if (isTestingLeftClicks(GetPlayerId(GetLocalPlayer()!))) {
                BlzFrameSetEnable(button, true)
            }
        })
    } else {
        defocusCatcher(button)
    }

    const mouse = getAsyncMousePosition()

    if (!mouse) {
        debugPrint('press, but the asynchronous mouse has no position yet.')
        return
    }

    const world = screen2World(mouse.x, mouse.y)

    if (!world) {
        debugPrint(`press at screen ${mouse.x}, ${mouse.y}, but the ray found no terrain point.`)
        return
    }

    const clickTime = os.clock()
    setLastLocalClickTime(clickTime)

    // the effect and the two log lines only exist for whoever asked for the test, the order below
    // is what the click really does
    if (isTestingLeftClicks(GetPlayerId(GetLocalPlayer()!))) {
        // the synchronized position is the true one, so the gap is what the screen to world
        // conversion (and the lattice feeding it) costs in accuracy
        const syncedMouse = getLocalMousePosition()
        const errorX = syncedMouse && math.floor(world.x - syncedMouse.x)
        const errorY = syncedMouse && math.floor(world.y - syncedMouse.y)

        printLocalClick(
            `LOCAL left click at ${math.floor(world.x)}, ${math.floor(world.y)} ` +
                `(t = ${math.floor(clickTime * 1000)} ms, ecart ${errorX}, ${errorY})`
        )

        setHeroEffectPosition(world.x, world.y)
    }

    if (ISSUE_ORDER_LOCALLY) {
        const hero = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))?.getHero()

        hero && IssuePointOrder(hero, 'smart', world.x, world.y)
    }
}

/**
 * Creating the catcher crashed the game, so every step is spaced out and announced: whatever
 * the last line printed before a crash is, that is the call that brought the game down.
 */
/** Reports every visibility change inside the catcher, to see what a right click does to it */
const probeEveryFrameOf = (button: framehandle) => {
    const frames: { path: string; frame: framehandle; wasVisible: boolean }[] = []

    const explore = (frame: framehandle, path: string, depth: number) => {
        if (depth > PROBE_MAX_DEPTH || frames.length >= PROBE_MAX_FRAMES) {
            return
        }

        const childrenCount = BlzFrameGetChildrenCount(frame)

        for (let i = 0; i < childrenCount; i++) {
            const child = BlzFrameGetChild(frame, i)

            if (!child || GetHandleId(child) === 0 || frames.length >= PROBE_MAX_FRAMES) {
                continue
            }

            const childPath = path === '' ? `${i}` : `${path}.${i}`

            arrayPush(frames, { path: childPath, frame: child, wasVisible: BlzFrameIsVisible(child) })
            explore(child, childPath, depth + 1)
        }
    }

    explore(button, '', 1)

    debugPrint(`right click probe: watching ${frames.length} frames of the catcher.`)

    createTimer(POLL_INTERVAL, true, () => {
        for (const watched of frames) {
            const isVisible = BlzFrameIsVisible(watched.frame)

            if (isVisible !== watched.wasVisible) {
                watched.wasVisible = isVisible
                debugPrint(`right click probe: frame ${watched.path} became ${isVisible ? 'shown' : 'hidden'}`)
            }
        }
    })
}

const initClickCatcher = () => {
    const catchers: { button: framehandle; pushBackdrop: framehandle; wasPushed: boolean }[] = []

    for (const bounds of getCatcherBounds()) {
        const button = createCatcherButton(bounds)

        if (!button) {
            print(`hero-effect-locally-async: the "${BUTTON_TEMPLATE}" button could not be created.`)
            return
        }

        const pushBackdrop = getPushBackdrop(button)

        if (!pushBackdrop) {
            print(`hero-effect-locally-async: the button has no child ${PUSH_BACKDROP_FRAME_INDEX} to poll.`)
            return
        }

        arrayPush(catchers, { button, pushBackdrop, wasPushed: BlzFrameIsVisible(pushBackdrop) })
        arrayPush(catcherButtons, button)
    }

    debugPrint(`polling the pushed backdrop of ${catchers.length} catchers...`)

    if (PROBE_RIGHT_CLICK) {
        probeEveryFrameOf(catchers[0].button)
    }

    let lastPressTime = 0
    let wasListening = false

    createTimer(POLL_INTERVAL, true, () => {
        // Two hundred readings a second, for a press only whoever asked for it has any use of:
        // nothing else reads a locally caught click, so nobody else pays for it. The frames stay,
        // since creating them mid game is what crashed the map.
        const isListening = isTestingLeftClicks(GetPlayerId(GetLocalPlayer()!))

        if (!isListening) {
            wasListening = false
            return
        }

        if (!wasListening) {
            // nothing was read while nobody was listening: what the frames show now is the ground
            // to compare against, not a press that just happened
            wasListening = true

            for (const catcher of catchers) {
                catcher.wasPushed = BlzFrameIsVisible(catcher.pushBackdrop)
            }

            return
        }

        for (const catcher of catchers) {
            const isPushed = BlzFrameIsVisible(catcher.pushBackdrop)

            if (isPushed === catcher.wasPushed) {
                continue
            }

            catcher.wasPushed = isPushed

            // the release is of no interest here
            if (!isPushed) {
                continue
            }

            if (os.clock() - lastPressTime < PRESS_COOLDOWN) {
                continue // the pushed backdrop flickering after a defocus, not a new press
            }

            lastPressTime = os.clock()
            onPressDetected(catcher.button)
        }
    })
}

const initAfterMapStart = () => {
    if (ENABLE_ASYNC_MOUSE) {
        initAsyncMouse()
        initScreen2World()
    }

    if (!ENABLE_CLICK_CATCHER) {
        debugPrint('click catcher disabled, only the asynchronous mouse is running.')
        return
    }

    createTimer(STEP_DELAY, false, initClickCatcher)
}

export const initAsyncSlideInput = () => {
    // what tells the contacts and finds them is started by initializers(): it is what a game runs
    // on now, not a test of one
    createTimer(INIT_DELAY, false, initAfterMapStart)
}
