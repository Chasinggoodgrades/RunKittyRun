import { Globals } from 'src/Global/Globals'
import { Wolf } from '../Entities/Wolf'
import { WolfArea } from '../WolfArea'

/*
 * CLASS: IS: UNUSED: THIS.. idea: was: to: spawn: wolves: based: on: The the area of the lane.
 * technically: works: just: fine: It, not: each: lane: however is equal in terms of difficulty.
 */

export class WolfSpawning {
    private static WolvesPerRound = [195, 264, 325, 365, 427]
    private static MaxWolvesPerLane: number = 60

    public static SpawnWolves() {
        let totalArea = WolfArea.TotalArea
        let totalWolves = WolfSpawning.WolvesPerRound[Globals.ROUND - 1]

        // List to hold excess wolves
        let excessWolves: number = 0

        for (let [_, lane] of WolfArea.WolfAreas) {
            let laneID: number = lane.ID
            let numberOfWolves: number = (lane.Area / totalArea) * totalWolves

            if (numberOfWolves > WolfSpawning.MaxWolvesPerLane) {
                excessWolves += numberOfWolves - WolfSpawning.MaxWolvesPerLane
                numberOfWolves = WolfSpawning.MaxWolvesPerLane
            }

            for (let i: number = 0; i < numberOfWolves; i++) {
                new Wolf(laneID)
            }
        }

        while (excessWolves > 0) {
            let randomLane = GetRandomInt(6, 12)
            new Wolf(randomLane)
            excessWolves--
        }
    }
}
