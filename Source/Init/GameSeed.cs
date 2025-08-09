using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class GameSeed
{
    public static void Initialize()
    {
        if (SpecialSeed()) return;
        Globals.GAME_SEED = GetRandomInt(1, 900000);
        Globals.RANDOM_GEN = new Random(Globals.GAME_SEED);
    }

    private static bool SpecialSeed()
    {
        if (TeamTournament2025Seed()) return true;
        return false;
    }

    private static bool TeamTournament2025Seed()
    {
        // Tournament Date: August 9, 2025
        var expectedMonth = 8; // August
        var expectedDay = 9; // 9th Day

        if (DateTimeManager.CurrentDay != expectedDay || DateTimeManager.CurrentMonth != expectedMonth)
        {
            return false;
        }
        var OmnisSeed = 458266; // Omnis' Seed for the Team Tournament 2025
        Globals.GAME_SEED = OmnisSeed;
        Globals.RANDOM_GEN = new Random(OmnisSeed);

        return true;
    }

}
