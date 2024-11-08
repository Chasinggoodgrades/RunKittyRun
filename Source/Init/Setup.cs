﻿using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

namespace Source.Init
{

    public static class Setup
    {

        private static float timeToChoose = 0.0f;
        private static timer gameModeTimer;

        public static void Initialize()
        {
            Colors.Initialize();
            GetActivePlayers();
            Gamemode.Initialize();
            Safezone.Initialize();
            Savecode.Initialize();
            StartGameModeTimer();
            StopMusic(false);

        }

        private static void StartGameModeTimer()
        {
            gameModeTimer = timer.Create();
            gameModeTimer.Start(1.0f, true, ChoosingGameMode);
        }

        private static void ChoosingGameMode()
        {
            timeToChoose++;
            if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE)
                Gamemode.SetGameMode("Standard");
            if (Gamemode.IsGameModeChosen)
            {
                StartGame();
                gameModeTimer.Pause();
                gameModeTimer.Dispose();
            }
        }

        private static void StartGame()
        {
            try
            {
                FogEnable(false);
                FogMaskEnable(false);
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
                SuspendTimeOfDay(true);
                CustomStatFrame.Init();
                GameTimer.Initialize();
                Resources.Initialize();
                Progress.Initialize();
                Multiboard.Initialize();
                Shops.Initialize();
                WolfArea.Initialize();
                Kitty.Initialize();
                ItemSpawner.Initialize();
                ProtectionOfAncients.Initialize();
                PlayerLeaves.Initialize();
                FloatingNameTag.Initialize();
                VictoryZone.Initialize();
                AffixFactory.Initialize();
                RewardsManager.Initialize();
                RewardChecker.DisableALlRewards();
                RewardsFrame.Initialize();
                Challenges.Initialize();
                SoundManager.Initialize();
                ShopFrame.FinishInitialization();
                ShadowKitty.Initialize();
                UniqueItems.Initialize();
                NitroPacer.Initialize();
                RoundManager.Initialize();
            }
            catch (Exception e)
            {
                Console.WriteLine("StartGame: " + e.Message);
                Console.WriteLine("Stacktrace: " + e.StackTrace);
                throw;
            }
        }


        private static void GetActivePlayers()
        {
            for (int i = 0; i < GetBJMaxPlayers(); i++)
            {
                if (GetPlayerSlotState(Player(i)) == playerslotstate.Playing)
                    Globals.ALL_PLAYERS.Add(Player(i));
            }
        }

    }
}
