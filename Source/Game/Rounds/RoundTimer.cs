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
    private static timer CountdownTimer { get; set; } = timer.Create();

    public static void InitEndRoundTimer()
    {
        try
        {
            if (Gamemode.CurrentGameMode == GameMode.Standard) return;
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
        if (Gamemode.CurrentGameMode == GameMode.Standard) return;
        TimerDialogDisplay(EndRoundTimerDialog, true);
        EndRoundTimer.Start(ROUND_ENDTIMES[Globals.ROUND - 1], false, ErrorHandler.Wrap(RoundManager.RoundEnd));
    }

    public static void CountDown()
    {
        if (StartRoundTimer.Remaining > 0)
        {
            CountdownTimer.Start(1.0f, false, ErrorHandler.Wrap(() =>
            {
                string RoundStartingString = $"{Colors.COLOR_YELLOW_ORANGE}Round |r{Colors.COLOR_GREEN}{Globals.ROUND}|r{Colors.COLOR_YELLOW_ORANGE} will begin in |r{Colors.COLOR_RED}{Math.Round(StartRoundTimer.Remaining)}|r{Colors.COLOR_YELLOW_ORANGE} seconds.|r";
                if (StartRoundTimer.Remaining % 5 <= 0.1 && StartRoundTimer.Remaining > 5)
                    Utility.TimedTextToAllPlayers(5.0f, RoundStartingString);
                if (StartRoundTimer.Remaining <= 5 && StartRoundTimer.Remaining > 0)
                    Utility.TimedTextToAllPlayers(1.0f, RoundStartingString);
                CountDown();
            }));
        }
    }

    private static void SetEndRoundTimes()
    {
        if (Gamemode.CurrentGameMode == GameMode.TeamTournament) // Team
        {
            ROUND_ENDTIMES.Add(720.0f);
            ROUND_ENDTIMES.Add(720.0f);
            ROUND_ENDTIMES.Add(1020.0f);
            ROUND_ENDTIMES.Add(1500.0f);
            ROUND_ENDTIMES.Add(1500.0f);
        }
        else if (Gamemode.CurrentGameMode == GameMode.SoloTournament) // Solo
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(600.0f);
        }
    }
}
