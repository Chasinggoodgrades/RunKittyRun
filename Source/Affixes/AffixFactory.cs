using Source;
using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;

public static class AffixFactory
{
    private readonly static List<string> AffixTypes = new List<string> { "Speedster", "Unpredictable" };
    private static int[] LaneWeights;
    private static int NUMBER_OF_AFFIXED_WOLVES = (Difficulty.DifficultyValue * 2) + Globals.ROUND;
    private static int MAX_NUMBER_OF_AFFIXES = 1;
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        if(Program.Debug) Console.WriteLine("Initializing AffixFactory");
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
            default:
                if(Program.Debug) Console.WriteLine($"{Color.COLOR_YELLOW_ORANGE}Invalid affix|r");
                return null;
        }
    }

    /* summary
     * Weights each lane, where wider lanes have higher weights.
     */
    private static void InitLaneWeights()
    {
        LaneWeights = new int[RegionList.WolfRegions.Length];
        for (int i = 0; i < RegionList.WolfRegions.Length; i++)
        {
            // Finish Weights
        }
    }
    
    /* summary 
     * Checks if we can apply affix to Wolf type.
     * @parm unit: Wolf
     * @optional affixName: string
     */
    private static bool CanApplyAffix(Wolf unit, string affixName = "")
    {
        if (unit.AffixCount() > MAX_NUMBER_OF_AFFIXES) return false;
        if (unit.HasAffix(affixName)) return false;
        return true;
    }

    public static void ApplyAffix(Wolf unit, string affixName)
    {
        if(!CanApplyAffix(unit, affixName)) return; 
        var affix = CreateAffix(unit, affixName);
        unit.AddAffix(affix);
    }

    public static void ApplyRandomAffix(Wolf unit)
    {
        var index = GetRandomInt(0, AffixTypes.Count - 1);
        var randomAffix = AffixTypes[index];
        ApplyAffix(unit, randomAffix);
    }

    public static void ApplyAffixes()
    {
        // 
    }


}