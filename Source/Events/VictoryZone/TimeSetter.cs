using System;
using WCSharp.Api;

public class TimeSetter
{
    private static readonly TimeSetter _instance = new TimeSetter();
    public static TimeSetter Instance => _instance;

    public bool RoundTimeSet { get; private set; }

    private TimeSetter() { }

    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    public bool SetRoundTime(Kitty kitty)
    {
        try
        {
            if (!IsValidForTimeUpdate(kitty))
                return false;

            var currentTime = GameTimer.RoundTime[Globals.ROUND];
            var isStandard = Gamemode.CurrentGameMode == GameMode.Standard;
            var isSolo = Gamemode.CurrentGameMode == GameMode.Solo;

            if (!isStandard && !isSolo)
                return false;

            if (currentTime >= 3599.00f)
                return false;

            string roundPropertyName = isStandard
                ? GetRoundPropertyName()
                : GetSoloPropertyName();

            CreateTimeTextTag(kitty, currentTime);

            // Always update league season best
            StatManager.UpdateLeagueBestRoundTime(kitty, roundPropertyName, currentTime);
            var savedTime = GetSavedTime(kitty.SaveData.RoundTimes, roundPropertyName);

            // Check and update personal best if improved
            if (!IsNewPersonalBest(kitty, roundPropertyName, currentTime, savedTime))
                return false;

            SetSavedTime(kitty, roundPropertyName, currentTime);
            PersonalBestAwarder.BeatRecordTime(kitty.Player, savedTime);

            return true;
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TimeSetter.SetRoundTime: {e.Message}");
            throw;
        }
    }

    private bool IsValidForTimeUpdate(Kitty kitty)
    {
        if (kitty.CurrentStats.RoundFinished)
            return false;

        if (!kitty.CanEarnAwards)
            return false;

        var currentTime = GameTimer.RoundTime[Globals.ROUND];

        if (currentTime <= 90 && !Source.Program.Debug)
            return false; // Below 90 seconds is impossible

        return true;
    }

    private bool IsNewPersonalBest(Kitty kitty, string roundPropertyName, float currentTime, float savedTime)
    {
        Logger.Debug($"Current Time: {currentTime:F2}, Saved Time: {savedTime:F2} | " +
                     $"Player: {kitty.Player.Name} | Round: {Globals.ROUND} | " +
                     $"Difficulty: {Difficulty.DifficultyValue}");

        return currentTime < savedTime || savedTime == 0;
    }

    private float GetSavedTime(object roundTimes, string propertyName)
    {
        var property = roundTimes.GetType().GetProperty(propertyName);
        return property != null ? (float)property.GetValue(roundTimes) : 0f;
    }

    private void SetSavedTime(Kitty kitty, string roundPropertyName, float time)
    {
        var roundedTime = (float)Math.Round(Math.Max(time, 0.01f), 2);

        var property = kitty.SaveData.RoundTimes.GetType().GetProperty(roundPropertyName);
        if (property == null)
            return;

        property.SetValue(kitty.SaveData.RoundTimes, roundedTime);

        StatManager.UpdateLeagueBestRoundTime(kitty, roundPropertyName, roundedTime);

        Logger.Debug($"New personal best set for {kitty.Player.Name} on round {Globals.ROUND} " +
                     $"(Diff: {Difficulty.DifficultyValue}): {roundedTime:F2}");
    }

    public string GetRoundPropertyName()
    {
        return Difficulty.DifficultyValue switch
        {
            (int)DifficultyLevel.Normal => GetNormalRoundProperty(),
            (int)DifficultyLevel.Hard => GetHardRoundProperty(),
            (int)DifficultyLevel.Impossible => GetImpossibleRoundProperty(),
            (int)DifficultyLevel.Nightmare => GetNightmareRoundProperty(),
            (int)DifficultyLevel.Progressive => GetProgressiveRoundProperty(),
            _ => LogAndReturnEmpty("Invalid difficulty level")
        };
    }

