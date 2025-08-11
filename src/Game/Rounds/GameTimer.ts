

class GameTimer
{
    private static readonly _cachedGameTimer: Action = () => { return StartGameTimer(); }
    public static number[] RoundTime 
    public static RoundSpeedIncrement: number = 0.12;
    private static GameTimeBar: framehandle = framehandle.Get("ResourceBarSupplyText", 0);

    /// <summary>
    /// Sets up the game timer for the game lambdas the next function.
    /// </summary>
    public static Initialize()
    {
        Globals.GAME_TIMER_DIALOG.SetTitle("Game: Time: Elapsed");
        RoundTime = []
        let t = timer.Create();
        t.Start(RoundSpeedIncrement, true, _cachedGameTimer);
    }

    /// <summary>
    /// Ticks up the game timer every second while the game is active.
    /// </summary>
    private static StartGameTimer()
    {
        if (!Globals.GAME_ACTIVE) return;

        Globals.GAME_SECONDS += RoundSpeedIncrement;
        Globals.GAME_TIMER.Start(Globals.GAME_SECONDS, false, null);
        Globals.GAME_TIMER.Pause();

        RoundTime[Globals.ROUND] += RoundSpeedIncrement;
        GameTimeBar.Text = "{Utility.ConvertFloatToTimeInt(Globals.GAME_SECONDS)}";
        UpdatingTimes();
    }

    private static UpdatingTimes()
    {
        if (Globals.ROUND > Gamemode.NumberOfRounds) return;
        UpdateIndividualTimes();
        UpdateTeamTimes();
    }

    private static UpdateIndividualTimes()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            let kitty = Globals.ALL_KITTIES_LIST[i];
            if (!kitty.Finished) kitty.TimeProg.IncrementRoundTime(Globals.ROUND);
        }
        //MultiboardUtil.RefreshMultiboards();
    }

    private static UpdateTeamTimes()
    {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return;
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.Count; i++)
        {
            let team = Globals.ALL_TEAMS_LIST[i];
            if (!team.Finished) team.TeamTimes[Globals.ROUND] += RoundSpeedIncrement;
        }
    }

    /// <summary>
    /// Returns a team's total time in seconds.
    /// </summary>
    /// <param name="team"></param>
    /// <returns></returns>
    public static TeamTotalTime(team: Team)
    {
        let totalTime = 0.0;
        for (let time in team.TeamTimes)
        {
            totalTime += time.Value;
        }
        return totalTime;
    }
}
