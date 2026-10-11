import { Constants } from 'core/01_libraries/Constants'

/** Rounds per second: the maximum of SetUnitFacing measured with -measureTurn, 10.3124 degrees per 0.03 s tick */
export const HERO_ROTATION_SPEED = 0.9549
export const HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED = 0.11

/**
 * The physical turn (see computeSlideTurnForOnePeriod), in degrees rather than seconds: the degrees the hero
 * turns while speeding up from no rotation to the maximum rotation speed, and the degrees braking takes from
 * the maximum down to none - which is where it starts slowing down before the angle asked for. In degrees,
 * they keep their meaning whatever the rotation speed of a terrain or a hero: in seconds, a faster rotation
 * braked over more degrees, and a cursor kept still on a fixed camera circled slower than the maximum.
 *
 * Started from how SetUnitFacing turns a unit, measured with -measureTurn (the game brakes far softer than it
 * speeds up), then tried in the game with -physicalTurn: 25 and 80 degrees are near 0.15 and 0.47 seconds at
 * the default rotation speed.
 */
export const PHYSICAL_ACCELERATION_DEGREES = 25
export const PHYSICAL_BRAKING_DEGREES = 80

/**
 * The degrees the physical turn uses, PHYSICAL_ACCELERATION_DEGREES and PHYSICAL_BRAKING_DEGREES by default.
 * Changed by -physicalTurn to try other ones in the game, which every machine hears at once: the unit of a
 * hero sliding as an effect turns with them on all of them.
 */
export const physicalTurnSettings = {
    accelerationDegrees: PHYSICAL_ACCELERATION_DEGREES,
    brakingDegrees: PHYSICAL_BRAKING_DEGREES,
}

/**
 * How much inertia a hero turns with while sliding, as a factor of the normal one: 2 takes twice as long
 * to reach the maximum rotation speed and to brake before the angle asked for, 0.5 half as long. Given
 * by the slide terrain, or forced for a hero whatever the terrain (see Escaper.absoluteSlideInertia).
 */
export const SLIDE_INERTIA_FACTOR = 1

export const MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL = 51

export const SPEED_AT_LEAST_THAN_50_DEGREES: { [x: number]: number } = {
    //percentage of maximum speed
    51: 92.721,
    50: 91.655,
    49: 90.588,
    48: 89.522,
    47: 88.455,
    46: 87.389,
    45: 86.322,
    44: 85.255,
    43: 84.189,
    42: 83.646,
    41: 82.192,
    40: 80.737,
    39: 79.283,
    38: 77.828,
    37: 76.374,
    36: 74.919,
    35: 74.854,
    34: 73.439,
    33: 72.023,
    32: 70.607,
    31: 69.192,
    30: 67.776,
    29: 66.36,
    28: 66.357,
    27: 64.719,
    26: 63.081,
    25: 61.442,
    24: 59.804,
    23: 58.165,
    22: 58.165,
    21: 56.59,
    20: 55.015,
    19: 53.44,
    18: 51.866,
    17: 50.291,
    16: 48.783,
    15: 47.275,
    14: 45.767,
    13: 44.26,
    12: 42.75,
    11: 40.355,
    10: 37.96,
    9: 35.56,
    8: 31.698,
    7: 27.837,
    6: 23.975,
    5: 13.943,
    4: 9.091,
    3: 6.366,
    2: 2.8,
    1: 1.837,
    0: 1.5,
}

/**
 * What one period of the turn in "max" mode gives, written by computeSlideTurnForOnePeriod: the degrees
 * the hero turns now, and the turn per period it goes on from. One object reused rather than one made
 * at each call, which happens every slide period for every hero turning.
 */
export const slideTurn = { diffToApply: 0, turnPerPeriod: 0 }

