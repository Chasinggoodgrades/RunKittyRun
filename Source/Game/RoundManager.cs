using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundManager
{
    private static float ROUND_INTERMISSION = 30.0f;
    private static float END_ROUND_DELAY = 3.0f;
    private static timer StartRoundTimer = CreateTimer();
    private static timerdialog RoundTimerDialog = CreateTimerDialog(StartRoundTimer);

    public static void RoundSetup()
    {

        // Setup
        Globals.ROUND += 1;
        Safezone.ResetPlayerSafezones();
        Wolf.SpawnWolves();

        // Timer for round intermission
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, false);
        Console.WriteLine($"Round {Globals.ROUND} will begin in {ROUND_INTERMISSION} seconds");
        TimerDialogSetTitle(RoundTimerDialog, "Starts in:");
        TimerDialogDisplay(RoundTimerDialog, true);

        StartRoundTimer.Start(ROUND_INTERMISSION, false, () => { StartRound(); });
    }

    private static void StartRound()
    {
        Globals.GAME_ACTIVE = true;
        TimerDialogDisplay(RoundTimerDialog, false);
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, true);
        BarrierSetup.DeactivateBarrier();
    }

    public static void RoundEnd()
    {
        Globals.GAME_ACTIVE = false;
        Wolf.RemoveAllWolves();
        BarrierSetup.ActivateBarrier();
        MovedTimedCameraToStart();
        MoveAllPlayersToStart();

        var timer = CreateTimer();
        TimerStart(timer, END_ROUND_DELAY, false, () => 
        { 
            RoundSetup();
            timer.Dispose();
        });
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
}
