import { GetLocZ } from 'Utils/LocationUtils'
import { createTimer } from 'Utils/mapUtils'
import { arrayPush } from '../01_libraries/Basic_functions'
import { Natives } from '../wc3_natives_unsecured/Natives'
import { getFullScreenFrameParent, getScreenWidth } from './FrameParent'
import { getLocalMousePosition } from './HeroEffect'
import { world2Screen } from './Screen2World'

/**
 * Asynchronous mouse position, in screen (frame) coordinates: the center of the screen is
 * (0.4, 0.3). Ported from "Perfect Async Mouse Screen XY" by ModdieMads
 * (scripts/perfectMouseAsync.lua), with two changes:
 *  - the tiles are normal by-type frames rather than the simple frames of an imported .toc/.fdf
 *    template, as MEC is injected into maps it cannot add files to. Simple frames turned out to
 *    be unusable here anyway: a by-type SIMPLEBUTTON keeps the hit area of its parent, so the
 *    first tile created covers the whole screen and shadows every other one,
 *  - the demo graphics and the stabilized (buffered) getters are left out.
 *
 * How it works: a tooltip attached to a simple button is marked visible by the game, locally,
 * while the cursor hovers that button. BlzFrameIsVisible on it is therefore a local mouse
 * sensor, needing no event, hence no latency. A lattice of such tiles is laid out around the
 * last known position, fine in the middle and coarse further away, and re-centers itself on
 * every hit, so it converges on the cursor.
 *
 * Visible frames swallow the mouse, so the lattice is only shown one tick out of FLICKER_TICKS:
 * the hover state of a tile keeps updating while it is invisible, which is the trick that makes
 * the whole thing possible. A click landing exactly on a flicker tick is still lost.
 *
 * Asynchronous: the position differs from one machine to another and may never feed synced logic.
 */

const DEBUG = false

/**
 * Debug mode: instead of the lattice, one single big tile is created on the left of the screen,
 * with the same tooltip trick. Hovering it must turn its tooltip visible, and leaving it must
 * turn it invisible again. Everything else here is built on that assumption, so it is worth
 * checking on its own before blaming the lattice.
 */
const PROBE_MODE = false
const PROBE_REPORT_PERIOD = 0.5
/** Reports what the lattice is doing, to tell a dead tracker from a working one */
const DEBUG_REPORT_PERIOD = 2

const TICK = 0.001
/**
 * A tile that just moved needs that long before its hover state is up to date. The original
 * counts 25 ticks of its 0.001 timer instead, which only holds if a tick really lasts a
 * millisecond: here they turned out to be much shorter, so the delay is kept in seconds.
 */
const FLICKER_DELAY = 0.025
/**
 * A visible tile swallows the clicks it covers, so the lattice can be hidden again after that
 * many ticks without a hit, rather than staying in the way. 0 keeps it visible until it finds
 * the cursor, which is what the original does, and what tracks best: hiding the tiles too eagerly
 * costs the hover reads the lattice lives on.
 */
const MAX_VISIBLE_TICKS = 0

/**
 * The lattice only hides itself so that it stops swallowing the clicks. When nothing needs a
 * click to reach the game any more, which is what AUTO_ORDERS_MODE is about, it can stay visible
 * for good: that spares 416 visibility calls per cycle, so more ticks per second, so a faster
 * convergence. It does not lower the floor, which is the delay a moved tile needs before its
 * hover state can be trusted (FLICKER_DELAY).
 */
const KEEP_TRACKER_VISIBLE = false
const SCREEN_SIZE_CHECK_PERIOD_TICKS = 512
const ERROR_BOUND = 0.15
/** The tiles must stay above anything they share the screen with, or they get no cursor at all */
const TILE_FRAME_LEVEL = 5

const BASE_SIZE = 0.002
const LEVELS = 6
const TILE_GAPS = [3, 3, 3, 1, 1, 1]
const TILE_COLUMNS = [9, 9, 7, 3, 3, 3]
const TILE_SIZES = [
    BASE_SIZE,
    3 * BASE_SIZE,
    3 * 3 * BASE_SIZE,
    7 * 3 * 3 * BASE_SIZE,
    3 * 7 * 3 * 3 * BASE_SIZE,
    3 * 3 * 7 * 3 * 3 * BASE_SIZE,
]

/** Position of every tile in the lattice, relative to its center. Fixed once and for all. */
const tilePositions: { level: number; size: number; dx: number; dy: number }[] = []

/** tiles[i] is the tile of tilePositions[i]: both arrays must stay aligned */
const tiles: { button: framehandle; tooltip: framehandle }[] = []

