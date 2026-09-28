import { createTimer } from '../../Utils/mapUtils'
import { Natives } from '../wc3_natives_unsecured/Natives'

let minimap: framehandle
let minimapOriginalParent: framehandle
let parentFullscreen: framehandle
let minimapBackground: framehandle
let consoleUIBackdrop: framehandle
let consoleUI: framehandle
let portrait: framehandle

const minimapSize = 0.15

export const init_customUI = function () {
    createTimer(2, false, () => {
        minimap = Natives.UBlzGetFrameByName('MiniMapFrame', 0)
        minimapOriginalParent = BlzFrameGetParent(minimap)

        /**
         * Frame parent to allow above 4:3
         */
        // ServiceManager.getService('Multiboard').getOrCreateLeaderboard()
        CreateLeaderboardBJ(Natives.UGetPlayersAll(), 'title')
        parentFullscreen = Natives.UBlzGetFrameByName('Leaderboard', 0)
        BlzFrameSetSize(parentFullscreen, 0, 0)
        BlzFrameSetVisible(Natives.UBlzGetFrameByName('LeaderboardBackdrop', 0), false)
        BlzFrameSetVisible(Natives.UBlzGetFrameByName('LeaderboardTitle', 0), false)

        /**
         * Calculate left coordinate
         */
        const screenRatio = BlzGetLocalClientWidth() / BlzGetLocalClientHeight()
        const width = (0.8 * screenRatio) / (4 / 3)
        let left = 0.4 - width / 2

        /**
         * Place a minimapBackground for the minimap
         */
        const outOffScreeBackground = 0.2
        minimapBackground = Natives.UBlzCreateFrame('QuestButtonDisabledBackdropTemplate', parentFullscreen, 0, 0)
        BlzFrameSetAbsPoint(
            minimapBackground,
            FRAMEPOINT_BOTTOMLEFT,
            left - outOffScreeBackground,
            -outOffScreeBackground
        )
        BlzFrameSetAbsPoint(minimapBackground, FRAMEPOINT_TOPRIGHT, left + minimapSize + 0.005, minimapSize + 0.005)
        BlzFrameSetVisible(minimapBackground, false)

        /**
         * Handles
         */
        consoleUIBackdrop = Natives.UBlzGetFrameByName('ConsoleUIBackdrop', 0)
        consoleUI = Natives.UBlzGetFrameByName('ConsoleUI', 0)
        portrait = Natives.UBlzGetOriginFrame(ORIGIN_FRAME_PORTRAIT, 0)
    })
}

/**
 * The Leaderboard created above as a parent, the one frame that both escapes the 4:3 center of
 * the screen and survives "-ui", which hides ConsoleUIBackdrop and ConsoleUI but not this.
 * Undefined until init_customUI has run, two seconds into the game.
 */
export const getFullscreenParent = () => parentFullscreen

export const DisableInterface = function (showMinimap: boolean = true) {
    if (showMinimap) {
        BlzHideOriginFrames(false)
        BlzFrameSetVisible(portrait, false)
        placeMinimap()
    } else {
        BlzHideOriginFrames(true)
        resetMinimap()
    }

    BlzFrameSetVisible(consoleUIBackdrop, false)
    BlzFrameSetVisible(consoleUI, false)
}

export const EnableInterface = function () {
    BlzHideOriginFrames(false)
    BlzFrameSetVisible(consoleUIBackdrop, true)
    BlzFrameSetVisible(consoleUI, true)
    BlzFrameSetVisible(portrait, true)
    resetMinimap()
}

//minimap at bottom left corner
const placeMinimap = function () {
    /**
     * Calculate left coordinate
     */
    const screenRatio = BlzGetLocalClientWidth() / BlzGetLocalClientHeight()
    const width = (0.8 * screenRatio) / (4 / 3)
    let left = 0.4 - width / 2

    /**
     * Place the minimap  background
     */
    BlzFrameSetVisible(minimapBackground, true)

    /**
     * Place the minimap
     */
    BlzFrameSetParent(minimap, parentFullscreen)
    BlzFrameSetAbsPoint(minimap, FRAMEPOINT_BOTTOMLEFT, left, 0)
    BlzFrameSetAbsPoint(minimap, FRAMEPOINT_TOPRIGHT, left + minimapSize, minimapSize)
}

const resetMinimap = function () {
    BlzFrameSetParent(minimap, minimapOriginalParent)

    const offsetX = 0.0084
    const offsetY = 0.0072
    BlzFrameSetAbsPoint(minimap, FRAMEPOINT_BOTTOMLEFT, offsetX, offsetY)
    BlzFrameSetAbsPoint(minimap, FRAMEPOINT_TOPRIGHT, minimapSize + offsetX, minimapSize + offsetY)
    BlzFrameSetVisible(minimapBackground, false)
}
