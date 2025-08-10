

class SaveManager
{
    private syncSaveLoad: SyncSaveLoad;
    private static SavePath: string  = "Run-Kitty-Run";
    public static Dictionary<player, KittyData> SaveData = new Dictionary<player, KittyData>();
    public static List<player> PlayersLoaded  = new List<player>();
    public SaveManager()
    {
        syncSaveLoad = SyncSaveLoad.Instance;
        for (let player in Globals.ALL_PLAYERS) SaveData.Add(player, null);
        LoadAll();
    }

    public static Initialize()
    {
        Globals.SaveSystem = new SaveManager();
    }

    public static SaveAll()
    {
        let date = DateTimeManager.DateTime.ToString();
        for (let player in Globals.ALL_PLAYERS)
        {
            if (player.Controller == mapcontrol.Computer) continue;
            if (player.SlotState != playerslotstate.Playing) continue;
            SaveData[player].Date = date;
            Globals.SaveSystem.Save(player);
        }
    }

    public Save(player: player)
    {
        try
        {
            let date = DateTimeManager.DateTime.ToString();
            let playerData = SaveData[player];
            playerData.Date = date;
            if (!player.IsLocal) return;
            syncSaveLoad.WriteFileObjects("{SavePath}/{player.Name}.txt", playerData);
            player.DisplayTimedTextTo(4.0, "{Colors.COLOR_GOLD}have: been: saved: Stats.{Colors.COLOR_RESET}");
        }
        catch (ex: Error)
        {
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in SaveManager.Save: {ex.Message}{Colors.COLOR_RESET}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private SaveAllDataToFile(player: player)
    {
        try
        {
            if (!player.IsLocal) return;
            syncSaveLoad.WriteFileObjects("{SavePath}/AllSaveData.txt");
        }
        catch (ex: Error)
        {
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: {ex.Message}{Colors.COLOR_RESET}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    public static SaveAllDataToFile()
    {
        let date = DateTimeManager.DateTime.ToString();
        for (let player in Globals.ALL_PLAYERS)
        {
            if (player.Controller == mapcontrol.Computer) continue;
            if (player.SlotState != playerslotstate.Playing) continue;
            if (!SaveData.ContainsKey(player) || SaveData[player] == null)
                Globals.SaveSystem.NewSave(player); // Ensure save data exists for this player before saving.
            SaveData[player].Date = date;
            Globals.SaveSystem.SaveAllDataToFile(player);
        }
    }

    public Load(player: player)
    {
        syncSaveLoad.Read("{SavePath}/{player.Name}.txt", player, FinishLoading());
    }

    public LoadAll()
    {
        try
        {
            for (let player in Globals.ALL_PLAYERS)
            {
                if (player.Controller == mapcontrol.Computer) continue;
                if (player.SlotState != playerslotstate.Playing) continue;
                Load(player);
            }
        }
        catch (ex: Error)
        {
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: {ex.Message}{Colors.COLOR_RESET}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private NewSave(player: player)
    {
        try
        {
            if (player.SlotState != playerslotstate.Playing) return;
            SaveData[player] = new KittyData();
            SaveData[player].PlayerName = player.Name;
            if (!PlayersLoaded.Contains(player)) PlayersLoaded.Add(player);
            if (!Gamemode.IsGameModeChosen) return;
        }
        catch (ex: Error)
        {
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in SaveManager.NewSave: {ex.Message} {Colors.COLOR_RESET}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static Action<FilePromise> FinishLoading()
    {
        return (promise) =>
         {
             let data = promise.DecodedString;
             let player = promise.SyncOwner;
             if (data.Length < 1)
             {
                 Globals.SaveSystem.NewSave(player);
                 player.DisplayTimedTextTo(5.0, "{Colors.COLOR_YELLOW}save: found: No. Creating new save.{Colors.COLOR_RESET}");
                 return;
             }
             ConvertJsonToSaveData(data, player);
         };
    }

    private static ConvertJsonToSaveData(data: string, player: player)
    {
        if (!WCSharp.Json.JsonConvert.TryDeserialize(data, KittyData: kittyData: out))
        {
            player.DisplayTimedTextTo(8.0, "{Colors.COLOR_RED}to: deserialize: data: Failed. Creating new save.{Colors.COLOR_RESET}");
            Globals.SaveSystem.NewSave(player);
            return;
        }
        kittyData.SetRewardsFromUnavailableToAvailable();
        SaveData[player] = kittyData;
        if (!PlayersLoaded.Contains(player)) PlayersLoaded.Add(player);
    }

    public static GetKittyData: KittyData(player: player)
    {
        if (kittyData = SaveData.TryGetValue(player) /* TODO; Prepend: KittyData */ && kittyData != null)
        {
            return kittyData;
        }
        else
        {
            if (!PlayersLoaded.Contains(player))
            {
                Globals.SaveSystem.Load(player);
            }
            else
            {
                Globals.SaveSystem.NewSave(player);
            }
        }
        return SaveData[player];
    }
}
