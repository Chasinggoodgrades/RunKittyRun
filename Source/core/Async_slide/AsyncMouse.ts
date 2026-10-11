/**
 * Asynchronous mouse position, in screen (frame) coordinates: the center of the screen is (0.4, 0.3),
 * which is what Screen2World expects.
 *
 * Read from the natives Warcraft III 3.0 gives for it: BlzGetMouseScreenPosX/Y, in pixels of the game
 * window, turned into frame coordinates by BlzPixelToFrameX/Y. They answer at once, on this machine
 * alone, and need no frame: they replace a lattice of invisible tiles that converged on the cursor
 * through the tooltips it showed, swallowed the clicks it covered, and made hundreds of frames, which
 * 3.0 turned into agents. Compared in the game with -compareMouse before the switch: the two agreed
 * within a tile of that lattice (0.002).
 *
 * Asynchronous: the position differs from one machine to another and may never feed synced logic.
 */

/** Reused at every read, which the auto turn makes every slide period */
const position = { x: 0.4, y: 0.3 }

/** Where the cursor of this machine is now. The object is reused: read it at once, do not keep it */
export const getAsyncMousePosition = () => {
    position.x = BlzPixelToFrameX(BlzGetMouseScreenPosX())
    position.y = BlzPixelToFrameY(BlzGetMouseScreenPosY())

    return position
}
