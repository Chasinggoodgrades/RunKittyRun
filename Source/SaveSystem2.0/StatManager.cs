/// <summary>
/// Central hub for all stat increments in the game.
/// Every write to GameStatsData and LeagueSeasonData goes through here.
/// League writes are gated on LeagueManager.IsSeasonActive.
/// </summary>
public static class StatManager
{
    private static bool GameIncremented = false;
    // -------------------------------------------------------------------------
    // Saves
    // -------------------------------------------------------------------------

    public static void IncrementSave(Kitty savior)
    {
        var stats = savior.SaveData.GameStats;
        stats.Saves += 1;
        stats.SaveStreak += 1;

        if (stats.SaveStreak > stats.HighestSaveStreak)
            stats.HighestSaveStreak = stats.SaveStreak;

        if (!LeagueManager.Instance.IsSeasonActive) return;
        var league = savior.SaveData.LeagueSeasonData.Stats;
        league.Saves += 1;
        league.SaveStreak += 1;

        if (league.SaveStreak > league.HighestSaveStreak)
            league.HighestSaveStreak = league.SaveStreak;
    }

    public static void ResetSaveStreak(Kitty kitty)
    {
        kitty.SaveData.GameStats.SaveStreak = 0;

        if (!LeagueManager.Instance.IsSeasonActive) return;
        kitty.SaveData.LeagueSeasonData.Stats.SaveStreak = 0;
    }

    // -------------------------------------------------------------------------
    // Deaths
    // -------------------------------------------------------------------------

    public static void IncrementDeath(Kitty kitty)
    {
        kitty.SaveData.GameStats.Deaths += 1;

        if (!LeagueManager.Instance.IsSeasonActive) return;
        kitty.SaveData.LeagueSeasonData.Stats.Deaths += 1;
    }

    // -------------------------------------------------------------------------
    // Nitros
    // -------------------------------------------------------------------------

    public static void IncrementNitro(Kitty kitty)
    {
        kitty.CurrentStats.NitroCount += 1; // in-game specific stat.
        kitty.SaveData.GameStats.NitrosObtained += 1;

        if (!LeagueManager.Instance.IsSeasonActive) return;
        kitty.SaveData.LeagueSeasonData.Stats.NitrosObtained += 1;
    }

    public static void IncrementDeathless(Kitty kitty)
    {
        kitty.SaveData.GameStats.DeathlessObtained += 1;
        if (!LeagueManager.Instance.IsSeasonActive) return;
        kitty.SaveData.LeagueSeasonData.Stats.DeathlessObtained += 1;
    }

    // -------------------------------------------------------------------------
    // Kibble
    // -------------------------------------------------------------------------
    public static void IncrementKibble(Kitty kitty)
    {
        kitty.CurrentStats.CollectedKibble += 1;

        if (!LeagueManager.Instance.IsSeasonActive) return;
        kitty.SaveData.LeagueSeasonData.Currency.Kibble.Collected += 1;
    }

    /// <summary>
    /// Increments the number of jackpots collected by the kitty.
    /// </summary>
    /// <param name="kitty"></param>
    /// <param name="super"></param>
    public static void IncrementSuperJackpot(Kitty kitty, bool super = false)
    {
        kitty.CurrentStats.CollectedJackpots += 1;
        if (super) kitty.CurrentStats.CollectedSuperJackpots += 1;

        if (!LeagueManager.Instance.IsSeasonActive) return;

        kitty.SaveData.LeagueSeasonData.Currency.Kibble.Jackpots += 1;
        if (super) kitty.SaveData.LeagueSeasonData.Currency.Kibble.SuperJackpots += 1;
    }


    // -------------------------------------------------------------------------
    // Wins / Losses / Games Played
    // -------------------------------------------------------------------------

    private static void IncrementGame(Kitty kitty, DifficultyLevel difficulty)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (GameIncremented) return;

