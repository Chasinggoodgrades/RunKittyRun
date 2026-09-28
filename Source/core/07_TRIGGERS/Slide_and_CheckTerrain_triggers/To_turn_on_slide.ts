import { createEvent, forRange } from 'Utils/mapUtils'
import {
    AnglesDiff,
    ApplyAngleSymmetry,
    ForceAngleBetween0And360,
    IsLastOrderPause,
    StopUnit,
} from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Escaper } from 'core/04_STRUCTURES/Escaper/Escaper'
import {
    Hero2Escaper,
    IsHero,
    MainEscaperToSecondaryOne,
    isSecondaryHero,
} from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { TerrainTypeSlide } from 'core/04_STRUCTURES/TerrainType/TerrainTypeSlide'
import { Apm } from 'core/08_GAME/Apm_clics_par_minute/Apm'
import { udg_symmetryAngle } from 'core/Double_heroes/double_heroes_config'
import { globals } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { AutoContinueAfterSliding } from './Auto_continue_after_sliding'

/**
 * A slide turning into a reverse one, or back, turns the hero half a turn, and so does a reverse
 * slide stepped on from walkable ground. For this long afterwards, an order asking for about that
 * half turn back is ignored: follow mouse and the auto turn send one at once, still aiming where
 * the hero looked before, and would undo the reversal.
 */
const SLIDE_DIRECTION_SWITCH_DURATION = 0.5
/** How far from an exact half turn an order may be and still count as asking for it */
const HALF_TURN_TOLERANCE = 15

