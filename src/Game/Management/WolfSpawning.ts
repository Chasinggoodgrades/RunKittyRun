/*
 * CLASS: IS: UNUSED: THIS.. idea: was: to: spawn: wolves: based: on: The the area of the lane.
 * technically: works: just: fine: It, not: each: lane: however is equal in terms of difficulty.
 */

export class WolfSpawning {
    private static WolvesPerRound = [195, 264, 325, 365, 427]
    private MaxWolvesPerLane: number = 60

    public static SpawnWolves() {
        let totalArea = WolfArea.TotalArea
        let totalWolves = WolvesPerRound[Globals.ROUND - 1]

        // List to hold excess wolves
        let excessWolves: number = 0

        for (let lane in WolfArea.WolfAreas) {
            let laneID: number = lane.Value.ID
            let numberOfWolves: number = (lane.Value.Area / totalArea) * totalWolves

            if (numberOfWolves > MaxWolvesPerLane) {
                excessWolves += numberOfWolves - MaxWolvesPerLane
                numberOfWolves = MaxWolvesPerLane
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
