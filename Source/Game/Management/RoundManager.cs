using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundManager
{
    public static float ROUND_INTERMISSION = 30.0f;
    private static float END_ROUND_DELAY = 3.0f;
    public static bool GAME_STARTED = false;
    private static timer StartRoundTimer = CreateTimer();
    private static timerdialog RoundTimerDialog = CreateTimerDialog(StartRoundTimer);
    private static timer EndRoundTimer { get; set; } = CreateTimer();
    private static timerdialog EndRoundTimerDialog = CreateTimerDialog(EndRoundTimer);

    private static List<float> ROUND_ENDTIMES = ROUND_ENDTIMES = new List<float>();
    private static string RoundStartingString;

    public static void RoundSetup()
    {

        // Setup
        Globals.ROUND += 1;
        Safezone.ResetPlayerSafezones();
        Wolf.SpawnWolves();

        InitEndRoundTimer();
        // Timer for round intermission
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, false);
        TimerDialogDisplay(EndRoundTimerDialog, false);
        TimerDialogSetTitle(RoundTimerDialog, "Starts in:");
        TimerDialogDisplay(RoundTimerDialog, true);

        StartRoundTimer.Start(ROUND_INTERMISSION, false, () => { StartRound(); });
        CountDown();
    }

    private static void StartRound()
    {
        GAME_STARTED = true;
        Globals.GAME_ACTIVE = true;
        TimerDialogDisplay(RoundTimerDialog, false);
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, true);
        StartEndRoundTimer();

        BarrierSetup.DeactivateBarrier();
        SoundManager.PlayRoundSound();
        Utility.TimedTextToAllPlayers(2.0f, $"{Color.COLOR_CYAN}Run Kitty Run!!|r");
    }

    private static void InitEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[0]) return;

        TimerDialogSetTitle(EndRoundTimerDialog, "Round Time Remaining");
        SetEndRoundTimes();
    }

    private static void StartEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[0])
        {
            TimerDialogDisplay(EndRoundTimerDialog, true);
            EndRoundTimer.Start(ROUND_ENDTIMES[Globals.ROUND - 1], false, () => { RoundEnd(); });
        }
    }

    private static void CountDown()
    {

        if (StartRoundTimer.Remaining > 0)
        {
            var t = CreateTimer();
            t.Start(1.0f, false, () =>
            {
                RoundStartingString = $"{Color.COLOR_YELLOW_ORANGE}Round |r{Color.COLOR_GREEN}{Globals.ROUND}|r{Color.COLOR_YELLOW_ORANGE} will begin in |r{Color.COLOR_RED}{(int)StartRoundTimer.Remaining}|r{Color.COLOR_YELLOW_ORANGE} seconds.|r";
                if (StartRoundTimer.Remaining % 5 <= 0.1 && StartRoundTimer.Remaining > 5) Utility.TimedTextToAllPlayers(5.0f, RoundStartingString);
                if (StartRoundTimer.Remaining <= 5 && StartRoundTimer.Remaining > 0) Utility.TimedTextToAllPlayers(1.0f, RoundStartingString);
                CountDown();
                t.Dispose();
            });
        }
    }

    public static void RoundEnd()
    {
        Globals.GAME_ACTIVE = false;
        EndRoundTimer.Pause();
        Wolf.RemoveAllWolves();
        BarrierSetup.ActivateBarrier();
        Resources.BonusResources();
        MovedTimedCameraToStart();
        MoveAllPlayersToStart();
        Kitty.RoundResetAll();
        Team.RoundResetAllTeams();


        var timer = CreateTimer();
        TimerStart(timer, END_ROUND_DELAY, false, () => 
        { 
            RoundSetup();
            timer.Dispose();
        });
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
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1])
        {
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(420.0f);
            ROUND_ENDTIMES.Add(600.0f);
            ROUND_ENDTIMES.Add(600.0f);
        }
    }

    public static void MovePlayerToStart(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        var x = RegionList.SpawnRegions[Player.Id].Center.X;
        var y = RegionList.SpawnRegions[Player.Id].Center.Y;
        kitty.Unit.SetPosition(x, y);
        kitty.Unit.Facing = 360.0f;
    }
    public static void MoveTeamToStart(Team team)
    {
        foreach (var player in team.Teammembers)
        {
            MovePlayerToStart(player);
        }
    }
    private static void MoveAllPlayersToStart()
    {
        foreach(var kitty in Globals.ALL_KITTIES.Values)
        {
            MovePlayerToStart(kitty.Player);
        }
    }

    private static void MovedTimedCameraToStart()
    {
        var x = RegionList.SpawnRegions[0].Center.X;
        var y = RegionList.SpawnRegions[0].Center.Y;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if(player == GetLocalPlayer()) PanCameraToTimed(x, y, END_ROUND_DELAY);
        }
    }

    public static void RoundEndCheck()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (!kitty.Finished) return;
        RoundEnd();
    }


}
