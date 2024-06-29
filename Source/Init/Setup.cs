using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

namespace Source.Init
{
    public static class Setup
    {
        private static int i = 0;
        public static void Initialize()
        {
            Console.WriteLine("Setting up the game...");
            FogEnable(false);
            FogMaskEnable(false);
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
            SuspendTimeOfDay(true);
            CustomStatFrame.Init();


            timer t = CreateTimer();
            TimerStart(t, 0.2f, true, () =>
            {
                BeginSpawning(t);
            });
        }

        public static void BeginSpawning(timer t)
        {
            player p = Player(i);
            if (GetPlayerSlotState(p) == playerslotstate.Playing)
            {
                Kitty k = new Kitty(p);
            }
            i += 1;
            if (i == Constants.NUMBER_OF_PLAYERS)
            {
                i = 0;
                t.Dispose();
                Game.RoundStart.RoundActions();
            }
        }

        public static void SetupTimers()
        {
            timerdialog timerdialog = CreateTimerDialog(Globals.GAME_TIMER);
            TimerDialogSetTitle(timerdialog, "Game Time");
            TimerDialogSetTitleColor(timerdialog, 255, 255, 255, 255);
            TimerDialogDisplay(timerdialog, true);
        }

        public static void SetupTeams()
        {

        }
    }
}
