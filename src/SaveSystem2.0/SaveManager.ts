import { Logger } from 'src/Events/Logger/Logger'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { Globals } from 'src/Global/Globals'
import { DateTimeManager } from 'src/Seasonal/DateTimeManager'
import { Action } from 'src/Utility/CSUtils'
import { MapPlayer } from 'w3ts'
import { KittyData } from './MAKE REWARDS HERE/KittyData'
import { FilePromise, SyncSaveLoad } from './SyncSaveSystem'

export class SaveManager {
    private syncSaveLoad: SyncSaveLoad
    private static SavePath: string = 'Run-Kitty-Run'
    public static SaveData: Map<MapPlayer, KittyData | undefined> = new Map()
    public static PlayersLoaded: MapPlayer[] = []
    public constructor() {
        this.syncSaveLoad = SyncSaveLoad.getInstance()
        for (let player of Globals.ALL_PLAYERS) SaveManager.SaveData.set(player, undefined)
        this.LoadAll()
    }

    public static Initialize() {
        Globals.SaveSystem = new SaveManager()
    }

    public static SaveAll() {
        let date = DateTimeManager.DateTime.toString()
        for (let player of Globals.ALL_PLAYERS) {
            if (player.controller == MAP_CONTROL_COMPUTER) continue
            if (player.slotState != PLAYER_SLOT_STATE_PLAYING) continue
            let saveData = SaveManager.SaveData.get(player)
            if (!saveData) continue
            saveData.Date = date
            Globals.SaveSystem.Save(player)
        }
    }

    public Save(player: MapPlayer) {
        try {
            let date = DateTimeManager.DateTime.toString()
            let playerData = SaveManager.SaveData.get(player)
            if (!playerData) return
            playerData.Date = date
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects('{SavePath}/{player.name}.txt', playerData)
            player.DisplayTimedTextTo(4.0, '{Colors.COLOR_GOLD}have: been: saved: Stats.{Colors.COLOR_RESET}')
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.Save: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private SaveAllDataToFile(player: MapPlayer) {
        try {
            if (!player.isLocal()) return
            this.syncSaveLoad.WriteFileObjects('{SavePath}/AllSaveData.txt')
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    public static SaveAllDataToFile() {
        let date = DateTimeManager.DateTime.toString()
        for (let player of Globals.ALL_PLAYERS) {
            if (player.controller == MAP_CONTROL_COMPUTER) continue
            if (player.slotState != PLAYER_SLOT_STATE_PLAYING) continue
            if (!SaveManager.SaveData.has(player) || SaveManager.SaveData.get(player) == null)
                Globals.SaveSystem.NewSave(player) // Ensure save data exists for this player before saving.
            let data = SaveManager.SaveData.get(player)
            if (!data) continue
            data.Date = date
            Globals.SaveSystem.SaveAllDataToFile(player)
        }
    }

    public Load(player: MapPlayer) {
        this.syncSaveLoad.Read('{SavePath}/{player.name}.txt', player, SaveManager.FinishLoading())
    }

    public LoadAll() {
        try {
            for (let player of Globals.ALL_PLAYERS) {
                if (player.controller == MAP_CONTROL_COMPUTER) continue
                if (player.slotState != PLAYER_SLOT_STATE_PLAYING) continue
                this.Load(player)
            }
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private NewSave(player: MapPlayer) {
        try {
            if (player.slotState != PLAYER_SLOT_STATE_PLAYING) return
            SaveManager.SaveData.set(player, new KittyData())
            let saveData = SaveManager.SaveData.get(player)
            if (!saveData) return
            saveData.PlayerName = player.name
            if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
            if (!Gamemode.IsGameModeChosen) return
        } catch (ex: any) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.NewSave: {ex.Message} {Colors.COLOR_RESET}')
            throw ex
        }
    }

    private static FinishLoading(): Action<FilePromise> {
        return promise => {
            let data = promise.DecodedString
            let player = promise.SyncOwner
            if (data.length < 1) {
                Globals.SaveSystem.NewSave(player)
                player.DisplayTimedTextTo(
                    5.0,
                    '{Colors.COLOR_YELLOW}save: found: No. Creating new save.{Colors.COLOR_RESET}'
                )
                return
            }
            this.ConvertJsonToSaveData(data, player)
        }
    }

    private static ConvertJsonToSaveData(data: string, player: MapPlayer) {
        let kittyData = json().decode<KittyData>(data)
        if (!kittyData) {
            player.DisplayTimedTextTo(
                8.0,
                '{Colors.COLOR_RED}to: deserialize: data: Failed. Creating new save.{Colors.COLOR_RESET}'
            )
            Globals.SaveSystem.NewSave(player)
            return
        }
        kittyData.SetRewardsFromUnavailableToAvailable()
        SaveManager.SaveData.set(player, kittyData)
        if (!SaveManager.PlayersLoaded.includes(player)) SaveManager.PlayersLoaded.push(player)
    }

    public static GetKittyData(player: MapPlayer): KittyData | undefined {
        let kittyData = SaveManager.SaveData.get(player)
        if (kittyData) {
            return kittyData
        } else {
            if (!SaveManager.PlayersLoaded.includes(player)) {
                Globals.SaveSystem.Load(player)
            } else {
                Globals.SaveSystem.NewSave(player)
            }
        }

        return SaveManager.SaveData.get(player)
    }
}