        var stats = kitty.SaveData.GameStats;
        IncrementGameOnStats(stats, difficulty);
        stats.TotalGames = stats.NormalGames + stats.HardGames + stats.ImpossibleGames + stats.NightmareGames + stats.ProgressiveGames; // instead of incrementing by 1 since... this is new a stat. 

        if (!LeagueManager.Instance.IsSeasonActive) return;
        var league = kitty.SaveData.LeagueSeasonData.Stats;
        IncrementGameOnStats(league, difficulty);
        league.TotalGames = league.NormalGames + league.HardGames + league.ImpossibleGames + league.NightmareGames + league.ProgressiveGames;
    }

    /// <summary>
    /// This method increments the game count for all kitties in the game.
    /// Cannot be called more than once per game session.
    /// </summary>
    public static void IncrementGame()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (GameIncremented) return;

        var difficulty = (DifficultyLevel)Difficulty.DifficultyValue;
        for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            IncrementGame(Globals.ALL_KITTIES_LIST[i], difficulty);
        }
        GameIncremented = true;
    }

    public static void IncrementWin(Kitty kitty, DifficultyLevel difficulty)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;

        var stats = kitty.SaveData.GameStats;
        IncrementWinOnStats(stats, difficulty);

        if (!LeagueManager.Instance.IsSeasonActive) return;
        IncrementWinOnStats(kitty.SaveData.LeagueSeasonData.Stats, difficulty);
    }

    public static void IncrementWinStreak(Kitty kitty, bool win)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;

        UpdateWinStreak(kitty.SaveData.GameStats, win);

        if (!LeagueManager.Instance.IsSeasonActive) return;
        UpdateWinStreak(kitty.SaveData.LeagueSeasonData.Stats, win);
    }

    // -------------------------------------------------------------------------
    // Lifetime Best Game Times
    // -------------------------------------------------------------------------

    /// <summary>
    /// Updates the lifetime best game time for the given difficulty if the current game time beats it.
    /// Replaces the five individual SetXGameStats methods in GameoverUtil.
    /// </summary>
    public static void UpdateLifetimeBestGameTime(Kitty kitty, DifficultyLevel difficulty, float gameTime, string teamMembers)
    {
        if (gameTime <= 0) return;
        var times = kitty.SaveData.BestGameTimes;
        var date = DateTimeManager.DateTime.ToString();

        switch (difficulty)
        {
            case DifficultyLevel.Normal:
                TrySetBestGameTime(times.NormalGameTime.Time, gameTime, t => { times.NormalGameTime.Time = t; times.NormalGameTime.Date = date; times.NormalGameTime.TeamMembers = teamMembers; });
                break;
            case DifficultyLevel.Hard:
                TrySetBestGameTime(times.HardGameTime.Time, gameTime, t => { times.HardGameTime.Time = t; times.HardGameTime.Date = date; times.HardGameTime.TeamMembers = teamMembers; });
                break;
            case DifficultyLevel.Impossible:
                TrySetBestGameTime(times.ImpossibleGameTime.Time, gameTime, t => { times.ImpossibleGameTime.Time = t; times.ImpossibleGameTime.Date = date; times.ImpossibleGameTime.TeamMembers = teamMembers; });
                break;
            case DifficultyLevel.Nightmare:
                TrySetBestGameTime(times.NightmareGameTime.Time, gameTime, t => { times.NightmareGameTime.Time = t; times.NightmareGameTime.Date = date; times.NightmareGameTime.TeamMembers = teamMembers; });
                break;
            case DifficultyLevel.Progressive:
                TrySetBestGameTime(times.ProgressiveGameTime.Time, gameTime, t => { times.ProgressiveGameTime.Time = t; times.ProgressiveGameTime.Date = date; times.ProgressiveGameTime.TeamMembers = teamMembers; });
                break;
        }
    }

    /// <summary>
    /// Updates the per-round times on the lifetime best game record for the given difficulty.
    /// Only writes if this game's total time is also the best game overall (matching GameoverUtil behaviour).
    /// Fixes the bug in SetBestGameRoundTimes where the early-return always checked NormalGameTime.
    /// </summary>
    public static void UpdateLifetimeBestRoundTimes(Kitty kitty, DifficultyLevel difficulty, float gameTime)
    {
        if (gameTime <= 0) return;
        var times = kitty.SaveData.BestGameTimes;

        object bestGameTimeData = difficulty switch
        {
            DifficultyLevel.Normal      => times.NormalGameTime,
            DifficultyLevel.Hard        => times.HardGameTime,
            DifficultyLevel.Impossible  => times.ImpossibleGameTime,
            DifficultyLevel.Nightmare   => times.NightmareGameTime,
            DifficultyLevel.Progressive => times.ProgressiveGameTime,
            _ => null
        };

        if (bestGameTimeData == null) return;

        // Early return uses the correct difficulty's stored time, not always Normal
        var storedTime = (float)bestGameTimeData.GetType().GetProperty("Time").GetValue(bestGameTimeData);
        if (gameTime > storedTime && storedTime != 0) return;

        for (int round = 1; round <= Gamemode.NumberOfRounds; round++)
        {
            string propertyName = round switch
            {
                1 => "RoundOneTime",
                2 => "RoundTwoTime",
                3 => "RoundThreeTime",
                4 => "RoundFourTime",
                5 => "RoundFiveTime",
                _ => null
            };

            if (propertyName == null) continue;

            var prop = bestGameTimeData.GetType().GetProperty(propertyName);
            prop?.SetValue(bestGameTimeData, GameTimer.FinishedTimes[round]);
        }
    }

    // -------------------------------------------------------------------------
    // Best Times (League)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Called at game end with the current game's total time.
    /// Only updates the league season best if this game's time beats the stored season best.
    /// Does NOT copy from lifetime BestGameTimes — season times start fresh.
    /// </summary>
    public static void UpdateLeagueBestGameTime(Kitty kitty, DifficultyLevel difficulty, float gameTime, string teamMembers)
    {
        if (!LeagueManager.Instance.IsSeasonActive) return;
        if (gameTime <= 0) return;

        var dst = kitty.SaveData.LeagueSeasonData.GameTimes;
        var date = DateTimeManager.DateTime.ToString();

        switch (difficulty)
        {
            case DifficultyLevel.Normal:
                if (gameTime < dst.NormalGameTime.Time || dst.NormalGameTime.Time == 0)
                { dst.NormalGameTime.Time = gameTime; dst.NormalGameTime.Date = date; dst.NormalGameTime.TeamMembers = teamMembers; }
                break;
            case DifficultyLevel.Hard:
                if (gameTime < dst.HardGameTime.Time || dst.HardGameTime.Time == 0)
                { dst.HardGameTime.Time = gameTime; dst.HardGameTime.Date = date; dst.HardGameTime.TeamMembers = teamMembers; }
                break;
            case DifficultyLevel.Impossible:
                if (gameTime < dst.ImpossibleGameTime.Time || dst.ImpossibleGameTime.Time == 0)
                { dst.ImpossibleGameTime.Time = gameTime; dst.ImpossibleGameTime.Date = date; dst.ImpossibleGameTime.TeamMembers = teamMembers; }
                break;
            case DifficultyLevel.Nightmare:
                if (gameTime < dst.NightmareGameTime.Time || dst.NightmareGameTime.Time == 0)
                { dst.NightmareGameTime.Time = gameTime; dst.NightmareGameTime.Date = date; dst.NightmareGameTime.TeamMembers = teamMembers; }
                break;
            case DifficultyLevel.Progressive:
                if (gameTime < dst.ProgressiveGameTime.Time || dst.ProgressiveGameTime.Time == 0)
                { dst.ProgressiveGameTime.Time = gameTime; dst.ProgressiveGameTime.Date = date; dst.ProgressiveGameTime.TeamMembers = teamMembers; }
                break;
        }
    }

    /// <summary>
    /// Updates the per-round times on the league season best game record for the given difficulty.
    /// Only writes if this game's total time is also the season best.
    /// </summary>
    public static void UpdateLeagueBestRoundTimes(Kitty kitty, DifficultyLevel difficulty, float gameTime)
    {
        if (!LeagueManager.Instance.IsSeasonActive) return;
        if (gameTime <= 0) return;

        var dst = kitty.SaveData.LeagueSeasonData.GameTimes;

        object bestGameTimeData = difficulty switch
        {
            DifficultyLevel.Normal      => dst.NormalGameTime,
            DifficultyLevel.Hard        => dst.HardGameTime,
            DifficultyLevel.Impossible  => dst.ImpossibleGameTime,
            DifficultyLevel.Nightmare   => dst.NightmareGameTime,
            DifficultyLevel.Progressive => dst.ProgressiveGameTime,
            _ => null
        };

        if (bestGameTimeData == null) return;

        var storedTime = (float)bestGameTimeData.GetType().GetProperty("Time").GetValue(bestGameTimeData);
        if (gameTime > storedTime && storedTime != 0) return;

        for (int round = 1; round <= Gamemode.NumberOfRounds; round++)
        {
            string propertyName = round switch
            {
                1 => "RoundOneTime",
                2 => "RoundTwoTime",
                3 => "RoundThreeTime",
                4 => "RoundFourTime",
                5 => "RoundFiveTime",
                _ => null
            };

            if (propertyName == null) continue;

            var prop = bestGameTimeData.GetType().GetProperty(propertyName);
            prop?.SetValue(bestGameTimeData, GameTimer.FinishedTimes[round]);
        }
    }

    /// <summary>
    /// Called after TimeSetter updates an individual round time.
    /// Only updates the league season best if this round's time beats the stored season best.
    /// Does NOT copy from lifetime RoundTimesData — season times start fresh.
    /// </summary>
    public static void UpdateLeagueBestRoundTime(Kitty kitty, string roundEnum, float time)
    {
        if (!LeagueManager.Instance.IsSeasonActive) return;
        if (time <= 0) return;

        var dst = kitty.SaveData.LeagueSeasonData.RoundTimes;
        var prop = dst.GetType().GetProperty(roundEnum);
        if (prop == null) return;

        var current = (float)prop.GetValue(dst);
        if (time < current || current == 0)
            prop.SetValue(dst, time);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static void IncrementGameOnStats(GameStatsData stats, DifficultyLevel difficulty)
    {
        switch (difficulty)
        {
            case DifficultyLevel.Normal:      stats.NormalGames      += 1; break;
            case DifficultyLevel.Hard:        stats.HardGames        += 1; break;
            case DifficultyLevel.Impossible:  stats.ImpossibleGames  += 1; break;
            case DifficultyLevel.Nightmare:   stats.NightmareGames   += 1; break;
            case DifficultyLevel.Progressive: stats.ProgressiveGames += 1; break;
        }
    }

    private static void IncrementWinOnStats(GameStatsData stats, DifficultyLevel difficulty)
    {
        switch (difficulty)
        {
            case DifficultyLevel.Normal:      stats.NormalWins      += 1; break;
            case DifficultyLevel.Hard:        stats.HardWins        += 1; break;
            case DifficultyLevel.Impossible:  stats.ImpossibleWins  += 1; break;
            case DifficultyLevel.Nightmare:   stats.NightmareWins   += 1; break;
            case DifficultyLevel.Progressive: stats.ProgressiveWins += 1; break;
        }
    }

    private static void UpdateWinStreak(GameStatsData stats, bool win)
    {
        if (win)
        {
            stats.WinStreak += 1;
            if (stats.WinStreak > stats.HighestWinStreak)
                stats.HighestWinStreak = stats.WinStreak;
        }
        else stats.WinStreak = 0;
    }

    private static void TrySetBestGameTime(float stored, float incoming, System.Action<float> setter)
    {
        if (incoming < stored || stored == 0)
            setter(incoming);
    }

    private static void TrySyncGameTime(float src, float dst, System.Action<float> setter)
    {
        if (src > 0 && (src < dst || dst == 0))
            setter(src);
    }
}
