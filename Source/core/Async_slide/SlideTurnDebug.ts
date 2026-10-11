import { GetLocZ } from 'Utils/LocationUtils'
import { createTimer } from 'Utils/mapUtils'
import { Timer } from 'w3ts'
import { getUdgEscapers } from '../../../globals'
import { AnglesDiff } from '../01_libraries/Basic_functions'
import { Constants } from '../01_libraries/Constants'
import { DrawLine } from '../01_libraries/Draw_lines'
import {
    physicalTurnSettings,
    SLIDE_INERTIA_FACTOR,
    slideTurnSettings,
} from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/SlidingMax'
import { getCursorWorldPosition } from './AutoTurn'

/**
 * Two rays from a sliding hero, the acceleration degrees of the physical turn (see physicalTurnSettings) times
 * the inertia on each side of where it heads: how far a hero that does not turn yet turns before it reaches
 * its maximum rotation speed, whichever side it turns to. Red while the cursor stands between them, green
 * otherwise, and none while the cursor is not known. Shown to the player who asked for them, RAY_LENGTH long.
 *
 * The lightnings are agents: made and destroyed by the command, which every machine hears, and folded into a
 * point everywhere. Only the machine of that player unfolds a pair of them along the rays, which draws nothing
 * the game reads. A pair of each color rather than a color changed: the color comes from the lightning code.
 */
const PERIOD = Constants.SLIDE_PERIOD
const RAY_LENGTH = 700

type RayPair = { left?: lightning; right?: lightning }
type Rays = { timer: Timer; outside: RayPair; inside: RayPair }

const raysOf: { [escaperId: number]: Rays | undefined } = {}

/** A ray hidden is folded into a point under the ground */
const PARKED_Z = -1000

const makePair = (colorName: string): RayPair => ({
    left: DrawLine(0, 0, 0, 0, colorName, 2),
    right: DrawLine(0, 0, 0, 0, colorName, 2),
})

const hideRay = (ray: lightning | undefined) => {
    ray && MoveLightningEx(ray, false, 0, 0, PARKED_Z, 0, 0, PARKED_Z)
}

const hidePair = (pair: RayPair) => {
    hideRay(pair.left)
    hideRay(pair.right)
}

const showRay = (ray: lightning | undefined, x: number, y: number, angle: number) => {
    if (!ray) {
        return
    }

    const endX = x + RAY_LENGTH * Cos(Deg2Rad(angle))
    const endY = y + RAY_LENGTH * Sin(Deg2Rad(angle))

    MoveLightningEx(ray, false, x, y, GetLocZ(x, y), endX, endY, GetLocZ(endX, endY))
}

const destroyPair = (pair: RayPair) => {
    pair.left && DestroyLightning(pair.left)
    pair.right && DestroyLightning(pair.right)
}

const updateRays = (escaperId: number) => {
    const rays = raysOf[escaperId]
    const escaper = getUdgEscapers().get(escaperId)

    if (!rays || !escaper || GetLocalPlayer() !== escaper.getPlayer()) {
        return
    }

    // the degrees only turn the physical turn of the "max" mode
    if (
        !escaper.getHero() ||
        !escaper.isSliding() ||
        escaper.slidingMode !== 'max' ||
        escaper.getRotationSpeed() === 0 ||
        slideTurnSettings.isLegacyInertia
    ) {
        hidePair(rays.outside)
        hidePair(rays.inside)
        return
    }

    const cursor = getCursorWorldPosition(escaperId)

    if (cursor === undefined) {
        hidePair(rays.outside)
        hidePair(rays.inside)
        return
    }

    const x = escaper.getHeroX()
    const y = escaper.getHeroY()
    const facing = escaper.getHeroFacing()
    const slideInertia = escaper.getSlideInertia()
    const inertia = slideInertia > 0 ? slideInertia : SLIDE_INERTIA_FACTOR
    const accelerationDegrees = physicalTurnSettings.accelerationDegrees * inertia

    const cursorAngle = Atan2(cursor.y - y, cursor.x - x) * bj_RADTODEG
    const isCursorInside = RAbsBJ(AnglesDiff(cursorAngle, facing)) <= accelerationDegrees

    const shown = isCursorInside ? rays.inside : rays.outside

    hidePair(isCursorInside ? rays.outside : rays.inside)
    showRay(shown.left, x, y, facing + accelerationDegrees)
    showRay(shown.right, x, y, facing - accelerationDegrees)
}

export const isSlideTurnDebugEnabled = (escaperId: number) => raysOf[escaperId] !== undefined

/**
 * Turns the rays of that hero on or off. Called by the command, on every machine at once: it makes and
 * destroys the lightnings and the timer.
 */
export const setSlideTurnDebugEnabled = (escaperId: number, isEnabled: boolean) => {
    const rays = raysOf[escaperId]

    if (isEnabled === (rays !== undefined)) {
        return false
    }

    if (rays) {
        rays.timer.destroy()
        destroyPair(rays.outside)
        destroyPair(rays.inside)
        delete raysOf[escaperId]

        return true
    }

    raysOf[escaperId] = {
        outside: makePair('green'),
        inside: makePair('red'),
        timer: createTimer(PERIOD, true, () => updateRays(escaperId)),
    }

    return true
}
