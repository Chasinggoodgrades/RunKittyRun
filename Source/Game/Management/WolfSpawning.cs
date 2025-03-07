/*
 * THIS CLASS IS UNUSED.. The idea was to spawn wolves based on the area of the lane.
 * It technically works just fine, however not each lane is equal in terms of difficulty.
 */

using System;
using static WCSharp.Api.Common;

public static class WolfSpawning
{
    private static int[] WolvesPerRound = new int[] { 195, 264, 325, 365, 427 };
    private const int MaxWolvesPerLane = 60;
    public static void SpawnWolves()
    {
        var totalArea = WolfArea.TotalArea;
        var totalWolves = WolvesPerRound[Globals.ROUND - 1];

        // List to hold excess wolves
        int excessWolves = 0;

        foreach (var lane in WolfArea.WolfAreas)
        {
            int laneID = lane.Value.ID;
            int numberOfWolves = (int)((lane.Value.Area / (double)totalArea) * totalWolves);

            if (numberOfWolves > MaxWolvesPerLane)
            {
                excessWolves += numberOfWolves - MaxWolvesPerLane;
                numberOfWolves = MaxWolvesPerLane;
            }

            for (int i = 0; i < numberOfWolves; i++)
            {
                new Wolf(laneID);
            }
        }

        while (excessWolves > 0)
        {
            var randomLane = GetRandomInt(6, 12);
            new Wolf(randomLane);
            excessWolves--;
        }
    }
}
