using System;
using WCSharp.Api;

public static class RoundManager
{
    public static float ROUND_INTERMISSION { get; set; } = 30.0f;
    public static float END_ROUND_DELAY { get; set; } = 3.0f;
    public static bool GAME_STARTED { get; private set; } = false;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode == "Standard") HasDifficultyBeenChosen();
        else RoundSetup();
    }

    private static void RoundSetup()
    {
        try
        {
            Globals.ROUND += 1;
            GameTimer.RoundTime[Globals.ROUND] = 0.0f;
            NitroChallenges.SetNitroRoundTimes();
            Safezone.ResetPlayerSafezones();
            Wolf.SpawnWolves();
            Utility.SimpleTimer(1.0f, AffixFactory.DistributeAffixes);
            if(Globals.ROUND > 1) TerrainChanger.SetTerrain();

            RoundTimer.InitEndRoundTimer();

            RoundTimer.StartRoundTimer.Start(ROUND_INTERMISSION, false, () => { StartRound(); });
            RoundTimer.CountDown();
            WolfLaneHider.HideAllLanes();
            WolfLaneHider.LanesHider();
        }
        catch (Exception e)
        {
            if(Source.Program.Debug) Console.WriteLine(e.Message);
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
        Utility.TimedTextToAllPlayers(2.0f, $"{Colors.COLOR_CYAN}Run Kitty Run!!|r");
    }

    private static void HasDifficultyBeenChosen()
    {
        var Timer = timer.Create();
        Timer.Start(0.35f, true, () =>
        {
            if (Difficulty.IsDifficultyChosen && Globals.ROUND == 0)
            {
                RoundSetup();
                GC.RemoveTimer(ref Timer);
            }
        });
    }

    public static void RoundEnd()
    {
        try
        {
            MultiboardUtil.RefreshMultiboards();
            Globals.GAME_ACTIVE = false;
            RoundTimer.EndRoundTimer.Pause();
            NitroChallenges.StopNitroTimer();
            Wolf.RemoveAllWolves();
            BarrierSetup.ActivateBarrier();
            Resources.BonusResources();
            RoundUtilities.MovedTimedCameraToStart();
            RoundUtilities.RoundResetAll();
            RoundUtilities.MoveAllPlayersToStart();
            TeamsUtil.RoundResetAllTeams();
            NitroPacer.ResetNitroPacer();
            DeathlessChallenges.ResetDeathless();
            SaveManager.SaveAll();
            if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true;
            if (Gameover.GameOver()) return;
            Tips.DisplayTip();
            Utility.SimpleTimer(END_ROUND_DELAY, () => RoundSetup());
        }
        catch (Exception e)
        {
            if (Source.Program.Debug) Console.WriteLine(e.Message);
            throw;
        }
    }

    public static void RoundEndCheck()
    {
        // Always returns for standard mode, and solo progression mode.
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (!kitty.Finished) return;
        RoundEnd();
    }
}
