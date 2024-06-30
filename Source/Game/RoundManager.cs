using System;
using System.Collections.Generic;
using System.Drawing;
using System.Threading;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;



public static class RoundManager
{
    private static float ROUND_INTERMISSION = 30.0f;
    private static timer StartRoundTimer = CreateTimer();
    private static timerdialog RoundTimerDialog = CreateTimerDialog(StartRoundTimer);

    public static void RoundSetup()
    {


        Globals.ROUND += 1;
        Safezone.ResetPlayerSafezones();
        Wolf.SpawnWolves();
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, false);
        Console.WriteLine($"Round {Globals.ROUND} will begin in {ROUND_INTERMISSION} seconds");
        TimerDialogSetTitle(RoundTimerDialog, "Starts in:");
        TimerDialogDisplay(RoundTimerDialog, true);
        StartRoundTimer.Start(ROUND_INTERMISSION, false, () =>
        {
            StartRound();
        });
    }

    private static void StartRound()
    {
        TimerDialogDisplay(RoundTimerDialog, false);
        TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, true);
        BarrierSetup.DeactivateBarrier();
        Globals.GAME_ACTIVE = true;
            
    }





}
