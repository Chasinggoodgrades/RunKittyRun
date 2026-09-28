import { getFullscreenParent } from '../DisablingInterface/EnableDisableInterface'
import { Natives } from '../wc3_natives_unsecured/Natives'

/**
 * Which parent the lattice and the catchers hang from. It decides two things at once:
 *
 *  - 'gameUi': the safe one, but its children cannot leave the 4:3 center of the screen, so the
 *    side bands of a wide screen are out of reach ("The Big UI-Frame Tutorial" by Tasyen,
 *    section "4:3 Limitation"),
 *  - 'consoleUiBackdrop': no 4:3 limit, but the "-ui" command hides that frame
 *    (EnableDisableInterface.ts), and a hidden parent hides its children: the tracker goes blind,
 *  - 'worldFrame': the 3D view, which "-ui" leaves alone, but its children are bounded to the
 *    4:3 center just the same,
 *  - 'leaderboard': the parent MEC already builds for that very purpose in
 *    DisablingInterface/EnableDisableInterface.ts ("Frame parent to allow above 4:3"): a
 *    Leaderboard, sized to nothing, with its backdrop and title hidden. It escapes the 4:3 limit
 *    and "-ui" does not touch it. It only exists two seconds into the game, which is before
 *    anything here is created.
 *
 * A frame cannot be re-parented once created, hence a constant rather than a runtime switch.
 */
const PARENT = 'leaderboard' as 'gameUi' | 'consoleUiBackdrop' | 'worldFrame' | 'leaderboard'

export const getFullScreenFrameParent = () => {
    if (PARENT === 'leaderboard') {
        return getFullscreenParent() ?? Natives.UBlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)
    }

    if (PARENT === 'consoleUiBackdrop') {
        return BlzGetFrameByName('ConsoleUIBackdrop', 0) ?? Natives.UBlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)
    }

    if (PARENT === 'worldFrame') {
        return Natives.UBlzGetOriginFrame(ORIGIN_FRAME_WORLD_FRAME, 0)
    }

    return Natives.UBlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)
}

/** Screen width in frame coordinates: 0.8 on a 4:3 screen, more on a wider one */
export const getScreenWidth = () => {
    const height = BlzGetLocalClientHeight()

    // the game returns 0 while minimized, and dividing by it would kill the thread
    if (height === 0) {
        return 0.8
    }

    return (BlzGetLocalClientWidth() / height) * 0.6
}
