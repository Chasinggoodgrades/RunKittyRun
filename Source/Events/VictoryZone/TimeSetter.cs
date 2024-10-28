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
        var playersTime = 0;
        var currentTime = GameTimer.RoundTime[Globals.ROUND];

        if (!standard && !solo) return false;

        if(standard) roundEnum = GetRoundEnum();
        if(solo) roundEnum = GetSoloTime();

        playersTime = Globals.ALL_KITTIES[player].SaveData.GameTimes[roundEnum];

        if (currentTime >= playersTime && playersTime != 0) return false;

        SetSavedTime(player, roundEnum);

        Console.WriteLine($"Setting {roundEnum.ToString()} to {playersTime} for {player.Name}");
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
        var roundEnum = RoundTimes.ROneNormal;

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
                return RoundTimes.ROneNormal;
            case 2:
                return RoundTimes.RTwoNormal;
            case 3:
                return RoundTimes.RThreeNormal;
            case 4:
                return RoundTimes.RFourNormal;
            case 5:
                return RoundTimes.RFiveNormal;
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
                return RoundTimes.ROneHard;
            case 2:
                return RoundTimes.RTwoHard;
            case 3:
                return RoundTimes.RThreeHard;
            case 4:
                return RoundTimes.RFourHard;
            case 5:
                return RoundTimes.RFiveHard;
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
                return RoundTimes.ROneImpossible;
            case 2:
                return RoundTimes.RTwoImpossible;
            case 3:
                return RoundTimes.RThreeImpossible;
            case 4:
                return RoundTimes.RFourImpossible;
            case 5:
                return RoundTimes.RFiveImpossible;
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
                return RoundTimes.SoloRoundOne;
            case 2:
                return RoundTimes.SoloRoundTwo;
            case 3:
                return RoundTimes.SoloRoundThree;
            case 4:
                return RoundTimes.SoloRoundFour;
            case 5:
                return RoundTimes.SoloRoundFive;
            default:
                Console.WriteLine("Invalid round number for GetSoloRoundEnum");
                return 0;
        }
    }
}