﻿using System;
using WCSharp.Api;

public static class TimeSetter
{
    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    /// <param name="player"></param>
    public static bool SetRoundTime(player player)
    {
        try
        {
            var standard = Gamemode.CurrentGameMode == "Standard";
            var solo = Gamemode.CurrentGameMode == Globals.GAME_MODES[1]; // Solo
            string roundString = "";
            var currentTime = GameTimer.RoundTime[Globals.ROUND];

            if (currentTime <= 90) return false; // Below 90 seconds is impossible and not valid.. Don't save

            if (!standard && !solo) return false;

            if (standard) roundString = GetRoundEnum();
            if (solo) roundString = GetSoloEnum();
            if (currentTime >= 1200.00f) return false; // 20 min cap.

            var property = Globals.ALL_KITTIES[player].SaveData.RoundTimes.GetType().GetProperty(roundString);
            var value = (float)property.GetValue(Globals.ALL_KITTIES[player].SaveData.RoundTimes);

            if (currentTime >= value && value != 0) return false;

            SetSavedTime(player, roundString);
            PersonalBestAwarder.BeatRecordTime(player);

            return true;
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TimeSetter.SetRoundTime: {e.Message}");
            throw;
        }
    }

    public static string GetRoundEnum()
    {
        var currentDiff = Difficulty.DifficultyValue;
        string roundEnum;
        switch (currentDiff)
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
                return "";
        }
        return roundEnum;
    }

    public static string GetSoloEnum()
    {
        var roundEnum = GetSoloRoundEnum();
        return roundEnum;
    }

    private static void SetSavedTime(player player, string roundString)
    {
        var kittyStats = Globals.ALL_KITTIES[player].SaveData;
        var property = kittyStats.RoundTimes.GetType().GetProperty(roundString);
        property.SetValue(kittyStats.RoundTimes, Math.Round(Math.Max(GameTimer.RoundTime[Globals.ROUND], 0.01f), 2));
    }

    private static string GetNormalRoundEnum()
    {
        var gameTimeData = Globals.GAME_TIMES;
        var round = Globals.ROUND;
        switch (round)
        {
            case 1:
                return nameof(gameTimeData.RoundOneNormal);

            case 2:
                return nameof(gameTimeData.RoundTwoNormal);

            case 3:
                return nameof(gameTimeData.RoundThreeNormal);

            case 4:
                return nameof(gameTimeData.RoundFourNormal);

            case 5:
                return nameof(gameTimeData.RoundFiveNormal);

            default:
                Console.WriteLine("Invalid round number for GetNormalRoundEnum");
                return "";
        }
    }

    private static string GetHardRoundEnum()
    {
        var round = Globals.ROUND;
        var gameTimeData = Globals.GAME_TIMES;
        switch (round)
        {
            case 1:
                return nameof(gameTimeData.RoundOneHard);

            case 2:
                return nameof(gameTimeData.RoundTwoHard);

            case 3:
                return nameof(gameTimeData.RoundThreeHard);

            case 4:
                return nameof(gameTimeData.RoundFourHard);

            case 5:
                return nameof(gameTimeData.RoundFiveHard);

            default:
                Console.WriteLine("Invalid round number for GetHardRoundEnum");
                return "";
        }
    }

    private static string GetImpossibleRoundEnum()
    {
        var round = Globals.ROUND;
        var gameTimeData = Globals.GAME_TIMES;
        switch (round)
        {
            case 1:
                return nameof(gameTimeData.RoundOneImpossible);

            case 2:
                return nameof(gameTimeData.RoundTwoImpossible);

            case 3:
                return nameof(gameTimeData.RoundThreeImpossible);

            case 4:
                return nameof(gameTimeData.RoundFourImpossible);

            case 5:
                return nameof(gameTimeData.RoundFiveImpossible);

            default:
                Console.WriteLine("Invalid round number for GetImpossibleRoundEnum");
                return "";
        }
    }

    private static string GetSoloRoundEnum()
    {
        var round = Globals.ROUND;
        var gameTimeData = Globals.GAME_TIMES;
        switch (round)
        {
            case 1:
                return nameof(gameTimeData.RoundOneSolo);

            case 2:
                return nameof(gameTimeData.RoundTwoSolo);

            case 3:
                return nameof(gameTimeData.RoundThreeSolo);

            case 4:
                return nameof(gameTimeData.RoundFourSolo);

            case 5:
                return nameof(gameTimeData.RoundFiveSolo);

            default:
                Console.WriteLine("Invalid round number for GetSoloRoundEnum");
                return "";
        }
    }
}