const state = {
    isRunning: false,
    /** Nothing reads the cursor most of the time, and a visible tile swallows the clicks it covers */
    isActive: false,
    /**
     * Whether the lattice has found the cursor since it was last turned on. Until then it only
     * knows where it starts from, the center of the screen, which is not where anybody points.
     */
    isPositionFresh: false,
    // position of the cursor, relative to the center of the screen
    rawX: 0,
    rawY: 0,
    // same position, in frame coordinates
    frameX: 0.4,
    frameY: 0.3,
    screenWidth: 0,
    screenAspectRatio: 4 / 3,
    globalTick: 0,
    tickRateStartTime: 0,
    lastReportedMouseX: 0,
    lastReportedMouseY: 0,
    hitsPerLevel: [0, 0, 0, 0, 0, 0],
    lastHitIndex: -1,
    distinctHitIndexes: {} as { [index: number]: boolean },
    /** How many tooltips claim to be visible during a scan: more than one means hover is not what they follow */
    visibleTooltipsDuringScan: 0,
    flickerTime: 0,
    isTrackerVisible: false,
    visibleSinceTick: 0,
    hitCount: 0,
}

/** Center of the screen is (0.4, 0.3), so this is what Screen2World expects */
/**
 * The lattice only earns its cost while something reads it: "-testLeftClicks" and the async mode
 * of "-autoTurn". The rest of the time its tiles are hidden and its loop does nothing, so the
 * clicks reach the game untouched, and nothing is scanned 800 times per second for no one.
 */
export const setAsyncMouseActive = (isActive: boolean) => {
    if (!state.isRunning || state.isActive === isActive) {
        return
    }

    state.isActive = isActive

    if (!isActive) {
        setTrackerVisible(false)
        return
    }

    state.isPositionFresh = false

    // The estimate is wherever it was left, which costs a few cycles of convergence and nothing
    // more: the coarse levels span the whole screen, so a tile sits under the cursor wherever it
    // is, and moving them all here is what refreshes their hover state. No need to drag the
    // cursor back to the center, as the original does on its own start.
    moveTracker(0, 0)
    clearTooltips()
    setTrackerVisible(true)
    state.flickerTime = os.clock() + FLICKER_DELAY
}

export const getAsyncMousePosition = () => (state.isRunning ? { x: state.frameX, y: state.frameY } : undefined)

/** Whether the position above is the cursor, rather than where the lattice started from when turned on */
export const isAsyncMousePositionFresh = () => state.isRunning && state.isActive && state.isPositionFresh

/** Walks the lattice once, skipping its hollow center, where the finer level already sits */
const buildTilePositions = () => {
    for (let level = 0; level < LEVELS; level++) {
        const tileSize = TILE_SIZES[level]
        const columns = TILE_COLUMNS[level]
        const columnCenter = math.floor(columns / 2)
        const gapStart = math.floor((columns - TILE_GAPS[level]) / 2)
        const gapEnd = columns - gapStart

        for (let row = 0; row < columns; row++) {
            for (let column = 0; column < columns; column++) {
                const isInHollowCenter = row >= gapStart && row < gapEnd && column >= gapStart && column < gapEnd

                if (!isInHollowCenter) {
                    arrayPush(tilePositions, {
                        level,
                        size: tileSize,
                        dx: tileSize * (column - columnCenter),
                        dy: -tileSize * (row - columnCenter),
                    })
                }
            }
        }
    }
}

const setTrackerVisible = (isVisible: boolean) => {
    state.isTrackerVisible = isVisible

    for (const tile of tiles) {
        BlzFrameSetVisible(tile.button, isVisible)
    }
}

/**
 * A tooltip left visible would be found by every later scan, and the lattice would keep
 * recentering on that one tile: the whole state is therefore wiped before each new scan, so that
 * a visible tooltip can only mean the cursor is over that tile right now.
 */
const clearTooltips = () => {
    for (const tile of tiles) {
        BlzFrameSetVisible(tile.tooltip, false)
    }
}

/** Re-centers the whole lattice on the given position, given relative to the center of the screen */
const moveTracker = (rawX: number, rawY: number) => {
    const saneX = (1.666667 * (rawX + 0.3 * state.screenAspectRatio)) / state.screenAspectRatio
    const saneY = 1 - 1.666667 * (rawY + 0.3)

    // the lattice was shaken off the screen: start over from the center
    if (saneX > 1 + ERROR_BOUND || saneY > 1 + ERROR_BOUND || saneX < -ERROR_BOUND || saneY < -ERROR_BOUND) {
        if (rawX !== 0 || rawY !== 0) {
            moveTracker(0, 0)
        }

        return
    }

    state.rawX = rawX
    state.rawY = rawY
    state.frameX = rawX + 0.4
    state.frameY = rawY + 0.3

    for (let i = 0; i < tiles.length; i++) {
        const position = tilePositions[i]

        BlzFrameSetAbsPoint(tiles[i].button, FRAMEPOINT_CENTER, state.frameX + position.dx, state.frameY + position.dy)
    }
}

