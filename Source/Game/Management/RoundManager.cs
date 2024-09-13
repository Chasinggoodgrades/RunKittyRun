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

    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode == "Standard") HasDifficultyBeenChosen();
        else RoundSetup();
    }
    private static void RoundSetup()
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
        StartEndRoundTimer();

        BarrierSetup.DeactivateBarrier();
        SoundManager.PlayRoundSound();
        Nitros.StartNitroTimer();
        Utility.TimedTextToAllPlayers(2.0f, $"{Colors.COLOR_CYAN}Run Kitty Run!!|r");
    }

    private static void InitEndRoundTimer()
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[0]) return;

        TimerDialogSetTitle(EndRoundTimerDialog, "Round Time Remaining");
        SetEndRoundTimes();
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
                RoundStartingString = $"{Colors.COLOR_YELLOW_ORANGE}Round |r{Colors.COLOR_GREEN}{Globals.ROUND}|r{Colors.COLOR_YELLOW_ORANGE} will begin in |r{Colors.COLOR_RED}{Math.Round(StartRoundTimer.Remaining)}|r{Colors.COLOR_YELLOW_ORANGE} seconds.|r";
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
        Nitros.StopNitroTimer();
        Wolf.RemoveAllWolves();
        BarrierSetup.ActivateBarrier();
        Resources.BonusResources();
        MovedTimedCameraToStart();
        MoveAllPlayersToStart();
        RoundResetAll();
        Team.RoundResetAllTeams();
        SaveManager.SaveAll();
        if (Gameover.GameOver()) return;

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

    private static void RoundResetAll()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            kitty.Unit.Revive(RegionList.SpawnRegions[kitty.Player.Id].Center.X, RegionList.SpawnRegions[kitty.Player.Id].Center.Y, false);
            Globals.ALL_CIRCLES[kitty.Player].HideCircle();
            kitty.Alive = true;
            kitty.ProgressZone = 0;
            kitty.Progress = 0.0f;
            kitty.Finished = false;
            kitty.Unit.Mana = kitty.Unit.MaxMana;
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
