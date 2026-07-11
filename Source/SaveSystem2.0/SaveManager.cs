using System;
using System.Collections.Generic;
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
    private Queue<player> loadQueue = new Queue<player>();
    private timer loadTimer;
    private const float LOAD_INTERVAL = 0.3f;
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
            Logger.Critical($"Error in SaveManager.Save: {ex.Message}");
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
            Logger.Critical($"Error in SaveManager.SaveAll:  {ex.Message}");
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
            loadQueue.Clear();
            playersLoadedCount = 0;


            for (int i = 0; i <  Globals.ALL_PLAYERS.Count; i++)
            {
                var player = Globals.ALL_PLAYERS[i];
                if (player.Controller == mapcontrol.Computer) continue;
                if (player.SlotState != playerslotstate.Playing) continue;
                loadQueue.Enqueue(player);
            }
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}Queued {loadQueue.Count} players for loading.{Colors.COLOR_RESET}");

            if (loadQueue.Count > 0)
            {
                ProcessLoadQueue();
            }
            else
            {
                Console.WriteLine($"{Colors.COLOR_TURQUOISE}No players to load.{Colors.COLOR_RESET}");
            }



        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in SaveManager.LoadAll: {ex.Message}");
            throw;
        }
    }

    private void ProcessLoadQueue()
    {
        if (loadQueue.Count == 0)
        {
            Console.WriteLine($"{Colors.COLOR_GREEN}All player loads have been called.{Colors.COLOR_RESET}");
            return;
        }

        var player = loadQueue.Dequeue();
        Console.WriteLine($"{Colors.COLOR_TURQUOISE}Loading save for player: {Colors.PlayerNameColored(player)} ({Globals.ALL_PLAYERS.Count - loadQueue.Count} of {Globals.ALL_PLAYERS.Count}){Colors.COLOR_RESET}");
        Load(player);

        loadTimer ??= timer.Create();
        loadTimer.Start(LOAD_INTERVAL, false, () =>
        {
            ProcessLoadQueue();
        });
    }

    private void NewSave(player player)
    {
        try
        {
            SaveData[player.Id] = new KittyData();
            SaveData[player.Id].PlayerName = player.Name;
            SaveData[player.Id].Version = CompiledVERSION;
            SetPlayerLoaded(player);
            Console.WriteLine($"{Colors.COLOR_TURQUOISE}New save created for player: {player.Name}{Colors.COLOR_RESET}");
            if (!Gamemode.IsGameModeChosen) return;
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in SaveManager.NewSave: {ex.Message}");
            throw;
        }
    }

    private static Action<FilePromise> FinishLoading()
    {
        return (promise) =>
         {
             try
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
                 Console.WriteLine($"{Colors.COLOR_GREEN}{Colors.PlayerNameColored(player)} has fully finished loading.{Colors.COLOR_RESET}");
             }
             catch (Exception ex)
             {
                 Logger.Critical($"Error in SaveManager.FinishLoading: {ex.Message}");
                 throw;
             }
         };
    }

    private static void ConvertJsonToSaveData(string data, player player)
    {
        try
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
        catch (Exception ex)
        {
            Logger.Critical($"Error in SaveManager.ConvertJsonToSaveData: {ex.Message}");
            Globals.SaveSystem.NewSave(player);
        }
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