    public string GetSoloPropertyName() => GetSoloRoundProperty();

    // === Property Name Helpers ===

    private string GetNormalRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneNormal),
        2 => nameof(Globals.GAME_TIMES.RoundTwoNormal),
        3 => nameof(Globals.GAME_TIMES.RoundThreeNormal),
        4 => nameof(Globals.GAME_TIMES.RoundFourNormal),
        5 => nameof(Globals.GAME_TIMES.RoundFiveNormal),
        _ => LogAndReturnEmpty("Invalid round for Normal difficulty")
    };

    private string GetHardRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneHard),
        2 => nameof(Globals.GAME_TIMES.RoundTwoHard),
        3 => nameof(Globals.GAME_TIMES.RoundThreeHard),
        4 => nameof(Globals.GAME_TIMES.RoundFourHard),
        5 => nameof(Globals.GAME_TIMES.RoundFiveHard),
        _ => LogAndReturnEmpty("Invalid round for Hard difficulty")
    };

    private string GetProgressiveRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneProgressive),
        2 => nameof(Globals.GAME_TIMES.RoundTwoProgressive),
        3 => nameof(Globals.GAME_TIMES.RoundThreeProgressive),
        _ => LogAndReturnEmpty("Invalid round for Progressive difficulty")
    };

    private string GetImpossibleRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneImpossible),
        2 => nameof(Globals.GAME_TIMES.RoundTwoImpossible),
        3 => nameof(Globals.GAME_TIMES.RoundThreeImpossible),
        4 => nameof(Globals.GAME_TIMES.RoundFourImpossible),
        5 => nameof(Globals.GAME_TIMES.RoundFiveImpossible),
        _ => LogAndReturnEmpty("Invalid round for Impossible difficulty")
    };

    private string GetNightmareRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneNightmare),
        2 => nameof(Globals.GAME_TIMES.RoundTwoNightmare),
        3 => nameof(Globals.GAME_TIMES.RoundThreeNightmare),
        4 => nameof(Globals.GAME_TIMES.RoundFourNightmare),
        5 => nameof(Globals.GAME_TIMES.RoundFiveNightmare),
        _ => LogAndReturnEmpty("Invalid round for Nightmare difficulty")
    };

    private string GetSoloRoundProperty() => Globals.ROUND switch
    {
        1 => nameof(Globals.GAME_TIMES.RoundOneSolo),
        2 => nameof(Globals.GAME_TIMES.RoundTwoSolo),
        3 => nameof(Globals.GAME_TIMES.RoundThreeSolo),
        4 => nameof(Globals.GAME_TIMES.RoundFourSolo),
        5 => nameof(Globals.GAME_TIMES.RoundFiveSolo),
        _ => LogAndReturnEmpty("Invalid round for Solo mode")
    };

    private string LogAndReturnEmpty(string message)
    {
        Logger.Critical(message);
        return string.Empty;
    }

    private void CreateTimeTextTag(Kitty kitty, float currentTime)
    {
        var timeText = texttag.Create();
        timeText.SetPosition(kitty.Unit.X, kitty.Unit.Y, -120.0f);
        timeText.SetText($"{Colors.GetStringColorOfPlayer(kitty.Player.Id + 1)}{Utility.ConvertFloatToTime(currentTime, kitty.Player.Id + 1)}", 0.025f);
        timeText.SetVelocity(0, 0.02f);
        timeText.SetVisibility(true);

        Utility.SimpleTimer(3.0f, () => timeText.Dispose());
    }

    public void SetRoundFinishedTime()
    {
        try
        {
            if (RoundTimeSet)
                return;

            GameTimer.FinishedTimes[Globals.ROUND] = (float)Math.Round(GameTimer.RoundTime[Globals.ROUND], 2);
            RoundTimeSet = true;
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TimeSetter.SetRoundFinishedTime: {e.Message}");
            throw;
        }
    }

    public void ResetFinishedTimeCapture() => RoundTimeSet = false;
}
