using System;
using System.Collections.Generic;
using System.Diagnostics;
using WCSharp.Api;
using static WCSharp.Api.Common;

namespace Source.Init
{

    public static class Setup
    {

        private static float timeToChoose = 0.0f;
        private static timer gameModeTimer;
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
                SetAlliedPlayers();
                //if (!ADMINDISABLE.AdminsGame()) return;
                Safezone.Initialize();
                Savecode.Initialize();
                StartGameModeTimer();
                StopMusic(false);
                ClearMapMusic();

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
            gameModeTimer = timer.Create();
            gameModeTimer.Start(1.0f, true, ChoosingGameMode);
        }

        private static void ChoosingGameMode()
        {
            timeToChoose += 1.0f;
            if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE)
                Gamemode.SetGameMode("Standard");
            if (Gamemode.IsGameModeChosen)
            {
                StartGame();
                GC.RemoveTimer(ref gameModeTimer);
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
                FloatingNameTag.Initialize();
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
                Utility.SimpleTimer(6.0f, () => MusicManager.PlayNumb());


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
                    _ = Globals.ALL_PLAYERS.Remove(player);
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
    }
}