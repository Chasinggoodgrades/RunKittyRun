using Source.Game;
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
                SetupTimers();
                Game.RoundStart.RoundActions();
            }
        }

        public static void SetupTimers()
        {
            TimerDialogSetTitle(Globals.GAME_TIMER_DIALOG, "Elapsed Game Time");
            TimerDialogDisplay(Globals.GAME_TIMER_DIALOG, true);
            timer t = CreateTimer();
            TimerStart(t, 1.0f, true, () =>
            {
                GameTimer();
            });
        }

        private static void GameTimer()
        {
            if (Globals.GAME_ACTIVE)
            {
                Globals.GAME_SECONDS += 1.0f;
                Globals.GAME_TIMER.Start(Globals.GAME_SECONDS, false, null);
                Globals.GAME_TIMER.Pause();
            }
        }



        public static void SetupTeams()
        {

        }
    }
}
