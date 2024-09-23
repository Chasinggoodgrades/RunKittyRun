using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundManager
{
    public static float ROUND_INTERMISSION = 30.0f;
    public static float END_ROUND_DELAY = 3.0f;
    public static bool GAME_STARTED = false;
    private static List<float> ROUND_ENDTIMES = new List<float>();
    private static string RoundStartingString;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode == "Standard") HasDifficultyBeenChosen();
        else RoundSetup();
    }

    private static void RoundSetup()
    {
        Globals.ROUND += 1;
        Safezone.ResetPlayerSafezones();
        Wolf.SpawnWolves();
        AffixFactory.DistributeAffixes();

        RoundTimer.InitEndRoundTimer();

        RoundTimer.StartRoundTimer.Start(ROUND_INTERMISSION, false, () => { StartRound(); });
        RoundTimer.CountDown();
    }

    private static void StartRound()
    {
        GAME_STARTED = true;
        Globals.GAME_ACTIVE = true;
        RoundTimer.RoundTimerDialog.IsDisplayed = false;
        RoundTimer.StartEndRoundTimer();

        BarrierSetup.DeactivateBarrier();
        NitroPacer.StartNitroPacer();
        SoundManager.PlayRoundSound();
        Nitros.StartNitroTimer();
        Utility.TimedTextToAllPlayers(2.0f, $"{Colors.COLOR_CYAN}Run Kitty Run!!|r");
    }

    private static void HasDifficultyBeenChosen()
    {
        var timer = CreateTimer();
        TimerStart(timer, 0.35f, true, () =>
        {
            if (Difficulty.IsDifficultyChosen)
            {
                RoundSetup();
                timer.Dispose();
            }
        });
    }

    public static void RoundEnd()
    {
        Globals.GAME_ACTIVE = false;
        RoundTimer.EndRoundTimer.Pause();
        Nitros.StopNitroTimer();
        Wolf.RemoveAllWolves();
        BarrierSetup.ActivateBarrier();
        Resources.BonusResources();
        RoundUtilities.MovedTimedCameraToStart();
        RoundUtilities.MoveAllPlayersToStart();
        RoundUtilities.RoundResetAll();
        Team.RoundResetAllTeams();
        NitroPacer.ResetNitroPacer();
        Deathless.ResetDeathless();
        SaveManager.SaveAll();
        if (Gameover.GameOver()) return;

        Utility.SimpleTimer(END_ROUND_DELAY, () => RoundSetup());
    }

    public static void RoundEndCheck()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (!kitty.Finished) return;
        RoundEnd();
    }
}
