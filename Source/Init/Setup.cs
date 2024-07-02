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

        private static float timeToChoose = 0.0f;
        private static timer gameModeTimer;

        public static void Initialize()
        {
            GetActivePlayers();
            Gamemode.Initialize();
            StartGameModeTimer();
        }

        private static void StartGameModeTimer()
        {
            gameModeTimer = CreateTimer();
            gameModeTimer.Start(1.0f, true, ChoosingGameMode);
        }

        private static void ChoosingGameMode()
        {
            timeToChoose++;
            if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE)
                Gamemode.SetGameMode(Globals.GAME_MODES[0]);
            if (Gamemode.IsGameModeChosen)
            {
                StartGame();
                gameModeTimer.Dispose();
            }
        }

        private static void StartGame()
        {
            FogEnable(false);
            FogMaskEnable(false);
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
            SuspendTimeOfDay(true);
            CustomStatFrame.Init();
            Kitty.Initialize();
            GameTimer.Initialize();
            Safezone.Initialize();
            RoundManager.RoundSetup();
        }

        private static void GetActivePlayers()
        {
            for (int i = 0; i < Globals.NUMBER_OF_PLAYERS; i++)
            {
                if (GetPlayerSlotState(Player(i)) == playerslotstate.Playing)
                    Globals.ALL_PLAYERS.Add(Player(i));
            }
        }




    }
}
