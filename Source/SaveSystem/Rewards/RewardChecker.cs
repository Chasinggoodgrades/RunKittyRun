using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardChecker
{
    private static void RewardCheckGameStats(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var stats = kitty.SaveData;
    }

    /// <summary>
    /// Checks if <typeparamref name="player"/> has earned any rewards for their saves or save streaks.
    /// </summary>
    /// <param name="player"></param>
    public static void RewardCheckSaves(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var stats = kitty.SaveData;

    }

    public static void CheckAllGameAwards(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var awards = kitty.SaveData.GameAwards;

        foreach(var award in awards)
        {
            Console.WriteLine(award.Key.ToString());
        }


    }

}