/** Looks for the tile the cursor is on, and re-centers the lattice there. True when it found it. */
const updateTracker = () => {
    let hitIndex = -1
    let visibleTooltips = 0

    for (let i = 0; i < tiles.length; i++) {
        if (BlzFrameIsVisible(tiles[i].tooltip)) {
            visibleTooltips++

            if (hitIndex < 0) {
                hitIndex = i
            }
        }
    }

    state.visibleTooltipsDuringScan = visibleTooltips

    if (hitIndex < 0) {
        return false
    }

    const hit = tilePositions[hitIndex]

    // Hide it all at once, so the lattice stops swallowing the mouse and does not fire twice.
    // Every tooltip is wiped, not only the one that hit: a flag left visible would be found by
    // every later scan, and the lattice would keep recentering on that one tile.
    clearTooltips()

    if (!KEEP_TRACKER_VISIBLE) {
        setTrackerVisible(false)
    }

    state.hitCount++
    state.hitsPerLevel[hit.level]++
    state.lastHitIndex = hitIndex
    state.distinctHitIndexes[hitIndex] = true
    state.flickerTime = os.clock() + FLICKER_DELAY

    moveTracker(state.rawX + hit.dx, state.rawY + hit.dy)

    return true
}

/**
 * Creates one tile per position. Everything or nothing: a missing tile would misalign the lattice.
 *
 * Normal frames, not simple ones: only those have a hit area of their own, which is what the
 * tooltip trick needs. They draw nothing, so the lattice stays invisible.
 */
const createTracker = () => {
    // not the game UI: its children cannot leave the 4:3 center of the screen
    const parent = getFullScreenFrameParent()

    for (let i = 0; i < tilePositions.length; i++) {
        const button = BlzCreateFrameByType('BUTTON', `AsyncMouseTile_${i}`, parent, '', 0)

        if (!button) {
            print(`AsyncMouse: tile ${i} could not be created.`)
            return false
        }

        // above the click catcher, which is created later and would shadow the tiles otherwise
        BlzFrameSetLevel(button, TILE_FRAME_LEVEL)
        BlzFrameSetSize(button, tilePositions[i].size, tilePositions[i].size)

        const tooltip = BlzCreateFrameByType('FRAME', `AsyncMouseTooltip_${i}`, button, '', 0)

        if (!tooltip) {
            print(`AsyncMouse: tooltip ${i} could not be created.`)
            return false
        }

        BlzFrameSetTooltip(button, tooltip)
        BlzFrameSetEnable(tooltip, false)
        BlzFrameSetVisible(tooltip, false)

        arrayPush(tiles, { button, tooltip })
    }

    return true
}

const readScreenSize = () => {
    const width = BlzGetLocalClientWidth()

    if (width !== state.screenWidth) {
        state.screenWidth = width
        state.screenAspectRatio = getScreenWidth() / 0.6

        return true
    }

    return false
}

/**
 * What was learnt so far:
 *  - a by-type SIMPLEBUTTON keeps the hit area of its parent, whatever size it is given: the
 *    first one created covers the whole screen and shadows the others, which is why the lattice
 *    only ever hit its tile 0,
 *  - a template simple frame (SimpleInfoPanelIconDamage) is placed where it is asked to, but it
 *    is not a button: it takes no mouse, so its tooltip never shows.
 *
 * Normal frames, on the other hand, do have a hit area of their own: the click catcher of
 * "hero-effect-locally-async" is a by-type BUTTON, and it only swallows the clicks inside its
 * own rectangle. This probe checks whether the tooltip trick works on those, which would give
 * the lattice its tiles without importing anything.
 */
const initHoverProbe = () => {
    const parent = Natives.UBlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)
    const probes: { name: string; tooltip: framehandle }[] = []

    for (const [index, x] of ipairs([0.25, 0.55])) {
        const button = BlzCreateFrameByType('BUTTON', `AsyncMouseProbe_${index}`, parent, '', 0)

        if (!button) {
            print('AsyncMouse probe: a button could not be created.')
            return
        }

        BlzFrameSetSize(button, 0.1, 0.1)
        BlzFrameSetAbsPoint(button, FRAMEPOINT_CENTER, x, 0.3)

        const tooltip = BlzCreateFrameByType('FRAME', `AsyncMouseProbeTooltip_${index}`, button, '', 0)

        if (!tooltip) {
            print('AsyncMouse probe: a tooltip could not be created.')
            return
        }

        BlzFrameSetTooltip(button, tooltip)
        BlzFrameSetEnable(tooltip, false)
        BlzFrameSetVisible(tooltip, false)

        arrayPush(probes, { name: `TILE(${x})`, tooltip })
    }

    print('AsyncMouse probe: two by-type BUTTON tiles, 0.1 wide, at x = 0.25 and 0.55, mid height.')
    print('AsyncMouse probe: hover each one, only the tile under the cursor must light up.')

    createTimer(PROBE_REPORT_PERIOD, true, () => {
        let report = ''

        for (const probe of probes) {
            report += `${probe.name}:${BlzFrameIsVisible(probe.tooltip) ? 'HOVERED' : '-'} `
        }

        print('AsyncMouse probe: ' + report)
    })
}

