using Source;
using System;
using System.Collections.Generic;
using System.Linq;
using static WCSharp.Api.Common;

public static class AffixFactory
{
    public static List<Affix> AllAffixes;
    public readonly static List<string> AffixTypes = new List<string> { "Speedster", "Unpredictable", "Fixation", "Frostbite", "Chaos", "Howler" };
    private static float[] LaneWeights;
    private static int NUMBER_OF_AFFIXED_WOLVES; // (Difficulty.DifficultyValue * 2) + Globals.ROUND;
    private static int MAX_NUMBER_OF_AFFIXES = 1;
    private static int MAX_AFFIXED_PER_LANE = 3;

    /// <summary>
    /// Only works in Standard mode. Initializes lane weights for affix distribution.
    /// </summary>
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        if(Program.Debug) Console.WriteLine("Initializing AffixFactory");
        AllAffixes = new List<Affix>();
        InitLaneWeights();
    }
    public static Affix CreateAffix(Wolf unit, string affixName)
    {
        switch (affixName)
        {
            case "Speedster":
                return new Speedster(unit);
            case "Unpredictable":
                return new Unpredictable(unit);
            case "Fixation":
                return new Fixation(unit);
            case "Frostbite":
                return new Frostbite(unit);
            case "Chaos":
                return new Chaos(unit);
            case "Howler":
                return new Howler(unit);
            default:
                if(Program.Debug) Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}Invalid affix|r");
                return null;
        }
    }
    /// <summary>
    /// Initializes the lane weights for affix distribution.
    /// </summary>
    private static void InitLaneWeights()
    {
        var regionCount = RegionList.WolfRegions.Length;
        var totalArea = 0.0f;
        LaneWeights = new float[regionCount];

        foreach(var lane in WolfArea.WolfAreas)
        {
            totalArea += lane.Value.Area;
            LaneWeights[lane.Value.ID] = lane.Value.Area;
        }

        // Normalizing Weights
        for (int i = 0; i < regionCount; i++)
        {
            LaneWeights[i] = LaneWeights[i] / totalArea * 100;
            //if(Program.Debug) Console.WriteLine($"Lane {i + 1} weight: {LaneWeights[i]}");
        }
    }
    
    /* summary 
     * Checks if we can apply affix to Wolf type.
     * @parm unit: Wolf
     * @optional affixName: string
     */
    private static bool CanApplyAffix(Wolf unit, string affixName = "x")
    {
        if (unit.AffixCount() >= MAX_NUMBER_OF_AFFIXES) return false;
        if (unit.HasAffix(affixName)) return false;
        return true;
    }

    private static Affix ApplyAffix(Wolf unit, string affixName)
    {
        if (!CanApplyAffix(unit, affixName)) return null;
        var affix = CreateAffix(unit, affixName);
        unit.AddAffix(affix);
        return affix;
    }

    private static List<string> AvailableAffixes(int laneNumber)
    {
        var affixes = new List<string>(AffixTypes);
        if (laneNumber > 7 || Difficulty.DifficultyValue == (int)DifficultyLevel.Hard)
            affixes.Remove("Fixation");
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Hard)
        {
            affixes.Remove("Frostbite");
        }
        return affixes;
    }

    private static Affix ApplyRandomAffix(Wolf unit, int laneNumber)
    {
        // if above lane 8.. exclude fixation
        var affixes = AvailableAffixes(laneNumber);
        var index = GetRandomInt(0, affixes.Count - 1);
        var randomAffix = affixes[index];
        affixes.Clear();
        return ApplyAffix(unit, randomAffix);
    }

    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static void DistributeAffixes()
    {
        RemoveAllAffixes();
        if (!CanDistributeAffixes()) return;

        NUMBER_OF_AFFIXED_WOLVES = (Difficulty.DifficultyValue * 2) + Globals.ROUND;

        var affixedWolvesInLane = new int[RegionList.WolfRegions.Length];
        var count = 0;
        while(count < NUMBER_OF_AFFIXED_WOLVES)
        {
            foreach (var j in Enumerable.Range(0, LaneWeights.Length))
            {
                if (GetRandomReal(0, 100) <= LaneWeights[j])
                {
                    if (affixedWolvesInLane[j] < MAX_AFFIXED_PER_LANE)
                    {
                        affixedWolvesInLane[j]++;
                        var wolvesInLane = Globals.ALL_WOLVES.Values
                            .Where(wolf => wolf.RegionIndex == j && wolf.AffixCount() < MAX_NUMBER_OF_AFFIXES)
                            .ToList();

                        if (wolvesInLane.Any())
                        {
                            var wolf = wolvesInLane[GetRandomInt(0, wolvesInLane.Count - 1)];
                            var affix = ApplyRandomAffix(wolf, j);
                            if(affix != null) count++;
                        }
                    }
                }
            }
        }
    }


    private static bool CanDistributeAffixes()
    {
        return Difficulty.DifficultyValue != (int)DifficultyLevel.Normal;
    }
    private static void RemoveAllAffixes()
    {
        foreach (var affix in AllAffixes)
            affix.Unit.RemoveAffix(affix);
        AllAffixes.Clear();
    }   
}