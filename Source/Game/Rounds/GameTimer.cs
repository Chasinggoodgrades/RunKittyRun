using System;
using WCSharp.Api;

public static class GameTimer
{
    private static readonly Action _cachedGameTimer = () => StartGameTimer();
    public static float[] RoundTime { get; set; }
    public static float RoundSpeedIncrement { get; set; } = 0.12f;
    private static framehandle GameTimeBar { get; set; } = framehandle.Get("ResourceBarSupplyText", 0);

    /// <summary>
    /// Sets up the game timer for the game lambdas the next function.
    /// </summary>
    public static void Initialize()
    {
        Globals.GAME_TIMER_DIALOG.SetTitle("Elapsed Game Time");
        RoundTime = new float[Gamemode.NumberOfRounds + 1];
        var t = timer.Create();
        t.Start(RoundSpeedIncrement, true, _cachedGameTimer);
    }

    /// <summary>
    /// Ticks up the game timer every second while the game is active.
    /// </summary>
    private static void StartGameTimer()
    {
        if (!Globals.GAME_ACTIVE) return;

        Globals.GAME_SECONDS += RoundSpeedIncrement;
        Globals.GAME_TIMER.Start(Globals.GAME_SECONDS, false, null);
        Globals.GAME_TIMER.Pause();

        RoundTime[Globals.ROUND] += RoundSpeedIncrement;
        GameTimeBar.Text = $"{Utility.ConvertFloatToTimeInt(Globals.GAME_SECONDS)}";
        UpdatingTimes();
    }

    private static void UpdatingTimes()
    {
        if (Globals.ROUND > Gamemode.NumberOfRounds) return;
        UpdateIndividualTimes();
        UpdateTeamTimes();
    }

    private static void UpdateIndividualTimes()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES_LIST[i];
            if (!kitty.Finished) kitty.TimeProg.IncrementRoundTime(Globals.ROUND);
        }
        //MultiboardUtil.RefreshMultiboards();
    }

    private static void UpdateTeamTimes()
    {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return;
        for (int i = 0; i < Globals.ALL_TEAMS_LIST.Count; i++)
        {
            var team = Globals.ALL_TEAMS_LIST[i];
            if (!team.Finished) team.TeamTimes[Globals.ROUND] += RoundSpeedIncrement;
        }
    }

    /// <summary>
    /// Returns a team's total time in seconds.
    /// </summary>
    /// <param name="team"></param>
    /// <returns></returns>
    public static float TeamTotalTime(Team team)
    {
        var totalTime = 0.0f;
        foreach (var time in team.TeamTimes)
        {
            totalTime += time.Value;
        }
        return totalTime;
    }
}
