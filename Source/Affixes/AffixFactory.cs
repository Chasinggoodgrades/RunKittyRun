﻿using System.Collections.Generic;
using System.Linq;
using static WCSharp.Api.Common;

public static class AffixFactory
{
    public static List<Affix> AllAffixes = new List<Affix>();
    public static readonly List<string> AffixTypes = new List<string> { "Speedster", "Unpredictable", "Fixation", "Frostbite", "Chaos", "Howler", "Blitzer", "Stealth", "Bomber" };
    private static float[] LaneWeights;
    private static int NUMBER_OF_AFFIXED_WOLVES { get; set; } // (Difficulty.DifficultyValue * 2) + Globals.ROUND;
    private static int MAX_NUMBER_OF_AFFIXES = 1;
    private static int MAX_AFFIXED_PER_LANE = 6;

    /// <summary>
    /// Only works in Standard mode. Initializes lane weights for affix distribution.
    /// </summary>
    public static void Initialize()
    {
        AllAffixes = new List<Affix>();
        InitLaneWeights();
    }

    public static string[] CalculateAffixes()
    {
        var affixCounts = new Dictionary<string, int>();

        foreach (var affix in AllAffixes)
        {
            if (affixCounts.ContainsKey(affix.Name)) continue;
            affixCounts[affix.Name] = 0;
        }

        foreach (var affix in AllAffixes)
        {
            if (affixCounts.ContainsKey(affix.Name))
            {
                affixCounts[affix.Name]++;
            }
        }

        var affixes = new List<string>();
        foreach (var affix in affixCounts)
        {
            if (affix.Value > 0)
            {
                affixes.Add($"{affix.Key} x{affix.Value}");
            }
        }
        var arr = affixes.ToArray();
        GC.RemoveDictionary(ref affixCounts);
        GC.RemoveList(ref affixes);
        return arr;
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

            case "Blitzer":
                return new Blitzer(unit);

            case "Stealth":
                return new Stealth(unit);

            case "Bomber":
                return new Bomber(unit);

            case "Vortex":
                return new Vortex(unit);

            default:
                Logger.Warning($"{Colors.COLOR_YELLOW_ORANGE}Invalid affix|r");
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

        foreach (var lane in WolfArea.WolfAreas)
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
        return unit.AffixCount() < MAX_NUMBER_OF_AFFIXES && !unit.HasAffix(affixName);
    }

    public static Affix ApplyAffix(Wolf unit, string affixName)
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
            affixes.Remove("Chaos");
        }
        return affixes;
    }

    private static Affix ApplyRandomAffix(Wolf unit, int laneNumber)
    {
        // if above lane 8.. exclude fixation
        var affixes = AvailableAffixes(laneNumber);
        var index = GetRandomInt(0, affixes.Count - 1);
        var randomAffix = affixes[index];
        GC.RemoveList(ref affixes);
        return ApplyAffix(unit, randomAffix);
    }

    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static void DistributeAffixes()
    {
        RemoveAllAffixes();
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (!CanDistributeAffixes()) return;

        NUMBER_OF_AFFIXED_WOLVES = (int)(Difficulty.DifficultyValue * 3) + (Globals.ROUND * 8);

        var affixedWolvesInLane = new int[RegionList.WolfRegions.Length];
        var count = 0;
        var interations = 0;
        while (count < NUMBER_OF_AFFIXED_WOLVES && interations < 2000) // limit to prevent crash
        {
            foreach (var j in Enumerable.Range(0, LaneWeights.Length))
            {
                if (GetRandomReal(0, 100) <= LaneWeights[j])
                {
                    if (affixedWolvesInLane[j] < MAX_AFFIXED_PER_LANE)
                    {
                        affixedWolvesInLane[j]++;

                        // Use a single iteration to find eligible wolves and apply affix
                        var eligibleWolves = Globals.ALL_WOLVES.Where(wolf => ShouldAffixWolves(wolf.Value, j));
                        foreach (var wolf in eligibleWolves)
                        {
                            var affix = ApplyRandomAffix(wolf.Value, j);
                            if (affix != null) count++;
                            break; // Apply affix to the first eligible wolf and exit loop
                        }
                    }
                }
                interations += 1;
            }
        }
    }

    // Conditions for affixing wolves:
    // 1. Must be in the same lane
    // 2. Must have fewer than the maximum number of affixes
    // 3. Must not be a blood wolf, or named wolves
    private static bool ShouldAffixWolves(Wolf wolf, int laneIndex)
    {
        return wolf.RegionIndex == laneIndex
            && wolf.AffixCount() < MAX_NUMBER_OF_AFFIXES
            && wolf.Unit != FandF.BloodWolf
            && !NamedWolves.DNTNamedWolves.Contains(wolf);
    }

    private static bool CanDistributeAffixes()
    {
        return Difficulty.DifficultyValue != (int)DifficultyLevel.Normal;
    }

    public static void RemoveAllAffixes()
    {

        foreach(var wolf in Globals.ALL_WOLVES)
        {
            wolf.Value.RemoveAllWolfAffixes();
        }
        AllAffixes.Clear();
    }
}