const initTurnOnSlide = () => {
    //turn variables
    let slider: unit
    let n: number
    let sliderX: number
    let sliderY: number
    let orderWidget: widget
    let orderX: number
    let orderY: number
    let angle: number

    //drunk variables
    let udg_isDrunk: boolean[] = []
    let udg_drunk: number[] = []
    let udg_drunkLevel: number[] = []
    const INITIAL_DRUNK = 10
    let udg_drunkEffect: (effect | undefined)[] = []
    let DRUNK_EFFECTS: string[] = []
    const DRUNK_EFFECT_PETIT = 'Abilities\\Weapons\\BloodElfMissile\\BloodElfMissile.mdl'
    const DRUNK_EFFECT_MOYEN = 'Abilities\\Weapons\\ChimaeraAcidMissile\\ChimaeraAcidMissile.mdl'
    const DRUNK_EFFECT_GROS = 'Abilities\\Weapons\\GreenDragonMissile\\GreenDragonMissile.mdl'

    //trigger
    let trg_turnToPoint: trigger
    let trg_turnToWidget: trigger

    /**
     * Game time, the same on every machine: orders are handled on all of them, and one ignoring an
     * order another obeys would turn the same hero two ways. Created once, with the rest of the init.
     */
    let slideClock: timer | undefined
    /** When the slide last reversed each hero, on that clock, by escaper id */
    const slideDirectionSwitchTimes: number[] = []

    const getSlideClockTime = () => (slideClock ? TimerGetElapsed(slideClock) : 0)

    /** The slide just turned the hero half a turn: into a reverse slide, or out of one */
    const markSlideDirectionSwitch = (escaper: Escaper) => {
        slideDirectionSwitchTimes[escaper.getId()] = getSlideClockTime()
    }

    const isHalfTurnBackAfterSwitch = (escaper: Escaper, angle: number) => {
        const switchTime = slideDirectionSwitchTimes[escaper.getId()]

        // without its clock, every time would read the same and the order would be ignored for good
        return (
            slideClock !== undefined &&
            switchTime !== undefined &&
            getSlideClockTime() - switchTime < SLIDE_DIRECTION_SWITCH_DURATION &&
            RAbsBJ(AnglesDiff(angle, escaper.getHeroFacing())) >= 180 - HALF_TURN_TOLERANCE
        )
    }

    /** The way each drunk hero swayed last, for the turns only its own machine asks for */
    const drunkLocalSways: boolean[] = []

    /**
     * Which way a drunk hero sways. Drawn from the random generator of the game, which every machine
     * shares - except for a turn one machine alone asks for, the async auto turn: a draw there would
     * move that generator on one machine only, and every draw after it would differ from the others.
     * That machine sways the hero one way, then the other.
     */
    const isDrunkSwayPositive = (escaperId: number, isLocalOnly: boolean) => {
        if (!isLocalOnly) {
            return GetRandomInt(1, 2) === 1
        }

        drunkLocalSways[escaperId] = !drunkLocalSways[escaperId]

        return drunkLocalSways[escaperId]
    }

    /**
     * isLocalOnly: made by one machine alone (the async auto turn, for the effect it moves by itself).
     * Such a call may only change what that machine owns: no random draw, no mirror hero.
     */
    const turnSliderToDirection = (
        escaper: Escaper,
        angle: number,
        triggerIsToLocation: boolean | null = null,
        isLocalOnly = false
    ) => {
        const slider = escaper.getHero()
        if (!slider) return

        if (isSecondaryHero(slider)) {
            return
        }

        // a mirror hero is a unit on every machine: never turned by a call only one machine makes
        const escaperSecond = isLocalOnly ? null : MainEscaperToSecondaryOne(escaper)

        const n = escaper.getId()

        //drunk mode
        if (udg_isDrunk[n]) {
            if (isDrunkSwayPositive(n, isLocalOnly)) {
                angle = angle + udg_drunk[n]
            } else {
                angle = angle - udg_drunk[n]
            }
        }

        //turn hero
        // A variable of this very call. Shared between calls, it kept whatever the previous one had
        // left whenever the terrain below said nothing - and that call may have been made by one
        // machine alone, the async auto turn: a turn order then turned the hero on some machines only.
        let canTurn = true

        if (escaper.isHeroOnGround()) {
            const terrainType = escaper.getLastTerrainType()
            if (terrainType instanceof TerrainTypeSlide) {
                canTurn = terrainType.getCanTurn()
            }
        } else {
            canTurn = globals.CAN_TURN_IN_AIR
        }

        const staticSliding = escaper.getStaticSliding()

        if (staticSliding) {
            const canTurnAngle = staticSliding.getCanTurnAngle()

            // a lane that lets the hero turn a little first turns it towards itself, to the end
            if (canTurnAngle && !staticSliding.isAligningHero(escaper)) {
                const currentAngle = staticSliding.getAngle()

                const minAngle = ForceAngleBetween0And360(currentAngle - canTurnAngle)
                const maxAngle = ForceAngleBetween0And360(currentAngle + canTurnAngle)

                if (
                    !(
                        ForceAngleBetween0And360(angle - currentAngle) < canTurnAngle ||
                        ForceAngleBetween0And360(angle - currentAngle) > 360 - canTurnAngle
                    )
                ) {
                    if (
                        ForceAngleBetween0And360(angle - currentAngle) < 180 ||
                        ForceAngleBetween0And360(currentAngle - angle) > 180
                    ) {
                        angle = maxAngle
                    } else {
                        angle = minAngle
                    }
                }

                // if (Math.abs(nAngle - currentAngle) > canTurnAngle) {
                //     if (Math.abs(nAngle - currentAngle) > 180) {
                //         angle = minAngle
                //     } else {
                //         angle = maxAngle
                //     }
                // }
            } else {
                canTurn = false
            }
        }

        if (canTurn && isHalfTurnBackAfterSwitch(escaper, angle)) {
            canTurn = false
        }

        const angleSecond = ApplyAngleSymmetry(angle, udg_symmetryAngle)

        if (canTurn) {
            if (escaper.isAbsoluteInstantTurn()) {
                //turn instantly
                escaper.turnInstantly(angle)
                if (escaperSecond?.isSliding()) {
                    escaperSecond.turnInstantly(angleSecond)
                }
            } else {
                //turn normally
                if (escaper.slidingMode == 'max') {
                    const currentAngle = escaper.getHeroFacing()
                    escaper.setRemainingDegreesToTurn(AnglesDiff(angle, currentAngle))
                } else {
                    escaper.turnProgressively(angle)
                }

                const h1 = escaperSecond?.getHero()
                if (escaperSecond?.isSliding() && h1) {
                    escaperSecond.setRemainingDegreesToTurn(AnglesDiff(angleSecond, escaperSecond.getHeroFacing()))
                }
            }
            escaper.setSlideLastAngleOrder(angle)
            if (escaperSecond?.isSliding()) {
                escaperSecond.setSlideLastAngleOrder(angleSecond)
            }
        }

        //save click
        if (triggerIsToLocation !== null) {
            AutoContinueAfterSliding.lastClickedX[n] = orderX
            AutoContinueAfterSliding.lastClickedY[n] = orderY
            AutoContinueAfterSliding.isLastTargetALocation[n] = triggerIsToLocation
            // what was clicked, for the hero to go and take it once the slide ends: a meteor, say
            AutoContinueAfterSliding.lastClickedWidgets[n] = triggerIsToLocation ? null : orderWidget

            Apm.nbClicsOnSlide[n] = Apm.nbClicsOnSlide[n] + 1
        }
    }

    const HandleTurn = (triggerIsToLocation: boolean) => {
        const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

        if (!escaper) {
            return
        }

        //init variables
        slider = Natives.UGetTriggerUnit()
        n = GetUnitUserData(slider)
        sliderX = escaper.getHeroX()
        sliderY = escaper.getHeroY()

        if (triggerIsToLocation) {
            orderX = GetOrderPointX()
            orderY = GetOrderPointY()
        } else {
            orderWidget = Natives.UGetOrderTarget()
            orderX = GetWidgetX(orderWidget)
            orderY = GetWidgetY(orderWidget)
        }

        //stop hero
        StopUnit(slider)

        if (escaper.getFirstPersonHandle().isFirstPerson()) {
            return
        }

        //angle
        //if (udg_isMirrorModeOn_j[n]) then
        //    angle = Atan2( sliderY - orderY, sliderX - orderX) * bj_RADTODEG
        //else
        angle = Atan2(orderY - sliderY, orderX - sliderX) * bj_RADTODEG
        //endif

        turnSliderToDirection(escaper, angle, triggerIsToLocation)
    }

    const init_ToTurnOnSlide = () => {
        slideClock = CreateTimer()
        TimerStart(slideClock, 1000000, false, () => {})

        //turn to point
        trg_turnToPoint = createEvent({
            events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER)],
            conditions: [
                () => {
                    const escaper = Hero2Escaper(Natives.UGetTriggerUnit())
                    return IsHero(Natives.UGetTriggerUnit()) && !!escaper?.isSliding() && !IsLastOrderPause()
                },
            ],
            actions: [() => HandleTurn(true)],
        })

        //turn to widget
        trg_turnToWidget = createEvent({
            events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER)],
            conditions: [
                () => {
                    const escaper = Hero2Escaper(Natives.UGetTriggerUnit())
                    return IsHero(Natives.UGetTriggerUnit()) && !!escaper?.isSliding()
                },
            ],
            actions: [() => HandleTurn(false)],
        })

        //drunk mode
        forRange(Constants.NB_ESCAPERS, i => (udg_drunk[i] = INITIAL_DRUNK))

        DRUNK_EFFECTS[1] = DRUNK_EFFECT_PETIT
        DRUNK_EFFECTS[2] = DRUNK_EFFECT_MOYEN
        DRUNK_EFFECTS[3] = DRUNK_EFFECT_GROS
    }

    return {
        udg_isDrunk,
        udg_drunk,
        udg_drunkLevel,
        udg_drunkEffect,
        DRUNK_EFFECTS,
        init_ToTurnOnSlide,
        turnSliderToDirection,
        markSlideDirectionSwitch,
    }
}

export const TurnOnSlide = initTurnOnSlide()

export const init_ToTurnOnSlide = TurnOnSlide.init_ToTurnOnSlide
