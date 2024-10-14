using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
using System.Collections.Generic;
/*
 * THIS CLASS IS UNUSED.. The idea was to spawn wolves based on the area of the lane.
 * It technically works just fine, however not each lane is equal in terms of difficulty.
 */
public static class WolfSpawning
{
    private static int[] WolvesPerRound = new int[] { 185, 254, 305, 355, 407 };
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

            Console.WriteLine($"Spawning {numberOfWolves} wolves in lane {laneID}");
            for (int i = 0; i < numberOfWolves; i++)
            {
                new Wolf(laneID);
            }
        }

        while (excessWolves > 0)
        {
            var randomLane = GetRandomInt(6, 12);
            Console.WriteLine($"Spawning 1 excess wolf in lane {randomLane}");
            new Wolf(randomLane);
            excessWolves--;
        }
    }
}
