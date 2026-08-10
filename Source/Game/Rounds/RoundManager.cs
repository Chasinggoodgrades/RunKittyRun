using System;
using WCSharp.Api;

public static class RoundManager
{
    public static float ROUND_INTERMISSION { get; set; } = 30.0f;
    public static float END_ROUND_DELAY { get; set; } = 3.0f;
    public static bool GAME_STARTED { get; private set; } = false;
    private static bool AddedTimeAlready { get; set; } = false;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard) HasDifficultyBeenChosen();
        else RoundSetup();
    }

    public static bool AddMoreRoundTime(float seconds = 20)
    {
        if (AddedTimeAlready) return false;
        var remainingTime = RoundTimer.StartRoundTimer.Remaining;
        if (remainingTime <= 0.0f) return false;
        AddedTimeAlready = true;
        var tempTime = remainingTime + seconds; // 20 seconds
        RoundTimer.StartRoundTimer.Start(tempTime, false, StartRound);
        return true;
    }

    private static void RoundSetup()
    {
        try
        {
            Globals.ROUND += 1;
            GameTimer.RoundTime[DifficultyConfig.GetVirtualRound(Globals.ROUND)] = 0.0f;
            NitroChallenges.SetNitroRoundTimes();
            Safezone.ResetPlayerSafezones();
            Wolf.SpawnWolves();
            Utility.SimpleTimer(1.0f, AffixFactory.DistAffixes);
            AddedTimeAlready = false;
            if (Globals.ROUND > 1) TerrainChanger.SetTerrain();

            RoundTimer.InitEndRoundTimer();
            RoundTimer.StartRoundTimer.Start(ROUND_INTERMISSION, false, StartRound);

            RoundTimer.CountDown();
            TeamDeathless.StartEvent();
            ChainedTogether.StartEvent();
            WolfLaneHider.HideAllLanes();
            WolfLaneHider.LanesHider();
            MultiboardUtil.RefreshMultiboards();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in RoundManager.RoundSetup {e.Message}");
            throw;
        }
    }

    private static void StartRound()
    {
        GAME_STARTED = true;
        Globals.GAME_ACTIVE = true;
        RoundTimer.RoundTimerDialog.IsDisplayed = false;
        RoundTimer.StartEndRoundTimer();

        BarrierSetup.DeactivateBarrier();
        NitroChallenges.StartNitroTimer();
        NitroPacer.StartNitroPacer();
        SoundManager.PlayRoundSound();
        Utility.SimpleTimer(20, () => StatManager.IncrementGame()); // +1 game after 20 seconds to prevent farming games by leaving early.
        if (Globals.ROUND == 1) Utility.SimpleTimer(25.0f, () => SaveManager.SaveAll()); // Save after 25 seconds to ensure the game is saved after the initial rush of the round starting.
        Utility.TimedTextToAllPlayers(2.0f, $"{Colors.COLOR_CYAN}Run Kitty Run!!{Colors.COLOR_RESET}");
    }

    private static void HasDifficultyBeenChosen()
    {
        var Timer = ObjectPool<AchesTimers>.GetEmptyObject();
        Timer.Timer.Start(0.35f, true, () =>
        {
            if (Difficulty.IsDifficultyChosen && Globals.ROUND == 0)
            {
                RoundSetup();
                Timer.Dispose();
            }
        });
    }

    public static void RoundEnd()
    {
        try
        {
            Globals.GAME_ACTIVE = false;
            MultiboardUtil.RefreshMultiboards();
            RoundTimer.EndRoundTimer.Pause();
            NitroChallenges.StopNitroTimer();
            Wolf.RemoveAllWolves();
            BarrierSetup.ActivateBarrier();
            TournamentSaver.Instance.SaveTournamentData();
            ChainedTogether.UnchainAllKitties();

            RoundUtilities.MovedTimedCameraToStart();
            RoundUtilities.RoundResetAll();
            RoundUtilities.MoveAllPlayersToStart();
            TeamsUtil.RoundResetAllTeams();
            NitroPacer.ResetNitroPacer();
            DeathlessChallenges.ResetDeathless();
            WolfLaneHider.ResetLanes();
            TimeSetter.Instance.ResetFinishedTimeCapture();

            SaveManager.SaveAll();
            Resources.BonusResources();

            if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true;
            if (Gameover.GameOver()) return;

            Tips.DisplayTip();
            Utility.SimpleTimer(END_ROUND_DELAY, RoundSetup);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in RoundManager.RoundEnd {e.Message}");
            throw;
        }
    }

    public static bool RoundEndCheck()
    {
        // Always returns for standard mode, and solo progression mode.
        for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++) {
            var kitty = Globals.ALL_KITTIES_LIST[i];
            if (!kitty.Finished) return false;
        }
        RoundEnd();
        return true;
    }
}