export const initAsyncMouse = () => {
    if (state.isRunning) {
        return
    }

    if (PROBE_MODE) {
        state.isRunning = true
        initHoverProbe()
        return
    }

    readScreenSize()
    buildTilePositions()

    if (!createTracker()) {
        setTrackerVisible(false)
        return
    }

    state.isRunning = true
    state.tickRateStartTime = os.clock()

    if (DEBUG) {
        print(`AsyncMouse: ${tiles.length} tiles created.`)

        createTimer(DEBUG_REPORT_PERIOD, true, () => {
            const ticksPerSecond = state.globalTick / (os.clock() - state.tickRateStartTime)

            // The synchronized position is the truth, but a whole latency late: while the cursor
            // moves, it describes where it was, not where it is, so it can only be compared to
            // the lattice once the cursor has stopped.
            const syncedMouse = getLocalMousePosition()

            if (!syncedMouse) {
                return
            }

            const hasMoved = syncedMouse.x !== state.lastReportedMouseX || syncedMouse.y !== state.lastReportedMouseY

            state.lastReportedMouseX = syncedMouse.x
            state.lastReportedMouseY = syncedMouse.y

            if (hasMoved) {
                print(`AsyncMouse: ${state.hitCount} hits, ${math.floor(ticksPerSecond)} ticks/s, cursor moving...`)
                return
            }

            const expected = world2Screen(syncedMouse.x, syncedMouse.y, GetLocZ(syncedMouse.x, syncedMouse.y))

            print(
                `AsyncMouse: ${state.hitCount} hits, ${math.floor(ticksPerSecond)} ticks/s, CURSOR STILL: lattice ` +
                    `${state.frameX}, ${state.frameY} vs expected ${expected.x}, ${expected.y}`
            )
            print(`   error ${expected.x - state.frameX}, ${expected.y - state.frameY} (a tile is 0.002 wide)`)

            // a lattice that converges ends up hitting the finest levels: hits staying on the
            // coarse ones mean it never refines, and the error stays as big as those tiles
            let hitsPerLevel = ''

            for (let level = 0; level < LEVELS; level++) {
                hitsPerLevel += `${TILE_SIZES[level]}:${state.hitsPerLevel[level]} `
            }

            print('   hits per tile size ' + hitsPerLevel)

            // A tooltip stuck visible would be found first every time, hiding the coarse levels
            // behind it: one single index hit over and over, or several tooltips visible at once.
            let distinctCount = 0

            for (const [_index, _hit] of pairs(state.distinctHitIndexes)) {
                distinctCount++
            }

            let visibleTooltips = 0

            for (const tile of tiles) {
                if (BlzFrameIsVisible(tile.tooltip)) {
                    visibleTooltips++
                }
            }

            print(
                `   last hit tile ${state.lastHitIndex}, ${distinctCount} distinct tiles hit so far, ` +
                    `${visibleTooltips} tooltips visible right now, ` +
                    `${state.visibleTooltipsDuringScan} of ${tiles.length} visible during the last scan`
            )
        })
    }

    moveTracker(0, 0)
    setTrackerVisible(false)

    createTimer(TICK, true, () => {
        if (!state.isActive) {
            return
        }

        state.globalTick++

        if (os.clock() < state.flickerTime) {
            return // the tiles that just moved cannot be trusted yet
        }

        if (!state.isTrackerVisible) {
            // The tiles moved while hidden, which is what makes the game refresh their hover
            // state: they can be shown and read again now.
            setTrackerVisible(true)
            state.visibleSinceTick = state.globalTick
        }

        // the window may have been resized
        if (state.globalTick % SCREEN_SIZE_CHECK_PERIOD_TICKS === 1 && readScreenSize()) {
            moveTracker(0, 0)
        }

        if (updateTracker()) {
            return
        }

        // Shown since an earlier tick, trusted, and no tile under the cursor: it sits in the hollow
        // center of the finest level, right where the lattice is. Its position can be read now.
        if (state.visibleSinceTick < state.globalTick) {
            state.isPositionFresh = true
        }

        // nothing found: rather than staying in the way of the clicks, hide and try again later
        if (MAX_VISIBLE_TICKS > 0 && state.globalTick - state.visibleSinceTick >= MAX_VISIBLE_TICKS) {
            setTrackerVisible(false)
            state.flickerTime = os.clock() + FLICKER_DELAY
        }
    })
}
