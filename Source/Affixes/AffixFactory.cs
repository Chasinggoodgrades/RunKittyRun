using System;
using System.Collections.Generic;
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
    private static int MAX_FIXIATION_PER_LANE = 3;
    private static Random Random = Globals.RANDOM_GEN; // Seeded for consistency

    private static List<string> TempAffixesList = new List<string>();
    private static Dictionary<string, int> TempAffixCounts = new Dictionary<string, int>();
    /// <summary>
    /// Only works in Standard mode. Initializes lane weights for affix distribution.
    /// </summary>
    public static void Initialize()
    {
        AllAffixes = new List<Affix>();
        InitLaneWeights();
    }

    public static string[] CalculateAffixes(int laneIndex = -1)
    {

        foreach (var affix in AllAffixes)
        {
            if (TempAffixCounts.ContainsKey(affix.Name)) continue;
            if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue;
            TempAffixCounts[affix.Name] = 0;
        }

        foreach (var affix in AllAffixes)
        {
            if (TempAffixCounts.ContainsKey(affix.Name))
            {
                if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue;
                TempAffixCounts[affix.Name]++;
            }
        }

        foreach (var affix in TempAffixCounts)
        {
            if (affix.Value > 0)
            {
                TempAffixesList.Add($"{affix.Key} x{affix.Value}");
            }
        }
        var arr = TempAffixesList.ToArray();
        TempAffixCounts.Clear();
        TempAffixesList.Clear();
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

    private static string AvailableAffixes(int laneNumber)
    {
        var affixes = string.Join(", ", AffixTypes); // Start with all affixes in a single string
        var fixationCount = WolfArea.WolfAreas[laneNumber].FixationCount;
        if (laneNumber > 6 || Difficulty.DifficultyValue == (int)DifficultyLevel.Hard || fixationCount >= MAX_FIXIATION_PER_LANE)
            affixes = affixes.Replace("Fixation, ", "").Replace(", Fixation", "").Replace("Fixation", "");
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Hard)
        {
            affixes = affixes.Replace("Chaos, ", "").Replace(", Chaos", "").Replace("Chaos", "");
        }
        return affixes.Trim();
    }

    private static Affix ApplyRandomAffix(Wolf unit, int laneNumber)
    {
        try
        {
            var affixes = AvailableAffixes(laneNumber);

            var affixArray = affixes.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries);

            if (affixArray.Length == 0)
                return null;

            var randomIndex = Random.Next(0, affixArray.Length); // max value is exclusive
            var randomAffix = affixArray[randomIndex];
            return ApplyAffix(unit, randomAffix);
        }
        catch (Exception ex)
        {
            Logger.Warning($"{Colors.COLOR_RED}Error in ApplyRandomAffix: {ex.Message}{Colors.COLOR_RESET}");
            return null;
        }

    }


    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static void DistAffixes()
    {
        try
        {
            RemoveAllAffixes();
            if (Gamemode.CurrentGameMode == GameMode.SoloTournament) return; // Solo Return.. Team tournament should work.
            if (!CanDistributeAffixes()) return;

            if (Gamemode.CurrentGameMode == GameMode.Standard)
                NUMBER_OF_AFFIXED_WOLVES = (int)(Difficulty.DifficultyValue * 3) + (Globals.ROUND * 8);
            else NUMBER_OF_AFFIXED_WOLVES = 26 + (Globals.ROUND * 8);

            // Nightmare Difficulty Adjustment.. All Wolves get affixed
            if (Difficulty.DifficultyValue == (int)DifficultyLevel.Nightmare)
            {
                foreach (var wolf in Globals.ALL_WOLVES.Values)
                {
                    if (!ShouldAffixWolves(wolf, wolf.RegionIndex)) continue;
                    ApplyRandomAffix(wolf, wolf.RegionIndex);
                }
                return;
            }

            // # per lane based on the weights
            float totalWeight = LaneWeights.Sum(); // IEnumerable is shit still but this doesnt call but 5 times a game so its fine
            var laneDistribution = new int[LaneWeights.Length];
            int totalAssigned = 0;

            for (int i = 0; i < LaneWeights.Length; i++)
            {
                // Set proportions based on lane weights
                float ratio = LaneWeights[i] / totalWeight;
                laneDistribution[i] = (int)Math.Floor(NUMBER_OF_AFFIXED_WOLVES * ratio);
                totalAssigned += laneDistribution[i];
            }

            // ^ rounding can cause some left overs so here we are 
            int leftover = NUMBER_OF_AFFIXED_WOLVES - totalAssigned;
            for (int i = 0; i < LaneWeights.Length && leftover > 0; i++)
            {
                if (laneDistribution[i] < MAX_AFFIXED_PER_LANE)
                {
                    laneDistribution[i]++;
                    leftover--;
                }
            }

            // Go thru and apply affixes to each lane
            for (int i = 0; i < laneDistribution.Length; i++)
            {
                int affixTarget = Math.Min(laneDistribution[i], MAX_AFFIXED_PER_LANE);
                var wolvesInLane = WolfArea.WolfAreas[i].Wolves;

                // Add affixes to random wolves until the {affixTarget} is reached
                int appliedCount = 0;
                for (int j = 0; j < wolvesInLane.Count && appliedCount < affixTarget; j++)
                {
                    var wolf = wolvesInLane[j];
                    if (!ShouldAffixWolves(wolf, i)) continue;

                    var affix = ApplyRandomAffix(wolf, i);
                    if (affix != null) appliedCount++;
                }
            }
        }
        catch (Exception ex)
        {
            Logger.Critical($"{Colors.COLOR_RED}Error in DistAffixes: {ex.Message}{Colors.COLOR_RESET}");
            RemoveAllAffixes();
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
