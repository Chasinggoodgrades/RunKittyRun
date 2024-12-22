using System;
using WCSharp.Api;
public static class TimeSetter 
{
    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    /// <param name="player"></param>
    public static bool SetRoundTime(player player)
    {
        var standard = Gamemode.CurrentGameMode == "Standard";
        var solo = Gamemode.CurrentGameMode == Globals.GAME_MODES[1]; // Solo
        RoundTimes roundEnum = 0;
        var playersTime = 0.00f;
        var currentTime = GameTimer.RoundTime[Globals.ROUND];

        if (!standard && !solo) return false;

        if(standard) roundEnum = GetRoundEnum();
        if(solo) roundEnum = GetSoloTime();
        if (currentTime >= 1200) return false; // 20 min cap.

        playersTime = Globals.ALL_KITTIES[player].SaveData.GameTimes[roundEnum];

        if (currentTime >= playersTime && playersTime != 0) return false;

        SetSavedTime(player, roundEnum);

        return true;
    }

    private static void SetSavedTime(player player, RoundTimes roundEnum)
    {
        var kittyStats = Globals.ALL_KITTIES[player].SaveData;
        kittyStats.GameTimes[roundEnum] = (int)GameTimer.RoundTime[Globals.ROUND];
    }

    private static RoundTimes GetRoundEnum()
    {
        var currentDiff = Difficulty.DifficultyValue;
        var roundEnum = RoundTimes.RoundOneNormal;

        switch(currentDiff)
        {
            case (int)DifficultyLevel.Normal:
                roundEnum = GetNormalRoundEnum();
                break;
            case (int)DifficultyLevel.Hard:
                roundEnum = GetHardRoundEnum();
                break;  
            case (int)DifficultyLevel.Impossible:
                roundEnum = GetImpossibleRoundEnum();
                break;
            default:
                Console.WriteLine("Invalid difficulty level for GetRoundEnum");
                return 0;
        }
        return roundEnum;
    }

    private static RoundTimes GetSoloTime()
    {
        var roundEnum = GetSoloRoundEnum();
        return roundEnum;
    }

    private static RoundTimes GetNormalRoundEnum()
    {
        var round = Globals.ROUND;
        switch(round)
        {
            case 1:
                return RoundTimes.RoundOneNormal;
            case 2:
                return RoundTimes.RoundTwoNormal;
            case 3:
                return RoundTimes.RoundThreeNormal;
            case 4:
                return RoundTimes.RoundFourNormal;
            case 5:
                return RoundTimes.RoundFiveNormal;
            default:
                Console.WriteLine("Invalid round number for GetNormalRoundEnum");
                return 0;
        }
    }

    private static RoundTimes GetHardRoundEnum()
    {
        var round = Globals.ROUND;
        switch(round)
        {
            case 1:
                return RoundTimes.RoundOneHard;
            case 2:
                return RoundTimes.RoundTwoHard;
            case 3:
                return RoundTimes.RoundThreeHard;
            case 4:
                return RoundTimes.RoundFourHard;
            case 5:
                return RoundTimes.RoundFiveHard;
            default:
                Console.WriteLine("Invalid round number for GetHardRoundEnum");
                return 0;
        }
    }

    private static RoundTimes GetImpossibleRoundEnum()
    {
        var round = Globals.ROUND;
        switch(round)
        {
            case 1:
                return RoundTimes.RoundOneImpossible;
            case 2:
                return RoundTimes.RoundTwoImpossible;
            case 3:
                return RoundTimes.RoundThreeImpossible;
            case 4:
                return RoundTimes.RoundFourImpossible;
            case 5:
                return RoundTimes.RoundFiveImpossible;
            default:
                Console.WriteLine("Invalid round number for GetImpossibleRoundEnum");
                return 0;
        }
    }

    private static RoundTimes GetSoloRoundEnum()
    {
        var round = Globals.ROUND;
        switch(round)
        {
            case 1:
                return RoundTimes.RoundOneSolo;
            case 2:
                return RoundTimes.RoundTwoSolo;
            case 3:
                return RoundTimes.RoundThreeSolo;
            case 4:
                return RoundTimes.RoundFourSolo;
            case 5:
                return RoundTimes.RoundFiveSolo;
            default:
                Console.WriteLine("Invalid round number for GetSoloRoundEnum");
                return 0;
        }
    }
}