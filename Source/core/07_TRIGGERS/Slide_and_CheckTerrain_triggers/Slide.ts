import { EffectUtils } from 'Utils/EffectUtils'
import { pathingBlockerUtils } from 'Utils/PathingBlockerUtils'
import { createTimer } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { Apm } from 'core/08_GAME/Apm_clics_par_minute/Apm'
import { Cpm } from 'core/08_GAME/Apm_clics_par_minute/Cpm'
import { setDeathCause } from 'core/Log/DeathCause'
import { getUdgEscapers, globals } from '../../../../globals'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { GetMirrorEscaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { ASYNC_HERO_EVENT } from '../../08_GAME/Contact/AsyncHeroSync'
import { GRAVITY_EVERY_N_PERIOD, Gravity } from './Gravity'
import { computeSlideTurnForOnePeriod, slideTurn } from './SlidingMax'

const tmpLoc = Location(0, 0)

// todo check if we could remove this
const escaperTurnForOnePeriod = (escaper: Escaper | null) => {
    if (!escaper) return

    const hero = escaper.getHero()
    if (!hero) return

    const remainingDegrees = escaper.getRemainingDegreesToTurn()

    if (
        !computeSlideTurnForOnePeriod(
            remainingDegrees,
            escaper.getMaxSlideTurnPerPeriod(),
            escaper.getSlideCurrentTurnPerPeriod(),
            escaper.rotationTimeForMaximumSpeed
        )
    ) {
        return
    }

    const currentAngle = escaper.getHeroFacing()

    escaper.setSlideCurrentTurnPerPeriod(slideTurn.turnPerPeriod)
    escaper.setRemainingDegreesToTurn(remainingDegrees - slideTurn.diffToApply)
    escaper.setHeroFacing(currentAngle + slideTurn.diffToApply)
}

const initSlideTrigger = () => {
    //counter for height which has to execute at 0.01s period
    const counters: number[] = []
    for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
        counters[i] = 0
    }

    const Slide_Actions = (n: number) => {
        const escaper = getUdgEscapers().get(n)

        if (!escaper) {
            return
        }

        const hero = escaper.getHero()

        if (!hero) return

        //offset of the hero position
        const oldX = escaper.getHeroX()
        const oldY = escaper.getHeroY()

        const lastZ = escaper.getLastZ()
        const speedZ = escaper.getSpeedZ()
        const oldDiffZ = escaper.getOldDiffZ()
        let height = escaper.getHeroFlyHeight()
        MoveLocation(tmpLoc, oldX, oldY)
        const z = GetLocationZ(tmpLoc)

        //turning
        const allowTurning = escaper.getRotationSpeed() != 0 && (height < 1 || globals.CAN_TURN_IN_AIR)

        let oldAngle = escaper.oldAngle // Get the old angle before calculating the new one.
        let newAngle = Deg2Rad(escaper.getHeroFacing())
        let currentTime = os.clock()

        if (allowTurning && escaper.slidingMode == 'max') {
            escaperTurnForOnePeriod(escaper)
            escaperTurnForOnePeriod(GetMirrorEscaper(escaper))
        }

        let newX = oldX + escaper.getSlideMovePerPeriod() * Cos(newAngle)
        let newY = oldY + escaper.getSlideMovePerPeriod() * Sin(newAngle)

        if (!globals.canSlideOverPathingBlockers) {
            const oldXd = Math.floor(oldX / 64) * 64 + 32
            const oldYd = Math.floor(oldY / 64) * 64 + 32
            const newXd = Math.floor(newX / 64) * 64 + 32
            const newYd = Math.floor(newY / 64) * 64 + 32

            if (
                pathingBlockerUtils.isBlocked(newXd, newYd) ||
                (pathingBlockerUtils.isBlocked(newXd, oldYd) && pathingBlockerUtils.isBlocked(oldXd, newYd))
            ) {
                if (pathingBlockerUtils.isBlocked(newXd, oldYd)) {
                    newX = oldX
                }

                if (pathingBlockerUtils.isBlocked(oldXd, newYd)) {
                    newY = oldY
                }
            }
        }

        if (
            newX >= globals.MAP_MIN_X &&
            newX <= globals.MAP_MAX_X &&
            newY >= globals.MAP_MIN_Y &&
            newY <= globals.MAP_MAX_Y
        ) {
            // before the static slide below reads it: taken along, or let go, right where it happens
            escaper.followStaticSlidesOfAsyncHero(newX, newY)

            const staticSliding = escaper.getStaticSliding()

            if (staticSliding) {
                if (staticSliding.isInRegion(newX, newY)) {
                    escaper.moveHero(newX, newY, false)

                    if (!escaper.isAlive()) {
                        escaper.refreshCerclePosition()
                    }
                } else {
                    staticSliding.removePlayer(escaper.getId())

                    if (!escaper.isGodModeOn()) {
                        setDeathCause(
                            escaper.getId(),
                            string.format(
                                'left static slide %d sideways at %d,%d',
                                staticSliding.id ?? -1,
                                math.floor(newX),
                                math.floor(newY)
                            )
                        )
                        escaper.kill()
                    } else if (escaper.isHeroAsEffect()) {
                        // only its own machine got here: the effect is shown through every machine
                        escaper.announceAsyncHeroEvent(ASYNC_HERO_EVENT.godModeLeftStaticSlide, newX, newY)
                    } else {
                        EffectUtils.destroyEffect(EffectUtils.addSpecialEffect(Constants.GM_KILLING_EFFECT, newX, newY))
                    }
                }
            } else {
                escaper.moveHero(newX, newY, false)
            }
        }

        const gravity = escaper.getLastTerrainType()?.getGravity() || Gravity.GetGravity()

        // Management of hero's height
        counters[n]++
        if (counters[n] == GRAVITY_EVERY_N_PERIOD) {
            counters[n] = 0

            const diffZ = z - lastZ // Height difference at the terrain level
            let delta: number

            if (height > 1) {
                escaper.setSpeedZ(speedZ + gravity)
                height += speedZ - diffZ
                if (height < 0) {
                    height = 0
                }
                escaper.setHeroFlyHeight(height, 0)

                //coop
                escaper.refreshCerclePosition()
            } else {
                delta = diffZ - oldDiffZ
                if (delta < gravity) {
                    escaper.setSpeedZ(oldDiffZ + gravity)
                    escaper.setHeroFlyHeight(-diffZ + escaper.getSpeedZ(), 0)

                    // Stop turning if a click has been made just before
                    if (!globals.CAN_TURN_IN_AIR) {
                        escaper.setHeroFacing(escaper.getHeroFacing())
                    }
                } else if (!escaper.isAlive()) {
                    // The dead hero touches the ground, slide is deactivated
                    escaper.enableSlide(false)
                }
            }
            escaper.setLastZ(z)
            escaper.setOldDiffZ(diffZ)
        }

        // Accumulate total rotation angle
        let angleDiff = newAngle - oldAngle

        // If the angle jumps between -Pi and +Pi
        if (angleDiff > Math.PI) {
            angleDiff -= 2 * Math.PI
        } else if (angleDiff < -Math.PI) {
            angleDiff += 2 * Math.PI
        }

        // Detect change in rotation direction
        if (escaper.totalRotation != 0 && Math.sign(escaper.totalRotation) != Math.sign(angleDiff)) {
            escaper.totalRotation = 0 // Reset rotation count
            escaper.startTurningTime = currentTime // Reset the start time
        }

        escaper.totalRotation += angleDiff
        escaper.oldAngle = newAngle // Store the current angle to be used as the old angle in the next frame

        // Detect full circle
        if (Math.abs(escaper.totalRotation) >= (7 / 8) * 2 * Math.PI) {
            escaper.totalRotation = 0 // Reset rotation count after a full circle
            escaper.startTurningTime = currentTime // Reset the start time after a full circle
            Cpm.nbCirclesOnSlide[n]++ // Increment circle counter
        } else if (currentTime - escaper.startTurningTime > 2) {
            // If 2 seconds have passed without a full circle
            escaper.totalRotation = 0 // Reset rotation count
            escaper.startTurningTime = currentTime // Reset the start time
        }

        //update apm
        Apm.timeOnSlide[n] = Apm.timeOnSlide[n] + Constants.SLIDE_PERIOD
    }

    const CreateSlideTimer = (escaperId: number) => {
        return createTimer(Constants.SLIDE_PERIOD, true, () => Slide_Actions(escaperId))
    }

    return { CreateSlideTimer }
}

export const SlideTrigger = initSlideTrigger()
