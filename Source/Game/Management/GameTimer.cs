using WCSharp.Api;
public static class GameTimer
{
    public static float[] RoundTime { get; set; }
    /// <summary>
    /// Sets up the game timer for the game lambdas the next function.
    /// </summary>
    public static void Initialize()
    {
        Globals.GAME_TIMER_DIALOG.SetTitle("Elapsed Game Time");
        RoundTime = new float[Gamemode.NumberOfRounds + 1];
        var t = timer.Create();
        t.Start(1.0f, true, () => { StartGameTimer(); });
    }

    /// <summary>
    /// Ticks up the game timer every second while the game is active.
    /// </summary>
    private static void StartGameTimer()
    {
        if (Globals.GAME_ACTIVE)
        {
            Globals.GAME_SECONDS += 1.0f;
            Globals.GAME_TIMER.Start(Globals.GAME_SECONDS, false, null);
            Globals.GAME_TIMER.Pause();
            RoundTime[Globals.ROUND] += 1.0f;
            var resourcebar = framehandle.Get("ResourceBarSupplyText", 0);
            resourcebar.Text = $"{Utility.ConvertFloatToTime(Globals.GAME_SECONDS)}";
            UpdatingTimes();
        }
    }

    private static void UpdatingTimes()
    {
        if(Globals.ROUND > Gamemode.NumberOfRounds) return;
        UpdateIndividualTimes();
        UpdateTeamTimes();
    }

    private static void UpdateIndividualTimes()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            if (!kitty.Finished) kitty.Time[Globals.ROUND] += 1.0f;
        }
    }

    private static void UpdateTeamTimes()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        foreach (var team in Globals.ALL_TEAMS.Values)
        {
            if (!team.Finished) team.TeamTimes[Globals.ROUND] += 1.0f;
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
        foreach(var time in team.TeamTimes.Values)
        {
            totalTime += time;
        }
        return totalTime;
    }
}