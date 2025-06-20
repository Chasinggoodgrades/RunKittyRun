﻿using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared;
using static WCSharp.Api.Common;

namespace Source.Init
{
    public static class Setup
    {
        private static float timeToChoose = 0.0f;
        private static AchesTimers gameModeTimer;
        private static List<player> wolfPlayers { get; set; } = new List<player> { player.NeutralExtra, player.NeutralVictim, player.NeutralAggressive, player.NeutralPassive };
        private static int wolfPlayerIndex = 0;

        public static void Initialize()
        {
            try
            {
                SetGameSpeed(gamespeed.Fastest);
                Blizzard.LockGameSpeedBJ();
                Colors.Initialize();
                DoodadChanger.ShowSeasonalDoodads(false);
                Gamemode.Initialize();
                SetupVIPList();
                SetAlliedPlayers();
                //if (!ADMINDISABLE.AdminsGame()) return;
                Safezone.Initialize();
                Savecode.Initialize();
                Utility.SimpleTimer(2.0f, () => StartGameModeTimer()); // Gives some delay time for the save system to sync
                StopMusic(false);
                ClearMapMusic();
                Globals.GAME_INITIALIZED = true;
                if (!Source.Program.Debug) return;
                Difficulty.ChangeDifficulty("normal");
                Gamemode.SetGameMode(Globals.GAME_MODES[0]);
            }
            catch (Exception e)
            {
                Logger.Critical($"Error in Setup.Initialize: {e.Message}");
                throw;
            }
        }

        private static void StartGameModeTimer()
        {
            gameModeTimer = ObjectPool.GetEmptyObject<AchesTimers>();
            gameModeTimer.Timer.Start(1.0f, true, ErrorHandler.Wrap(ChoosingGameMode));
        }

        private static void ChoosingGameMode()
        {
            timeToChoose += 1.0f;
            if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE)
                Gamemode.SetGameMode("Standard");
            if (Gamemode.IsGameModeChosen)
            {
                StartGame();
                gameModeTimer.Dispose();
            }
        }

        private static void StartGame()
        {
            try
            {
                RemoveDisconnectedPlayers();
                FogEnable(false);
                FogMaskEnable(false);
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
                SuspendTimeOfDay(true);
                FrameManager.Initialize();
                CustomStatFrame.Init();
                SeasonalManager.Initialize();
                GameTimer.Initialize();
                Resources.Initialize();
                Progress.Initialize();
                Shops.Initialize();
                UniqueItems.Initialize();
                WolfArea.Initialize();
                ItemStacker.Initialize();
                Kitty.Initialize();
                ItemSpawner.Initialize();
                ProtectionOfAncients.Initialize();
                Multiboard.Initialize();
                PlayerLeaves.Initialize();
                VictoryZone.Initialize();
                AffixFactory.Initialize();
                RewardsManager.Initialize();
                PodiumManager.Initialize();
                FrameManager.InitAllFrames();
                Challenges.Initialize();
                SoundManager.Initialize();
                ShopFrame.FinishInitialization();
                ShadowKitty.Initialize();
                NitroPacer.Initialize();
                RoundManager.Initialize();
                FirstPersonCameraManager.Initialize();
                Utility.SimpleTimer(6.0f, MusicManager.PlayNumb);

                for (int i = 0; i < GetBJMaxPlayers(); i++)
                {
                    if (Player(i).SlotState != playerslotstate.Playing)
                    {
                        wolfPlayers.Add(Player(i));
                    }
                }
            }
            catch (Exception e)
            {
                Logger.Critical($"Error in Setup.StartGame: {e.Message}");
                throw;
            }
        }

        public static void GetActivePlayers()
        {
            for (int i = 0; i < GetBJMaxPlayers(); i++)
            {
                if (Player(i).SlotState == playerslotstate.Playing)
                    Globals.ALL_PLAYERS.Add(Player(i));
                Player(i).Team = 0;
            }
        }

        private static void RemoveDisconnectedPlayers()
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                if (player.SlotState == playerslotstate.Left)
                {
                    Globals.ALL_PLAYERS.Remove(player);
                    break;
                }
            }
        }

        private static void SetAlliedPlayers()
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                foreach (var playerx in Globals.ALL_PLAYERS)
                {
                    if (player == playerx) continue;
                    player.SetAlliance(playerx, ALLIANCE_PASSIVE, true);
                    player.SetAlliance(playerx, ALLIANCE_HELP_REQUEST, true);
                    player.SetAlliance(playerx, ALLIANCE_HELP_RESPONSE, true);
                    player.SetAlliance(playerx, ALLIANCE_SHARED_XP, true);
                    player.SetAlliance(playerx, ALLIANCE_SHARED_VISION, true);
                    player.SetAlliance(playerx, ALLIANCE_SHARED_CONTROL, false);
                }
            }
        }
            
        public static player getNextWolfPlayer()
        {
            var selectedPlayer = wolfPlayers[wolfPlayerIndex];
            wolfPlayerIndex = (wolfPlayerIndex + 1) % wolfPlayers.Count;
            return selectedPlayer;
        }

        public static void SetupVIPList()
        {
            for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
            {
                for (int j = 0; j < Globals.VIPLIST.Length; j++)
                {
                    var fromBase64Name = Base64.FromBase64(Globals.VIPLIST[j]);
                    if (Globals.ALL_PLAYERS[i].Name == fromBase64Name)
                    {
                        Globals.VIPLISTUNFILTERED.Add(Globals.ALL_PLAYERS[i]);
                    }
                }
            }
        }
    }
}
