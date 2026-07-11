using System;
using WCSharp.Api;

public class SaveManager
{
    private SyncSaveLoad syncSaveLoad;
    private static string SavePath { get; } = "Run-Kitty-Run";
    private static string CompiledVERSION = "DoNotTouch"; // Set during compile time Launcher/Program.cs
    public static KittyData[] SaveData { get; set; } = new KittyData[24];
    private static bool[] playersLoaded = new bool[24];
    private static int playersLoadedCount = 0;
    public static int PlayersLoadedCount => playersLoadedCount;
    public static bool IsPlayerLoaded(player player) => player != null && playersLoaded[player.Id];
    public static void SetPlayerLoaded(player player)
    {
        if (player != null && !playersLoaded[player.Id])
        {
            playersLoaded[player.Id] = true;
            playersLoadedCount++;
        }
    }
    public SaveManager()
    {
        syncSaveLoad = SyncSaveLoad.Instance;
        Console.WriteLine($"{Colors.COLOR_TURQUOISE}SaveManager Initialized.{Colors.COLOR_RESET}");
        LoadAll();
    }

    public static void Initialize()
    {
        Globals.SaveSystem = new SaveManager();
    }

    public static void SaveAll()
    {
        var date = DateTimeManager.DateTime.ToString();
        for (int i = 0; i <  Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            if (player.Controller == mapcontrol.Computer) continue;
            if (player.SlotState != playerslotstate.Playing) continue;
            SaveData[player.Id].Date = date;
            Globals.SaveSystem.Save(player);
        }
    }

    public void Save(player player)
    {
        try
        {
            var date = DateTimeManager.DateTime.ToString();
            var playerData = SaveData[player.Id];
            playerData.Date = date;
            if (!player.IsLocal) return;
            syncSaveLoad.WriteFileObjects($"{SavePath}/{player.Name}.txt", playerData);
            player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_GOLD}Stats have been saved.{Colors.COLOR_RESET}");
        }
        catch (Exception ex)
        {
            Logger.Critical($"{Colors.COLOR_DARK_RED}Error in SaveManager.Save: {ex.Message}{Colors.COLOR_RESET}");
            throw;
        }
    }

    /// <summary>
    /// Admin Command to save all data to a single file for debugging purposes. Not intended for regular use.
    /// </summary>
    /// <param name="player"></param>
    public void SaveAllDataToFile(player player)
    {
        try
        {
            if (!player.IsLocal) return;
            syncSaveLoad.WriteFileObjects($"{SavePath}/AllSaveData.txt");
        }
        catch (Exception ex)
        {
            Logger.Critical($"{Colors.COLOR_DARK_RED}Error in SaveManager.SaveAll: {ex.Message}{Colors.COLOR_RESET}");
            throw;
        }
    }

    public static void SaveAllDataToFile()
    {
        var date = DateTimeManager.DateTime.ToString();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if (player.Controller == mapcontrol.Computer) continue;
            if (player.SlotState != playerslotstate.Playing) continue;
            if (SaveData[player.Id] == null)
                Globals.SaveSystem.NewSave(player); // Ensure save data exists for this player before saving.
            SaveData[player.Id].Date = date;
            Globals.SaveSystem.SaveAllDataToFile(player);
        }
    }

    public void Load(player player)
    {
        syncSaveLoad.Read($"{SavePath}/{player.Name}.txt", player, FinishLoading());
    }

    public void LoadAll()
    {
        try
        {
            for(int i = 0; i <  Globals.ALL_PLAYERS.Count; i++)
            {
                var player = Globals.ALL_PLAYERS[i];
                if (player.Controller == mapcontrol.Computer) continue;
                if (player.SlotState != playerslotstate.Playing) continue;
                Load(player);
            }
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}All player saves have been loaded.{Colors.COLOR_RESET}");
        }
        catch (Exception ex)
        {
            Logger.Critical($"{Colors.COLOR_DARK_RED}Error in SaveManager.LoadAll: {ex.Message}{Colors.COLOR_RESET}");
            throw;
        }
    }

    private void NewSave(player player)
    {
        try
        {
            SaveData[player.Id] = new KittyData();
            SaveData[player.Id].PlayerName = player.Name;
            SaveData[player.Id].Version = CompiledVERSION;
            SetPlayerLoaded(player);
            if (!Gamemode.IsGameModeChosen) return;
        }
        catch (Exception ex)
        {
            Logger.Critical($"{Colors.COLOR_DARK_RED}Error in SaveManager.NewSave: {ex.Message} {Colors.COLOR_RESET}");
            throw;
        }
    }

    private static Action<FilePromise> FinishLoading()
    {
        return (promise) =>
         {
             var data = promise?.DecodedString;
             var player = promise?.SyncOwner;
             if (data == null || data.Length < 1)
             {
                 Globals.SaveSystem.NewSave(player);
                 player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}No save found. Creating new save.{Colors.COLOR_RESET}");
                 return;
             }
             ConvertJsonToSaveData(data, player);
         };
    }

    private static void ConvertJsonToSaveData(string data, player player)
    {
        if (!WCSharp.Json.JsonConvert.TryDeserialize(data, out KittyData kittyData))
        {
            player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}Failed to deserialize data. Creating new save.{Colors.COLOR_RESET}");
            Globals.SaveSystem.NewSave(player);
            return;
        }
        kittyData.SetRewardsFromUnavailableToAvailable();
        kittyData.Version = CompiledVERSION;
        SaveData[player.Id] = kittyData;
        SetPlayerLoaded(player);
    }

    public static KittyData GetKittyData(player player)
    {
        var kittyData = SaveData[player.Id];
        if (kittyData != null)
        {
            return kittyData;
        }
        else
        {
            if (!playersLoaded[player.Id])
            {
                Globals.SaveSystem.Load(player);
            }
            else
            {
                Globals.SaveSystem.NewSave(player);
            }
        }
        return SaveData[player.Id];
    }
}
