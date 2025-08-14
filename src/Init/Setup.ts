import { AffixFactory } from "src/Affixes/AffixFactory";
import { Logger } from "src/Events/Logger/Logger";
import { PlayerLeaves } from "src/Events/PlayerLeavesEvent/PlayerLeaves";
import { UnitSharing } from "src/Events/UnitSharing/UnitSharing";
import { VictoryZone } from "src/Events/VictoryZone/VictoryZone";
import { Kitty } from "src/Game/Entities/Kitty/Kitty";
import { NitroPacer } from "src/Game/Entities/NitroPacer";
import { ItemSpawner } from "src/Game/Items/ItemSpawner";
import { ItemStacker } from "src/Game/Items/ItemStacker";
import { UniqueItems } from "src/Game/Items/UniqueItems";
import { Progress } from "src/Game/Management/Progress";
import { Safezone } from "src/Game/Management/Safezone";
import { Shops } from "src/Game/Management/Shops";
import { PodiumManager } from "src/Game/Podium/PodiumManager";
import { GameTimer } from "src/Game/Rounds/GameTimer";
import { RoundManager } from "src/Game/Rounds/RoundManager";
import { WolfArea } from "src/Game/WolfArea";
import { Gamemode } from "src/Gamemodes/Gamemode";
import { GameMode } from "src/Gamemodes/GameModeEnum";
import { Globals } from "src/Global/Globals";
import { FirstPersonCameraManager } from "src/Misc/FirstPersonCameraManager";
import { Challenges } from "src/Rewards/Challenges/Challenges";
import { Savecode } from "src/Rewards/OldSaves/OldSaves";
import { RewardsManager } from "src/Rewards/Rewards/RewardsManager";
import { DoodadChanger } from "src/Seasonal/Doodads/DoodadChanger";
import { SeasonalManager } from "src/Seasonal/SeasonalManager";
import { MusicManager } from "src/Sounds/MusicManager";
import { SoundManager } from "src/Sounds/SoundManager";
import { CustomStatFrame } from "src/UI/CustomStatFrame";
import { FrameManager } from "src/UI/Frames/FrameManager";
import { ShopFrame } from "src/UI/Frames/ShopFrame";
import { MultiboardManager } from "src/UI/Multiboard";
import { Colors } from "src/Utility/Colors/Colors";
import { ErrorHandler } from "src/Utility/ErrorHandler";
import { AchesTimers } from "src/Utility/MemoryHandler/AchesTimers";
import { MemoryHandler } from "src/Utility/MemoryHandler/MemoryHandler";
import { Utility } from "src/Utility/Utility";
import { MapPlayer, base64Decode } from "w3ts";
import { Difficulty } from "./Difficulty/Difficulty";
import { GameSeed } from "./GameSeed";
import { Resources } from "./Resources";
import { Program } from "src/Program";

export class Setup {
    private static timeToChoose: number = 0.0
    private static gameModeTimer: AchesTimers
    private static wolfPlayers = [
        MapPlayer.fromIndex(bj_PLAYER_NEUTRAL_EXTRA)!,
        MapPlayer.fromIndex(bj_PLAYER_NEUTRAL_VICTIM)!,
        MapPlayer.fromIndex(PLAYER_NEUTRAL_AGGRESSIVE)!,
        MapPlayer.fromIndex(PLAYER_NEUTRAL_PASSIVE)!,
    ]
    private static wolfPlayerIndex: number = 0

    public static Initialize() {
        try {
            SetGameSpeed(MAP_SPEED_FASTEST);
            LockGameSpeedBJ()
            Colors.Initialize()
            GameSeed.Initialize()
            DoodadChanger.ShowSeasonalDoodads(false)
            Gamemode.Initialize()
            this.SetupVIPList()
            this.SetAlliedPlayers()
            //if (!ADMINDISABLE.AdminsGame()) return;
            Safezone.Initialize()
            Savecode.Initialize()
            Utility.SimpleTimer(2.0, () => this.StartGameModeTimer()) // Gives some delay time for the save system to sync
            StopMusic(false)
            ClearMapMusic()
            Globals.GAME_INITIALIZED = true
            if (!Program.Debug) return
            Difficulty.ChangeDifficulty('normal')
            Gamemode.SetGameMode(Globals.GAME_MODES[0])
        } catch (e: any) {
            Logger.Critical('Error in Setup.Initialize: {e.Message}')
            throw e
        }
    }

    private static StartGameModeTimer() {
        this.gameModeTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        this.gameModeTimer.Timer.start(1.0, true, ErrorHandler.Wrap(this.ChoosingGameMode))
    }

    private static ChoosingGameMode() {
        this.timeToChoose += 1.0
        if (this.timeToChoose == Globals.TIME_TO_PICK_GAMEMODE) Gamemode.SetGameMode(GameMode.Standard)
        if (Gamemode.IsGameModeChosen) {
            this.StartGame()
            this.gameModeTimer.dispose()
        }
    }

    private static StartGame() {
        try {
            this.RemoveDisconnectedPlayers()
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
                    this.wolfPlayers.push(MapPlayer.fromIndex(i)!)
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
            MapPlayer.fromIndex(i)!.Team = 0 // Need to check C# implementation
        }
    }

    private static RemoveDisconnectedPlayers() {
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const player = Globals.ALL_PLAYERS[i]
            if (player.slotState == PLAYER_SLOT_STATE_LEFT) {
                Globals.ALL_PLAYERS.splice(i, 1)
                i--
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
        let selectedPlayer = this.wolfPlayers[this.wolfPlayerIndex]
        this.wolfPlayerIndex = (this.wolfPlayerIndex + 1) % this.wolfPlayers.length
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
