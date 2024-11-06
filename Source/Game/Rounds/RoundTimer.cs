using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundTimer
{
    public static timer StartRoundTimer = CreateTimer();
    public static timer EndRoundTimer = CreateTimer();
    public static timerdialog RoundTimerDialog = CreateTimerDialog(StartRoundTimer);
    private static timerdialog EndRoundTimerDialog = CreateTimerDialog(EndRoundTimer);
    private static List<float> ROUND_ENDTIMES = new List<float>();

    public static void InitEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode == "Standard") return;

        TimerDialogSetTitle(EndRoundTimerDialog, "Round Time Remaining");
        SetEndRoundTimes();
        EndRoundTimerDialogs();
    }

    public static void EndRoundTimerDialogs()
    {
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, false);
        TimerDialogDisplay(EndRoundTimerDialog, false);
        TimerDialogSetTitle(RoundTimerDialog, "Starts in:");
        TimerDialogDisplay(RoundTimerDialog, true);
    }

    public static void StartEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode != "Standard")
        {
            TimerDialogDisplay(EndRoundTimerDialog, true);
            EndRoundTimer.Start(ROUND_ENDTIMES[Globals.ROUND - 1], false, () => { RoundManager.RoundEnd(); });
        }
    }

    public static void CountDown()
    {
        if (StartRoundTimer.Remaining > 0)
        {
            var t = CreateTimer();
            t.Start(1.0f, false, () =>
            {
                string RoundStartingString = $"{Colors.COLOR_YELLOW_ORANGE}Round |r{Colors.COLOR_GREEN}{Globals.ROUND}|r{Colors.COLOR_YELLOW_ORANGE} will begin in |r{Colors.COLOR_RED}{Math.Round(StartRoundTimer.Remaining)}|r{Colors.COLOR_YELLOW_ORANGE} seconds.|r";
                if (StartRoundTimer.Remaining % 5 <= 0.1 && StartRoundTimer.Remaining > 5)
                    Utility.TimedTextToAllPlayers(5.0f, RoundStartingString);
                if (StartRoundTimer.Remaining <= 5 && StartRoundTimer.Remaining > 0)
                    Utility.TimedTextToAllPlayers(1.0f, RoundStartingString);
                CountDown();
                t.Dispose();
            });
        }
    }

    private static void SetEndRoundTimes()
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(720.0f);
            ROUND_ENDTIMES.Add(720.0f);
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1])
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(600.0f);
        }
    }
}
