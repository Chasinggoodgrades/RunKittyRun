using Source;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class AffixFactory
{
    private readonly static List<string> AffixTypes = new List<string> { "Speedster", "Unpredictable" };
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

    public static void ApplyAffix(Wolf unit, string affixName)
    {
        var affix = CreateAffix(unit, affixName);
        unit.AddAffix(affix);
    }

    public static void ApplyRandomAffix(Wolf unit)
    {
        try
        {
            var index = GetRandomInt(0, AffixTypes.Count - 1);
            var randomAffix = AffixTypes[index];
            var affix = CreateAffix(unit, randomAffix);
            unit.AddAffix(affix);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }   
    }


}