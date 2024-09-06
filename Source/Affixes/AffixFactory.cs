using Source;
using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;

public static class AffixFactory
{
    public static List<Affix> AllAffixes;
    private readonly static List<string> AffixTypes = new List<string> { "Speedster", "Unpredictable", "Fixation" };
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
    private static Affix CreateAffix(Wolf unit, string affixName)
    {
        switch (affixName)
        {
            case "Speedster":
                if(Program.Debug) Console.WriteLine("Creating Speedster");
                return new Speedster(unit);
            case "Unpredictable":
                if(Program.Debug) Console.WriteLine("Creating Unpredictable");
                return new Unpredictable(unit);
            case "Fixation":
                if(Program.Debug) Console.WriteLine("Creating Fixation");
                return new Fixation(unit);
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

        for (int i = 0; i < regionCount; i++)
        {
            var region = RegionList.WolfRegions[i];
            var area = region.Width * region.Height;
            totalArea += area;
            LaneWeights[i] = area;
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
        if (unit.AffixCount() > MAX_NUMBER_OF_AFFIXES) return false;
        if (unit.HasAffix(affixName)) return false;
        return true;
    }

    private static void ApplyAffix(Wolf unit, string affixName)
    {
        if(!CanApplyAffix(unit, affixName)) return; 
        var affix = CreateAffix(unit, affixName);
        unit.AddAffix(affix);
    }

    private static void ApplyRandomAffix(Wolf unit, int laneNumber)
    {
        // if above lane 8.. exclude fixation
        var affixes = new List<string>(AffixTypes);
        if (laneNumber > 7) affixes.Remove("Fixation");
        var index = GetRandomInt(0, affixes.Count - 1);
        var randomAffix = AffixTypes[index];
        ApplyAffix(unit, randomAffix);
        affixes.Clear();
    }

    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static void DistributeAffixes()
    {
        if(!CanDistributeAffixes()) return;

        NUMBER_OF_AFFIXED_WOLVES = (Difficulty.DifficultyValue * 2) + Globals.ROUND;

        var affixedWolvesInLane = new int[RegionList.WolfRegions.Length];
        for (int i = 0; i < NUMBER_OF_AFFIXED_WOLVES; i++)
        {
            for (int j = 0; j < LaneWeights.Length; j++)
            {
                if (GetRandomReal(0, 100) <= LaneWeights[j])
                {
                    if (affixedWolvesInLane[j] < MAX_AFFIXED_PER_LANE)
                    {
                        affixedWolvesInLane[j]++;
                        var wolvesInLane = Globals.ALL_WOLVES.FindAll(wolf => RegionList.WolfRegions[j].Region.Contains(wolf.Unit));

                        //var wolf = wolvesInLane[GetRandomInt(0, wolvesInLane.Count - 1)];
                    }
                }
            }
        }
    }

    private static bool CanDistributeAffixes()
    {
        if(Difficulty.DifficultyChosen != Difficulty.s_IMPOSSIBLE)
        {
            RemoveAllAffixes();
            return false;
        }
        return true;
    }
    private static void RemoveAllAffixes()
    {
        foreach (var affix in AllAffixes)
            affix.Remove();
        AllAffixes.Clear();
    }   
}