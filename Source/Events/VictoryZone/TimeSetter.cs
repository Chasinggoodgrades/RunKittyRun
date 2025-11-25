using System;
using WCSharp.Api;

public class TimeSetter
{
    private static readonly TimeSetter _instance = new TimeSetter();
    public static TimeSetter Instance => _instance;
    public bool RoundTimeSet { get; private set; }

    private TimeSetter()
    {
    }

    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    /// <param name="player"></param>
    public bool SetRoundTime(Kitty kitty)
    {
        try
        {
            var standard = Gamemode.CurrentGameMode == GameMode.Standard;
            var solo = Gamemode.CurrentGameMode == GameMode.SoloTournament; // Solo
            string roundString = "";
            var currentTime = GameTimer.RoundTime[Globals.ROUND];

            if (kitty.CurrentStats.RoundFinished) return false;
            if (!kitty.CanEarnAwards) return false;

            if (currentTime <= 90 && !Source.Program.Debug) return false; // Below 90 seconds is impossible and not valid.. Don't save, particularly with debug / dev testing

            if (!standard && !solo) return false;

            if (standard) roundString = GetRoundEnum();
            if (solo) roundString = GetSoloEnum();
            if (currentTime >= 3599.00f) return false; // 59min 59 second cap

            var property = kitty.SaveData.RoundTimes.GetType().GetProperty(roundString);
            var value = (float)property.GetValue(kitty.SaveData.RoundTimes);

            CreateTimeTextTag(kitty, currentTime);

            if (currentTime >= value && value != 0) return false;
            SetSavedTime(kitty.Player, roundString);
            PersonalBestAwarder.BeatRecordTime(kitty.Player);

            return true;
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TimeSetter.SetRoundTime: {e.Message}");
            throw;
        }
    }

    private void CreateTimeTextTag(Kitty k, float currentTime)
    {
        texttag timeText = texttag.Create();
        timeText.SetPosition(k.Unit.X, k.Unit.Y, -120.0f);
        timeText.SetText($"{Colors.GetStringColorOfPlayer(k.Player.Id + 1)}{Utility.ConvertFloatToTime(currentTime, k.Player.Id + 1)}", 0.025f);
        timeText.SetVelocity(0, 0.02f);
        timeText.SetVisibility(true);
        Utility.SimpleTimer(3.0f, () => timeText.Dispose());
    }

    public string GetRoundEnum()
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
            case (int)DifficultyLevel.Nightmare:
                roundEnum = GetNightmareRoundEnum();
                break;
            default:
                Logger.Critical("Invalid difficulty level for GetRoundEnum");
                return "";
        }
        return roundEnum;
    }

    public string GetSoloEnum()
    {
        var roundEnum = GetSoloRoundEnum();
        return roundEnum;
    }

    private void SetSavedTime(player player, string roundString)
    {
        var kittyStats = Globals.ALL_KITTIES[player].SaveData;
        var property = kittyStats.RoundTimes.GetType().GetProperty(roundString);
        property.SetValue(kittyStats.RoundTimes, Math.Round(Math.Max(GameTimer.RoundTime[Globals.ROUND], 0.01f), 2));
    }

    private string GetNormalRoundEnum()
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
                Logger.Critical("Invalid round number for GetNormalRoundEnum");
                return "";
        }
    }

    private string GetHardRoundEnum()
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
                Logger.Critical("Invalid round number for GetHardRoundEnum");
                return "";
        }
    }

    private string GetImpossibleRoundEnum()
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
                Logger.Critical("Invalid round number for GetImpossibleRoundEnum");
                return "";
        }
    }

    private string GetNightmareRoundEnum()
    {
        var round = Globals.ROUND;
        var gameTimeData = Globals.GAME_TIMES;
        switch (round)
        {
            case 1:
                return nameof(gameTimeData.RoundOneNightmare);

            case 2:
                return nameof(gameTimeData.RoundTwoNightmare);

            case 3:
                return nameof(gameTimeData.RoundThreeNightmare);

            case 4:
                return nameof(gameTimeData.RoundFourNightmare);

            case 5:
                return nameof(gameTimeData.RoundFiveNightmare);

            default:
                Logger.Critical("Invalid round number for GetNightmareRoundEnum");
                return "";
        }
    }

    private string GetSoloRoundEnum()
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

    public void SetRoundFinishedTime()
    {
        try
        {
            var currentTime = GameTimer.RoundTime[Globals.ROUND];

            if (RoundTimeSet) return;

            GameTimer.FinishedTimes[Globals.ROUND] = (float)Math.Round(currentTime, 2);
            RoundTimeSet = true;
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TimeSetter.SetRoundFinishedTime: {e.Message}");
            throw;
        }
    }

    public void ResetFinishedTimeCapture()
    {
        RoundTimeSet = false;
    }

}
