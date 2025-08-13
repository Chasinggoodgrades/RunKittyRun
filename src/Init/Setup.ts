export class Setup {
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
            LockGameSpeedBJ()
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
        } catch (e: any) {
            Logger.Critical('Error in Setup.Initialize: {e.Message}')
            throw e
        }
    }

    private static StartGameModeTimer() {
        gameModeTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        gameModeTimer.Timer.start(1.0, true, ErrorHandler.Wrap(ChoosingGameMode))
    }

    private static ChoosingGameMode() {
        timeToChoose += 1.0
        if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE) Gamemode.SetGameMode(GameMode.Standard)
        if (Gamemode.IsGameModeChosen) {
            StartGame()
            gameModeTimer.dispose()
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
            MultiboardManager.Initialize()
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
                if (MapPlayer.fromIndex(i)!.slotState != PLAYER_SLOT_STATE_PLAYING) {
                    wolfPlayers.push(MapPlayer.fromIndex(i)!)
                }
            }
        } catch (e: any) {
            Logger.Critical('Error in Setup.StartGame: {e.Message}')
            throw e
        }
    }

    public static GetActivePlayers() {
        for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
            if (MapPlayer.fromIndex(i)!.slotState == PLAYER_SLOT_STATE_PLAYING)
                Globals.ALL_PLAYERS.push(MapPlayer.fromIndex(i)!)
            MapPlayer.fromIndex(i)!.Team = 0
        }
    }

    private static RemoveDisconnectedPlayers() {
        for (let player of Globals.ALL_PLAYERS) {
            if (player.slotState == playerslotstate.Left) {
                Globals.ALL_PLAYERS.Remove(player)
                break
            }
        }
    }

    private static SetAlliedPlayers() {
        for (let player of Globals.ALL_PLAYERS) {
            for (let playerx of Globals.ALL_PLAYERS) {
                if (player == playerx) continue
                player.setAlliance(playerx, ALLIANCE_PASSIVE, true)
                player.setAlliance(playerx, ALLIANCE_HELP_REQUEST, true)
                player.setAlliance(playerx, ALLIANCE_HELP_RESPONSE, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_XP, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_VISION, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_CONTROL, false)
            }
        }
    }

    public static getNextWolfPlayer(): MapPlayer {
        let selectedPlayer = wolfPlayers[wolfPlayerIndex]
        wolfPlayerIndex = (wolfPlayerIndex + 1) % wolfPlayers.length
        return selectedPlayer
    }

    public static SetupVIPList() {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            for (let j: number = 0; j < Globals.VIPLIST.length; j++) {
                let fromBase64Name = base64Decode(Globals.VIPLIST[j])
                if (Globals.ALL_PLAYERS[i].name == fromBase64Name) {
                    Globals.VIPLISTUNFILTERED.push(Globals.ALL_PLAYERS[i])
                }
            }
        }
    }
}