/**
 * Whether slides turn the way they did before the physical braking (see computeSlideTurnForOnePeriod):
 * along SPEED_AT_LEAST_THAN_50_DEGREES, stretched by the inertia. Set by -legacySlideInertia, which every
 * machine hears at once: the unit of a hero sliding as an effect turns through this very function on
 * all of them.
 */
export const slideTurnSettings = { isLegacyInertia: false }

/**
 * One slide period of the turn in "max" mode the way it was before the physical braking: it speeds up
 * towards the maximum, and below 51 degrees times the inertia slows down along
 * SPEED_AT_LEAST_THAN_50_DEGREES, read at the degrees left divided by the inertia. A cursor kept at a
 * steady offset under those degrees never lets the hero reach its maximum rotation speed.
 */
const computeLegacySlideTurnForOnePeriod = (
    remainingDegrees: number,
    maxTurnPerPeriod: number,
    currentTurnPerPeriod: number,
    rotationTimeForMaximumSpeed: number,
    slideInertia: number
) => {
    if (remainingDegrees == 0) {
        return false
    }

    const diffToApplyAbs = RMinBJ(RAbsBJ(remainingDegrees), RAbsBJ(maxTurnPerPeriod))

    if (diffToApplyAbs <= 0.05) {
        return false
    }

    // none, or a negative one, would divide by zero: the normal inertia then
    const inertia = slideInertia > 0 ? slideInertia : SLIDE_INERTIA_FACTOR

    //sens
    const sens = remainingDegrees * maxTurnPerPeriod > 0 ? 1 : -1
    const maxIncreaseRotationSpeedPerPeriod = RAbsBJ(
        (maxTurnPerPeriod * Constants.SLIDE_PERIOD) / (rotationTimeForMaximumSpeed * inertia)
    )

    // The braking starts as much earlier as the speed changes slower, along the same table: braking
    // steadily, the speed to keep at some degrees from the angle asked for only depends on those degrees
    // divided by the time to reach the maximum speed. With the table left as it is, a hero with a high
    // inertia could not brake as fast as it asks, and turned past that angle before coming back.
    if (RAbsBJ(remainingDegrees) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL * inertia) {
        const tableInd = Math.min(
            Math.round(RAbsBJ(remainingDegrees) / inertia),
            MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL
        )
        const aimedSpeedPercentage = SPEED_AT_LEAST_THAN_50_DEGREES[tableInd]
        const aimedNewSpeedPerPeriod = (maxTurnPerPeriod * aimedSpeedPercentage * sens) / 100
        const diffSpeed = aimedNewSpeedPerPeriod - currentTurnPerPeriod
        let diffToApply: number

        if (RAbsBJ(diffSpeed) < maxIncreaseRotationSpeedPerPeriod) {
            diffToApply = aimedNewSpeedPerPeriod
        } else {
            const sensDiffToApply = diffSpeed > 0 ? 1 : -1
            diffToApply = currentTurnPerPeriod + sensDiffToApply * maxIncreaseRotationSpeedPerPeriod
        }

        slideTurn.diffToApply = diffToApply
        slideTurn.turnPerPeriod = diffToApply

        return true
    }

    let newSlideTurn: number
    let diffToApply: number

    if (sens > 0) {
        newSlideTurn = RMinBJ(currentTurnPerPeriod + maxIncreaseRotationSpeedPerPeriod, maxTurnPerPeriod)
        diffToApply = RMinBJ(newSlideTurn, diffToApplyAbs)
        diffToApply = RMinBJ(remainingDegrees, diffToApply)
    } else {
        newSlideTurn = RMaxBJ(currentTurnPerPeriod - maxIncreaseRotationSpeedPerPeriod, -maxTurnPerPeriod)
        diffToApply = RMaxBJ(newSlideTurn, -diffToApplyAbs)
        diffToApply = RMaxBJ(remainingDegrees, diffToApply)
    }

    slideTurn.diffToApply = diffToApply
    slideTurn.turnPerPeriod = newSlideTurn

    return true
}

