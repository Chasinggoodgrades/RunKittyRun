import { Constants } from 'core/01_libraries/Constants'
import { Timer } from 'w3ts'
import { getUdgEscapers } from '../../../globals'
import { createTimer } from '../../Utils/mapUtils'
import { AnglesDiff } from '../01_libraries/Basic_functions'
import {
    HERO_ROTATION_SPEED,
    HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED,
} from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/SlidingMax'
import { log } from '../Log/log'

export const init_measureSpeed = () => {
    createTimer(10, false, () => {
        const hero = getUdgEscapers().get(0)?.getHero()
        const hero2 = getUdgEscapers().get(1)?.getHero()

        if (hero && hero2) {
            // BlzSetUnitFacingEx(hero, 0)
            // BlzSetUnitFacingEx(hero2, 0)

            //blue hero new rotation
            const maxSlideTurnPerPeriod = HERO_ROTATION_SPEED * Constants.SLIDE_PERIOD * 360 //degrees
            let heroBlueStarted = false

            let sens = 1
            let lastSens = sens

            let currentRotationSpeed = 0
            let increaseRotationSpeedPerPeriod =
                (maxSlideTurnPerPeriod * Constants.SLIDE_PERIOD) / HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED

            let tBlueHero: Timer | null = null

            let curSlideTurn = 0

            const startBlueHero = () => {
                // let numTimer = 0
                // tBlueHero = createTimer(Constants.SLIDE_PERIOD, true, () => {
                //     numTimer += Constants.SLIDE_PERIOD
                //     const currentAngle = GetUnitFacing(hero2)
                //     const remainingDegrees = aimAngleWithSens - currentAngle
                //     if (RAbsBJ(remainingDegrees) > 0.05) {
                //
                //         let diffToApplyAbs = RMinBJ(RAbsBJ(remainingDegrees), RAbsBJ(maxSlideTurnPerPeriod))
                //
                //         if (diffToApplyAbs > 0.01) {
                //             //sens
                //             const sens = (remainingDegrees * maxSlideTurnPerPeriod) > 0 ? 1 : -1
                //             const maxIncreaseRotationSpeedPerPeriod = RAbsBJ(maxSlideTurnPerPeriod * Constants.SLIDE_PERIOD / HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED)
                //
                //             let newSlideTurn: number
                //
                //             let increaseRotationSpeedPerPeriod = maxIncreaseRotationSpeedPerPeriod
                //
                //             let diffToApply
                //
                //             if (RAbsBJ(remainingDegrees) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL) {
                //                 const tableInd = Math.round(RAbsBJ(remainingDegrees))
                //                 const aimedSpeedPercentage = SPEED_AT_LEAST_THAN_50_DEGREES[tableInd]
                //                 const aimedNewSpeedPerPeriod = maxSlideTurnPerPeriod * aimedSpeedPercentage * sens / 100
                //                 const diffSpeed = aimedNewSpeedPerPeriod - curSlideTurn
                //                 if (RAbsBJ(diffSpeed) < maxIncreaseRotationSpeedPerPeriod) {
                //                     // print('diff speed inferieure, aim ' + diffSpeed)
                //                     diffToApply = aimedNewSpeedPerPeriod
                //                 }else{
                //                     const sensDiffToApply = diffSpeed > 0 ? 1 : -1
                //                     diffToApply = curSlideTurn + sensDiffToApply * maxIncreaseRotationSpeedPerPeriod
                //                 }
                //                 curSlideTurn = diffToApply
                //                 // print("remainingDegrees : " + remainingDegrees + " ; tableInd : " + tableInd + " ; aim new speed : " + aimedNewSpeedPerPeriod + " ; cuSlideTurn : " + curSlideTurn + " ; maxIncrease " + maxIncreaseRotationSpeedPerPeriod + " ; diffToApply : " + diffToApply)
                //
                //             }else {
                //                 if (sens > 0) {
                //                     newSlideTurn = RMinBJ(curSlideTurn + increaseRotationSpeedPerPeriod, maxSlideTurnPerPeriod)
                //                     diffToApply = RMinBJ(newSlideTurn, diffToApplyAbs)
                //                     diffToApply = RMinBJ(remainingDegrees, diffToApply)
                //                 } else {
                //                     newSlideTurn = RMaxBJ(curSlideTurn - increaseRotationSpeedPerPeriod, -maxSlideTurnPerPeriod)
                //                     diffToApply = RMaxBJ(newSlideTurn, -diffToApplyAbs)
                //                     diffToApply = RMaxBJ(remainingDegrees, diffToApply)
                //                 }
                //                 curSlideTurn = newSlideTurn
                //             }
                //
                //             //turn
                //             const newAngle = currentAngle + diffToApply
                //             BlzSetUnitFacingEx(hero2, newAngle)
                //             // print("old : " + currentAngle + " ; new " + newAngle)
                //
                //             log(numTimer + "\t" + GetUnitFacing(hero) + "\t" + newAngle)
                //         }
                //     }
                // })
            }

            const stopBlueHero = () => {
                // tBlueHero?.destroy()
            }

            // red hero normal rotation
            let lastTimeAngle0 = 0
            let currentTime = 0

            BlzSetUnitFacingEx(hero, 0)

            createTimer(0.01, true, () => {
                if (!heroBlueStarted) {
                    // startBlueHero()
                    heroBlueStarted = true
                }

                const oldAngle = GetUnitFacing(hero)
                const newAngle = oldAngle + 70 * sens
                SetUnitFacing(hero, newAngle)

                currentTime += 0.01
                if (RAbsBJ(AnglesDiff(GetUnitFacing(hero), 0)) < 5) {
                    const circleDuration = currentTime - lastTimeAngle0
                    if (circleDuration > 0.3) {
                        const roundsPerSecond = 1 / circleDuration

                        const str =
                            'Angle ' +
                            GetUnitFacing(hero) +
                            ' ; anglesDiff ' +
                            AnglesDiff(GetUnitFacing(hero), 0) +
                            ' ; lastTime ' +
                            lastTimeAngle0 +
                            ' ; currentTime : ' +
                            currentTime +
                            ' ;  speed : ' +
                            roundsPerSecond
                        print(str)
                        log(str)

                        lastTimeAngle0 = currentTime
                    }
                }

                // const angleParcouru = AnglesDiff(GetUnitFacing(hero), oldAngle)
                // const speed = angleParcouru / 0.5
                // const turnsPerSecond = speed / 360
                //
                // print("angleParcouru : " + angleParcouru + " ; speed : " + speed + "° ; turnsPerSecond : " + turnsPerSecond)
            })

            //change sens
            // createTimer(0.2, true, () => {
            //     sens = -sens
            // })

            //de 10 à 150°

            // let aimAngle = 0
            // let aimAngleWithSens = 0
            // let pause = false
            //
            // let blueStarted = false
            //
            // const myTimer = createTimer(1.8, true, () => {
            //
            //     if (!pause) {
            //         aimAngle += 10
            //
            //         if(!blueStarted){
            //             startBlueHero()
            //             blueStarted = true
            //             BlzSetUnitFacingEx(hero, 0)
            //             BlzSetUnitFacingEx(hero2, 0)
            //         }
            //
            //     } else {
            //         sens = - sens
            //     }
            //
            //     aimAngleWithSens = sens * aimAngle
            //
            //
            //     print("aim angle : " + aimAngleWithSens)
            //     createTimer(0.01, false, () => {
            //         SetUnitFacing(hero, aimAngleWithSens)
            //         print("oui " + aimAngleWithSens)
            //     })
            //
            //     pause = !pause
            //
            //     if (aimAngle == 150) {
            //         myTimer.destroy()
            //         stopBlueHero()
            //     }
            // })
        }
    })
}
