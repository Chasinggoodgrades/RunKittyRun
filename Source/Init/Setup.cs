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
            GetActivePlayers();
            FogEnable(false);
            FogMaskEnable(false);
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
            SuspendTimeOfDay(true);

            CustomStatFrame.Init();
            Kitty.BeginSpawning();
            GameTimer.SetupTimers();
            Safezone.SetupSafezones();
            RoundManager.RoundSetup();
        }


        private static void GetActivePlayers()
        {
            for (int i = 0; i < Globals.NUMBER_OF_PLAYERS; i++)
            {
                if (GetPlayerSlotState(Player(i)) == playerslotstate.Playing)
                {
                    Globals.ALL_PLAYERS.Add(Player(i));
                }
            }
        }
    }
}
