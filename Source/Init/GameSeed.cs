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
        Globals.RANDOM_GEN_02 = new Random(GetRandomInt(1, 900000));
    }

    private static bool SpecialSeed()
    {
        if (SoloTournamentSeed()) return true;
        return false;
    }

    private static bool SoloTournamentSeed()
    {
        // Tournament Date: August 22, 2026
        var expectedMonth = 8; // August
        var expectedDay = 22; // 22nd Day

        if (DateTimeManager.CurrentDay != expectedDay || DateTimeManager.CurrentMonth != expectedMonth)
        {
            return false;
        }
        var OmnisSeed = 696969420; // Omnis' Seed for the Solo Tournament 2026
        Globals.GAME_SEED = OmnisSeed;
        Globals.RANDOM_GEN = new Random(OmnisSeed);
        var randomIntSeed = GetRandomInt(int.MinValue + 2, int.MaxValue); // bug if using min value AND max value , so just adding 2 to min to avoid that
        Logger.Debug("RandomintSeed for RNG02: ", randomIntSeed);
        Globals.RANDOM_GEN_02 = new Random(randomIntSeed);
        return true;
    }

}
