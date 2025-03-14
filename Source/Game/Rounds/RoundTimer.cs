using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundTimer
{
    public static List<float> ROUND_ENDTIMES { get; set; } = new List<float>();
    public static timer StartRoundTimer { get; set; } = timer.Create();
    public static timer EndRoundTimer { get; set; } = timer.Create();
    public static timerdialog RoundTimerDialog { get; set; } = timerdialog.Create(StartRoundTimer);
    private static timerdialog EndRoundTimerDialog = timerdialog.Create(EndRoundTimer);

    public static void InitEndRoundTimer()
    {
        try
        {
            if (Gamemode.CurrentGameMode == "Standard") return;
            SetEndRoundTimes();
            EndRoundTimerDialog.SetTitle("Round Time Remaining");
            EndRoundTimerDialogs();
        }
        catch (Exception e)
        {
            Logger.Warning($"InitEndRoundTimer {e.Message}");
            throw;
        }
    }

    public static void EndRoundTimerDialogs()
    {
        Globals.GAME_TIMER_DIALOG.IsDisplayed = false;
        EndRoundTimerDialog.IsDisplayed = false;
        RoundTimerDialog.SetTitle("Starts in:");
        RoundTimerDialog.IsDisplayed = true;
    }

    public static void StartEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode == "Standard") return;
        TimerDialogDisplay(EndRoundTimerDialog, true);
        EndRoundTimer.Start(ROUND_ENDTIMES[Globals.ROUND - 1], false, RoundManager.RoundEnd);
    }

    public static void CountDown()
    {
        if (StartRoundTimer.Remaining > 0)
        {
            var t = timer.Create();
            t.Start(1.0f, false, () =>
            {
                string RoundStartingString = $"{Colors.COLOR_YELLOW_ORANGE}Round |r{Colors.COLOR_GREEN}{Globals.ROUND}|r{Colors.COLOR_YELLOW_ORANGE} will begin in |r{Colors.COLOR_RED}{Math.Round(StartRoundTimer.Remaining)}|r{Colors.COLOR_YELLOW_ORANGE} seconds.|r";
                if (StartRoundTimer.Remaining % 5 <= 0.1 && StartRoundTimer.Remaining > 5)
                    Utility.TimedTextToAllPlayers(5.0f, RoundStartingString);
                if (StartRoundTimer.Remaining <= 5 && StartRoundTimer.Remaining > 0)
                    Utility.TimedTextToAllPlayers(1.0f, RoundStartingString);
                CountDown();
                GC.RemoveTimer(ref t);
            });
        }
    }

    private static void SetEndRoundTimes()
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2]) // Team
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(720.0f);
            ROUND_ENDTIMES.Add(720.0f);
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) // Solo
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(600.0f);
        }
    }
}
