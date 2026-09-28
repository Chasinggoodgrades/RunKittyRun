import { GetLocZ } from 'Utils/LocationUtils'
import { createTimer } from 'Utils/mapUtils'

/**
 * Screen to world coordinates conversion, ported from "Fast World2Screen Transform" by Antares
 * (scripts/Fast World2Screen Transform (SyncedAsync)/World2Screen.lua).
 *
 * Asynchronous by nature: the camera natives it reads describe the camera of the local player,
 * so the result differs from one machine to another and may never feed synced logic.
 *
 * Screen coordinates are frame coordinates: the center of the screen is (0.4, 0.3).
 */

const CAMERA_CACHE_LIFETIME = 0.02

const camera = {
    isUpToDate: false,
    eyeX: 0,
    eyeY: 0,
    eyeZ: 0,
    cosRot: 0,
    sinRot: 0,
    cosAttack: 0,
    sinAttack: 0,
    cosAttackCosRot: 0,
    cosAttackSinRot: 0,
    sinAttackCosRot: 0,
    sinAttackSinRot: 0,
    yCenterScreenShift: 0,
    scaleFactor: 0,
}

const updateCamera = () => {
    camera.eyeX = GetCameraEyePositionX()
    camera.eyeY = GetCameraEyePositionY()
    camera.eyeZ = GetCameraEyePositionZ()

    const angleOfAttack = GetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK)
    const rotation = GetCameraField(CAMERA_FIELD_ROTATION)
    const fieldOfView = GetCameraField(CAMERA_FIELD_FIELD_OF_VIEW)

    camera.cosAttack = Math.cos(angleOfAttack)
    camera.sinAttack = Math.sin(angleOfAttack)
    camera.cosRot = Math.cos(rotation)
    camera.sinRot = Math.sin(rotation)

    camera.yCenterScreenShift = 0.1284 * camera.cosAttack
    camera.scaleFactor = 0.0524 * fieldOfView ** 3 - 0.0283 * fieldOfView ** 2 + 1.061 * fieldOfView

    camera.cosAttackCosRot = camera.cosAttack * camera.cosRot
    camera.cosAttackSinRot = camera.cosAttack * camera.sinRot
    camera.sinAttackCosRot = camera.sinAttack * camera.cosRot
    camera.sinAttackSinRot = camera.sinAttack * camera.sinRot

    camera.isUpToDate = true
}

/** The camera parameters are only recomputed when they had the time to change */
export const initScreen2World = () => {
    createTimer(CAMERA_CACHE_LIFETIME, true, () => {
        camera.isUpToDate = false
    })
}

/**
 * World point drawn at the given screen position, on the screen of the local player.
 * Undefined when the ray does not converge, which happens when it crosses the terrain
 * at several points (a cliff between the camera and the cursor, mostly).
 */
export const screen2World = (screenX: number, screenY: number) => {
    if (!camera.isUpToDate) {
        updateCamera()
    }

    const a = (screenX - 0.4) * camera.scaleFactor
    const b = (0.42625 - camera.yCenterScreenShift - screenY) * camera.scaleFactor

    // unit vector pointing towards the cursor, in the coordinate system of the camera
    const nx = 1 / Math.sqrt(1 + a * a + b * b)
    let ny = Math.sqrt(1 - (1 + b * b) * nx * nx)
    let nz = Math.sqrt(1 - nx * nx - ny * ny)

    if (a > 0) {
        ny = -ny
    }

    if (b < 0) {
        nz = -nz
    }

    // same vector, in world coordinates
    const nxPrime = camera.cosAttackCosRot * nx - camera.sinRot * ny + camera.sinAttackCosRot * nz
    const nyPrime = camera.cosAttackSinRot * nx + camera.cosRot * ny + camera.sinAttackSinRot * nz
    const nzPrime = -camera.sinAttack * nx + camera.cosAttack * nz

    // where that ray meets the terrain, by successive approximations
    let zGuess = GetLocZ(camera.eyeX, camera.eyeY)
    let xGuess = camera.eyeX + (nxPrime * (camera.eyeZ - zGuess)) / nzPrime
    let yGuess = camera.eyeY + (nyPrime * (camera.eyeZ - zGuess)) / nzPrime
    let zWorld = GetLocZ(xGuess, yGuess)
    let deltaZ = zWorld - zGuess

    zGuess = zWorld

    let i = 0

    while ((deltaZ > 1 || deltaZ < -1) && i < 50) {
        const zWorldOld = zWorld
        const deltaZOld = deltaZ

        xGuess = camera.eyeX + (nxPrime * (camera.eyeZ - zGuess)) / nzPrime
        yGuess = camera.eyeY + (nyPrime * (camera.eyeZ - zGuess)) / nzPrime

        zWorld = GetLocZ(xGuess, yGuess)
        deltaZ = zWorld - zGuess
        zGuess = (deltaZOld * zWorld - deltaZ * zWorldOld) / (deltaZOld - deltaZ)

        i++
    }

    return i < 50 ? { x: xGuess, y: yGuess, z: zWorld } : undefined
}

/**
 * The other way around: where a world point is drawn on the screen of the local player.
 * Same frame coordinates, so comparing it against the mouse lattice tells which of the two
 * is wrong when the effect does not land under the cursor.
 */
export const world2Screen = (x: number, y: number, z: number) => {
    if (!camera.isUpToDate) {
        updateCamera()
    }

    const dx = x - camera.eyeX
    const dy = y - camera.eyeY
    const dz = z - camera.eyeZ

    const xPrime =
        camera.scaleFactor * (-camera.cosAttackCosRot * dx - camera.cosAttackSinRot * dy - camera.sinAttack * dz)

    return {
        x: 0.4 + (camera.cosRot * dy - camera.sinRot * dx) / xPrime,
        y:
            0.42625 -
            camera.yCenterScreenShift +
            (camera.sinAttackCosRot * dx + camera.sinAttackSinRot * dy - camera.cosAttack * dz) / xPrime,
    }
}
