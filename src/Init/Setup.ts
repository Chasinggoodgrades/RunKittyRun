class Setup {
    private static timeToChoose: number = 0.0
    private static gameModeTimer: AchesTimers
    private static wolfPlayers = [
        player.NeutralExtra,
        player.NeutralVictim,
        player.NeutralAggressive,
        player.NeutralPassive,
    ]
    private static wolfPlayerIndex: number = 0

    public static Initialize() {
        try {
            SetGameSpeed(gamespeed.Fastest)
            Blizzard.LockGameSpeedBJ()
            Colors.Initialize()
            GameSeed.Initialize()
            DoodadChanger.ShowSeasonalDoodads(false)
            Gamemode.Initialize()
            SetupVIPList()
            SetAlliedPlayers()
            //if (!ADMINDISABLE.AdminsGame()) return;
            Safezone.Initialize()
            Savecode.Initialize()
            Utility.SimpleTimer(2.0, () => StartGameModeTimer()) // Gives some delay time for the save system to sync
            StopMusic(false)
            ClearMapMusic()
            Globals.GAME_INITIALIZED = true
            if (!Source.Program.Debug) return
            Difficulty.ChangeDifficulty('normal')
            Gamemode.SetGameMode(Globals.GAME_MODES[0])
        } catch (e: Error) {
            Logger.Critical('Error in Setup.Initialize: {e.Message}')
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static StartGameModeTimer() {
        gameModeTimer = ObjectPool.GetEmptyObject<AchesTimers>()
        gameModeTimer.Timer.Start(1.0, true, ErrorHandler.Wrap(ChoosingGameMode))
    }

    private static ChoosingGameMode() {
        timeToChoose += 1.0
        if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE) Gamemode.SetGameMode(GameMode.Standard)
        if (Gamemode.IsGameModeChosen) {
            StartGame()
            gameModeTimer.Dispose()
        }
    }

    private static StartGame() {
        try {
            RemoveDisconnectedPlayers()
            FogEnable(false)
            FogMaskEnable(false)
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
            SuspendTimeOfDay(true)
            FrameManager.Initialize()
            CustomStatFrame.Init()
            SeasonalManager.Initialize()
            GameTimer.Initialize()
            Resources.Initialize()
            Progress.Initialize()
            Shops.Initialize()
            UniqueItems.Initialize()
            WolfArea.Initialize()
            ItemStacker.Initialize()
            Kitty.Initialize()
            ItemSpawner.Initialize()
            Multiboard.Initialize()
            PlayerLeaves.Initialize()
            VictoryZone.Initialize()
            AffixFactory.Initialize()
            RewardsManager.Initialize()
            PodiumManager.Initialize()
            FrameManager.InitAllFrames()
            Challenges.Initialize()
            SoundManager.Initialize()
            ShopFrame.FinishInitialization()
            UnitSharing.Initialize()
            NitroPacer.Initialize()
            RoundManager.Initialize()
            FirstPersonCameraManager.Initialize()
            Utility.SimpleTimer(6.0, MusicManager.PlayNumb)

            for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
                if (Player(i).SlotState != playerslotstate.Playing) {
                    wolfPlayers.Add(Player(i))
                }
            }
        } catch (e: Error) {
            Logger.Critical('Error in Setup.StartGame: {e.Message}')
            throw new Error() // TODO; Rethrow actual error
        }
    }

    public static GetActivePlayers() {
        for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
            if (Player(i).SlotState == playerslotstate.Playing) Globals.ALL_PLAYERS.Add(Player(i))
            Player(i).Team = 0
        }
    }

    private static RemoveDisconnectedPlayers() {
        for (let player in Globals.ALL_PLAYERS) {
            if (player.SlotState == playerslotstate.Left) {
                Globals.ALL_PLAYERS.Remove(player)
                break
            }
        }
    }

    private static SetAlliedPlayers() {
        for (let player in Globals.ALL_PLAYERS) {
            for (let playerx in Globals.ALL_PLAYERS) {
                if (player == playerx) continue
                player.SetAlliance(playerx, ALLIANCE_PASSIVE, true)
                player.SetAlliance(playerx, ALLIANCE_HELP_REQUEST, true)
                player.SetAlliance(playerx, ALLIANCE_HELP_RESPONSE, true)
                player.SetAlliance(playerx, ALLIANCE_SHARED_XP, true)
                player.SetAlliance(playerx, ALLIANCE_SHARED_VISION, true)
                player.SetAlliance(playerx, ALLIANCE_SHARED_CONTROL, false)
            }
        }
    }

    public static getNextWolfPlayer(): player {
        let selectedPlayer = wolfPlayers[wolfPlayerIndex]
        wolfPlayerIndex = (wolfPlayerIndex + 1) % wolfPlayers.Count
        return selectedPlayer
    }

    public static SetupVIPList() {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
            for (let j: number = 0; j < Globals.VIPLIST.Length; j++) {
                let fromBase64Name = Base64.FromBase64(Globals.VIPLIST[j])
                if (Globals.ALL_PLAYERS[i].Name == fromBase64Name) {
                    Globals.VIPLISTUNFILTERED.Add(Globals.ALL_PLAYERS[i])
                }
            }
        }
    }
}
