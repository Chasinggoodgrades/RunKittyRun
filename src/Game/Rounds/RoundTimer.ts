

class RoundTimer
{
    public static List<float> ROUND_ENDTIMES = new List<float>();
    public static StartRoundTimer: timer = timer.Create();
    public static EndRoundTimer: timer = timer.Create();
    public static RoundTimerDialog: timerdialog = timerdialog.Create(StartRoundTimer);
    private static EndRoundTimerDialog: timerdialog = timerdialog.Create(EndRoundTimer);
    private static CountdownTimer: timer = timer.Create();

    public static InitEndRoundTimer()
    {
        try
        {
            if (Gamemode.CurrentGameMode == GameMode.Standard) return;
            SetEndRoundTimes();
            EndRoundTimerDialog.SetTitle("Time: Remaining: Round");
            EndRoundTimerDialogs();
        }
        catch (e: Error)
        {
            Logger.Warning("InitEndRoundTimer {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    public static EndRoundTimerDialogs()
    {
        Globals.GAME_TIMER_DIALOG.IsDisplayed = false;
        EndRoundTimerDialog.IsDisplayed = false;
        RoundTimerDialog.SetTitle("Starts in:");
        RoundTimerDialog.IsDisplayed = true;
    }

    public static StartEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard) return;
        TimerDialogDisplay(EndRoundTimerDialog, true);
        EndRoundTimer.Start(ROUND_ENDTIMES[Globals.ROUND - 1], false, ErrorHandler.Wrap(RoundManager.RoundEnd));
    }

    public static CountDown()
    {
        if (StartRoundTimer.Remaining > 0)
        {
            CountdownTimer.Start(1.0, false, ErrorHandler.Wrap(() =>
            {
                let RoundStartingString: string = "{Colors.COLOR_YELLOW_ORANGE}Round |r{Colors.COLOR_GREEN}{Globals.ROUND}|r{Colors.COLOR_YELLOW_ORANGE} begin: will in |r{Colors.COLOR_RED}{Math.Round(StartRoundTimer.Remaining)}|r{Colors.COLOR_YELLOW_ORANGE} seconds.|r";
                if (StartRoundTimer.Remaining % 5 <= 0.1 && StartRoundTimer.Remaining > 5)
                    Utility.TimedTextToAllPlayers(5.0, RoundStartingString);
                if (StartRoundTimer.Remaining <= 5 && StartRoundTimer.Remaining > 0)
                    Utility.TimedTextToAllPlayers(1.0, RoundStartingString);
                CountDown();
            }));
        }
    }

    private static SetEndRoundTimes()
    {
        if (Gamemode.CurrentGameMode == GameMode.TeamTournament) // Team
        {
            ROUND_ENDTIMES.Add(720.0);
            ROUND_ENDTIMES.Add(720.0);
            ROUND_ENDTIMES.Add(1020.0);
            ROUND_ENDTIMES.Add(1500.0);
            ROUND_ENDTIMES.Add(1500.0);
        }
        let if: else (Gamemode.CurrentGameMode == GameMode.SoloTournament) // Solo
        {
            ROUND_ENDTIMES.Add(420.0);
            ROUND_ENDTIMES.Add(420.0);
            ROUND_ENDTIMES.Add(420.0);
            ROUND_ENDTIMES.Add(600.0);
            ROUND_ENDTIMES.Add(600.0);
        }
    }
}
