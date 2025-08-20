import { Globals } from 'src/Global/Globals'
import { Wolf } from '../Entities/Wolf'
import { WolfArea } from '../WolfArea'

/*
 * THIS CLASS IS UNUSED.. The idea was to spawn wolves based on the area of the lane.
 * It technically works just fine, however not each lane is equal in terms of difficulty.
 */

export class WolfSpawning {
    private static WolvesPerRound = [195, 264, 325, 365, 427]
    private static MaxWolvesPerLane = 60

    public static SpawnWolves = () => {
        const totalArea = WolfArea.TotalArea
        const totalWolves = WolfSpawning.WolvesPerRound[Globals.ROUND - 1]

        // List to hold excess wolves
        let excessWolves = 0

        for (const [_, lane] of WolfArea.WolfAreas) {
            const laneID: number = lane.ID
            let numberOfWolves: number = (lane.Area / totalArea) * totalWolves

            if (numberOfWolves > WolfSpawning.MaxWolvesPerLane) {
                excessWolves += numberOfWolves - WolfSpawning.MaxWolvesPerLane
                numberOfWolves = WolfSpawning.MaxWolvesPerLane
            }

            for (let i = 0; i < numberOfWolves; i++) {
                new Wolf(laneID)
            }
        }

        while (excessWolves > 0) {
            const randomLane = GetRandomInt(6, 12)
            new Wolf(randomLane)
            excessWolves--
        }
    }
}
