import { AffixFactory } from 'src/Affixes/AffixFactory'
import { PROD } from 'src/env'
import { Logger } from 'src/Events/Logger/Logger'
import { PlayerLeaves } from 'src/Events/PlayerLeavesEvent/PlayerLeaves'
import { UnitSharing } from 'src/Events/UnitSharing/UnitSharing'
import { VictoryZone } from 'src/Events/VictoryZone/VictoryZone'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { NitroPacer } from 'src/Game/Entities/NitroPacer'
import { ItemSpawner } from 'src/Game/Items/ItemSpawner'
import { ItemStacker } from 'src/Game/Items/ItemStacker'
import { UniqueItems } from 'src/Game/Items/UniqueItems'
import { Progress } from 'src/Game/Management/Progress'
import { Safezone } from 'src/Game/Management/Safezone'
import { Shops } from 'src/Game/Management/Shops'
import { PodiumUtil } from 'src/Game/Podium/PodiumUtil'
import { GameTimer } from 'src/Game/Rounds/GameTimer'
import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { WolfArea } from 'src/Game/WolfArea'
import { WolfPoint } from 'src/Game/WolfPoint'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { FirstPersonCameraManager } from 'src/Misc/FirstPersonCameraManager'
import { Challenges } from 'src/Rewards/Challenges/Challenges'
import { NitroChallenges } from 'src/Rewards/Challenges/NitroChallenges'
import { Savecode } from 'src/Rewards/OldSaves/OldSaves'
import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { ChampionAwards } from 'src/Rewards/Rewards/ChampionAwards'
import { RewardsManager } from 'src/Rewards/Rewards/RewardsManager'
import { DoodadChanger } from 'src/Seasonal/Doodads/DoodadChanger'
import { SeasonalManager } from 'src/Seasonal/SeasonalManager'
import { MusicManager } from 'src/Sounds/MusicManager'
import { SoundManager } from 'src/Sounds/SoundManager'
import { CustomStatFrame } from 'src/UI/CustomStatFrame'
import { FrameManager } from 'src/UI/Frames/FrameManager'
import { MusicFrame } from 'src/UI/Frames/MusicFrame'
import { ShopFrame } from 'src/UI/Frames/ShopFrame'
import { MultiboardManager } from 'src/UI/Multiboard'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { AchesTimers, createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { EncodingBase64 } from '../SaveSystem2.0/Base64'
import { RewardsFrame } from '../UI/Frames/RewardsFrame'
import { Difficulty } from './Difficulty/Difficulty'
import { GameSeed } from './GameSeed'
import { Resources } from './Resources'
import { InitVariables } from './VariableInit'

export class Setup {
    private static timeToChoose = 0.0
    private static gameModeTimer: AchesTimers

    public static Initialize = () => {
        try {
            SetGameSpeed(MAP_SPEED_FASTEST)
            LockGameSpeedBJ()
            InitVariables()
            Globals.Initialize()
            ColorUtils.Initialize()
            GameSeed.Initialize()
            WolfPoint.AssignOrderIds()
            SeasonalManager.Initialize()
            DoodadChanger.ShowSeasonalDoodads(false)
            Gamemode.Initialize()
            Setup.SetupVIPList()
            Setup.SetAlliedPlayers()
            //if (!ADMINDISABLE.AdminsGame()) return;
            Safezone.Initialize()
            Savecode.Initialize()
            Utility.SimpleTimer(2.0, () => Setup.StartGameModeTimer()) // Gives some delay time for the save system to sync
            StopMusic(false)
            ClearMapMusic()
            Globals.GAME_INITIALIZED = true
            if (PROD) return
            Difficulty.ChangeDifficulty('normal')
            Gamemode.SetGameMode(GameMode.Standard)
        } catch (e: any) {
            Logger.Critical(`Error in Setup.Initialize: ${e}`)
            throw e
        }
    }

    private static StartGameModeTimer = () => {
        Setup.gameModeTimer = createAchesTimer()
        Setup.gameModeTimer.Timer.start(1.0, true, Setup.ChoosingGameMode)
    }

    private static ChoosingGameMode = () => {
        Setup.timeToChoose += 1.0
        if (Setup.timeToChoose === Globals.TIME_TO_PICK_GAMEMODE) Gamemode.SetGameMode(GameMode.Standard)
        if (Gamemode.IsGameModeChosen) {
            Setup.StartGame()
            Setup.gameModeTimer.dispose()
        }
    }

    private static StartGame = () => {
        try {
            Setup.RemoveDisconnectedPlayers()
            FogEnable(false)
            FogMaskEnable(false)
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
            SuspendTimeOfDay(true)
            FrameManager.Initialize()
            MusicFrame.Initialize()
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
            RewardsManager.RegisterTrigger()
            RewardsManager.SetupRewards()
            RewardsManager.RewardAbilitiesList()
            AwardManager.RegisterGamestatEvents()
            ChampionAwards.AwardAllChampions()
            PodiumUtil.Initialize()
            ShopFrame.Initialize()
            RewardsFrame.Initialize()
            FrameManager.InitalizeButtons()
            FrameManager.InitFramesList()
            Challenges.Initialize()
            NitroChallenges.Initialize()
            SoundManager.Initialize()
            ShopFrame.FinishInitialization()
            UnitSharing.Initialize()
            NitroPacer.Initialize()
            RoundManager.Initialize()
            FirstPersonCameraManager.Initialize()
            Utility.SimpleTimer(6.0, () => MusicManager.PlayNumb())
        } catch (e: any) {
            Logger.Critical(`Error in Setup.StartGame: ${e}`)
            throw e
        }
    }

    public static GetActivePlayers = () => {
        for (let i = 0; i < GetBJMaxPlayers(); i++) {
            if (MapPlayer.fromIndex(i)!.slotState === PLAYER_SLOT_STATE_PLAYING)
                Globals.ALL_PLAYERS.push(MapPlayer.fromIndex(i)!)
            SetPlayerTeam(MapPlayer.fromIndex(i)!.handle, 0) // Need to check C# implementation
        }
    }

    private static RemoveDisconnectedPlayers = () => {
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const player = Globals.ALL_PLAYERS[i]
            if (player.slotState === PLAYER_SLOT_STATE_LEFT) {
                Globals.ALL_PLAYERS.splice(i, 1)
                i--
            }
        }
    }

    private static SetAlliedPlayers = () => {
        for (const player of Globals.ALL_PLAYERS) {
            for (const playerx of Globals.ALL_PLAYERS) {
                if (player === playerx) continue
                player.setAlliance(playerx, ALLIANCE_PASSIVE, true)
                player.setAlliance(playerx, ALLIANCE_HELP_REQUEST, true)
                player.setAlliance(playerx, ALLIANCE_HELP_RESPONSE, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_XP, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_VISION, true)
                player.setAlliance(playerx, ALLIANCE_SHARED_CONTROL, false)
            }
        }
    }

    public static SetupVIPList = () => {
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            for (let j = 0; j < Globals.VIPLIST.length; j++) {
                const fromBase64Name = EncodingBase64.Decode(Globals.VIPLIST[j])
                if (Globals.ALL_PLAYERS[i].name === fromBase64Name) {
                    Globals.VIPLISTUNFILTERED.push(Globals.ALL_PLAYERS[i])
                }
            }
        }
    }
}
