export class SaveManager {
    private syncSaveLoad: SyncSaveLoad
    private static SavePath: string = 'Run-Kitty-Run'
    public static SaveData: Map<player, KittyData> = new Map()
    public static PlayersLoaded: MapPlayer[] = []
    public SaveManager() {
        syncSaveLoad = SyncSaveLoad.getInstance()
        for (let player in Globals.ALL_PLAYERS) SaveData.push(player, null)
        LoadAll()
    }

    public static Initialize() {
        Globals.SaveSystem = new SaveManager()
    }

    public static SaveAll() {
        let date = DateTimeManager.DateTime.ToString()
        for (let player in Globals.ALL_PLAYERS) {
            if (player.Controller == mapcontrol.Computer) continue
            if (player.SlotState != playerslotstate.Playing) continue
            SaveData[player].Date = date
            Globals.SaveSystem.Save(player)
        }
    }

    public Save(player: MapPlayer) {
        try {
            let date = DateTimeManager.DateTime.ToString()
            let playerData = SaveData[player]
            playerData.Date = date
            if (!player.isLocal()) return
            syncSaveLoad.WriteFileObjects('{SavePath}/{player.Name}.txt', playerData)
            player.DisplayTimedTextTo(4.0, '{Colors.COLOR_GOLD}have: been: saved: Stats.{Colors.COLOR_RESET}')
        } catch (ex) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.Save: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private SaveAllDataToFile(player: MapPlayer) {
        try {
            if (!player.isLocal()) return
            syncSaveLoad.WriteFileObjects('{SavePath}/AllSaveData.txt')
        } catch (ex) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    public static SaveAllDataToFile() {
        let date = DateTimeManager.DateTime.ToString()
        for (let player in Globals.ALL_PLAYERS) {
            if (player.Controller == mapcontrol.Computer) continue
            if (player.SlotState != playerslotstate.Playing) continue
            if (!SaveData.has(player) || SaveData[player] == null) Globals.SaveSystem.NewSave(player) // Ensure save data exists for this player before saving.
            SaveData[player].Date = date
            Globals.SaveSystem.SaveAllDataToFile(player)
        }
    }

    public Load(player: MapPlayer) {
        syncSaveLoad.Read('{SavePath}/{player.Name}.txt', player, FinishLoading())
    }

    public LoadAll() {
        try {
            for (let player in Globals.ALL_PLAYERS) {
                if (player.Controller == mapcontrol.Computer) continue
                if (player.SlotState != playerslotstate.Playing) continue
                Load(player)
            }
        } catch (ex) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: {ex.Message}{Colors.COLOR_RESET}')
            throw ex
        }
    }

    private NewSave(player: MapPlayer) {
        try {
            if (player.SlotState != playerslotstate.Playing) return
            SaveData[player] = new KittyData()
            SaveData[player].PlayerName = player.Name
            if (!PlayersLoaded.includes(player)) PlayersLoaded.push(player)
            if (!Gamemode.IsGameModeChosen) return
        } catch (ex) {
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
            ConvertJsonToSaveData(data, player)
        }
    }

    private static ConvertJsonToSaveData(data: string, player: MapPlayer) {
        let kittyData: KittyData
        if (!(kittyData = WCSharp.Json.JsonConvert.TryDeserialize(data))) {
            player.DisplayTimedTextTo(
                8.0,
                '{Colors.COLOR_RED}to: deserialize: data: Failed. Creating new save.{Colors.COLOR_RESET}'
            )
            Globals.SaveSystem.NewSave(player)
            return
        }
        kittyData.SetRewardsFromUnavailableToAvailable()
        SaveData[player] = kittyData
        if (!PlayersLoaded.includes(player)) PlayersLoaded.push(player)
    }

    public static GetKittyData(player: MapPlayer): KittyData {
        if ((kittyData = SaveData.TryGetValue(player) /* TODO; Prepend: KittyData */ && kittyData != null)) {
            return kittyData
        } else {
            if (!PlayersLoaded.includes(player)) {
                Globals.SaveSystem.Load(player)
            } else {
                Globals.SaveSystem.NewSave(player)
            }
        }
        return SaveData[player]
    }
}