/**
 * One slide period of the turn in "max" mode, from the degrees left to turn, the most a period may
 * turn, and the turn per period reached so far. Answers whether the hero turns at all, the result being
 * in slideTurn.
 *
 * The rotation speed changes by at most maxChangePerPeriod each period, so that speeding up from none to
 * the maximum turns the hero the acceleration degrees of physicalTurnSettings, times the inertia. It aims at
 * the maximum, unless the hero already has to brake to stop on the angle asked for, braking softer, over the
 * braking degrees of physicalTurnSettings times the inertia: turning s degrees in a period, then s - c,
 * s - 2c... until it stops covers about s² / 2c + s / 2 degrees, so it aims no faster than the s the
 * degrees left allow. So a cursor further off than the braking degrees - 80 by default - turns the hero at
 * its maximum speed, whatever that speed, and one kept still on a fixed camera circles at it. It never turns
 * past that angle.
 *
 * Nothing but numbers in and out, so that the slide of a hero and the unit of a hero sliding as an
 * effect, which every machine carries on from the last packet, turn alike.
 */
export const computeSlideTurnForOnePeriod = (
    remainingDegrees: number,
    maxTurnPerPeriod: number,
    currentTurnPerPeriod: number,
    rotationTimeForMaximumSpeed: number,
    slideInertia: number
) => {
    if (slideTurnSettings.isLegacyInertia) {
        return computeLegacySlideTurnForOnePeriod(
            remainingDegrees,
            maxTurnPerPeriod,
            currentTurnPerPeriod,
            rotationTimeForMaximumSpeed,
            slideInertia
        )
    }

    if (remainingDegrees == 0) {
        return false
    }

    const diffToApplyAbs = RMinBJ(RAbsBJ(remainingDegrees), RAbsBJ(maxTurnPerPeriod))

    if (diffToApplyAbs <= 0.05) {
        return false
    }

    // none, or a negative one, would divide by zero: the normal inertia then
    const inertia = slideInertia > 0 ? slideInertia : SLIDE_INERTIA_FACTOR

    const sens = remainingDegrees * maxTurnPerPeriod > 0 ? 1 : -1
    // going from none to the maximum m by c per period turns about m² / 2c degrees
    const maxTurnSquared = maxTurnPerPeriod * maxTurnPerPeriod
    const maxChangePerPeriod = maxTurnSquared / (2 * physicalTurnSettings.accelerationDegrees * inertia)
    const brakingChangePerPeriod = maxTurnSquared / (2 * physicalTurnSettings.brakingDegrees * inertia)

    // the fastest turn per period from which braking as the game does still stops on the angle asked for
    const brakingTurnPerPeriod =
        -brakingChangePerPeriod / 2 +
        SquareRoot(
            (brakingChangePerPeriod * brakingChangePerPeriod) / 4 +
                2 * brakingChangePerPeriod * RAbsBJ(remainingDegrees)
        )

    const aimedTurnPerPeriod = sens * RMinBJ(RAbsBJ(maxTurnPerPeriod), brakingTurnPerPeriod)
    const diffSpeed = aimedTurnPerPeriod - currentTurnPerPeriod
    let newTurnPerPeriod: number

    if (RAbsBJ(diffSpeed) <= maxChangePerPeriod) {
        newTurnPerPeriod = aimedTurnPerPeriod
    } else {
        newTurnPerPeriod = currentTurnPerPeriod + (diffSpeed > 0 ? 1 : -1) * maxChangePerPeriod
    }

    // never past the angle asked for: a turn still going the other way carries on, as it slows down
    const diffToApply = sens > 0 ? RMinBJ(newTurnPerPeriod, diffToApplyAbs) : RMaxBJ(newTurnPerPeriod, -diffToApplyAbs)

    slideTurn.diffToApply = diffToApply
    slideTurn.turnPerPeriod = diffToApply

    return true
}
