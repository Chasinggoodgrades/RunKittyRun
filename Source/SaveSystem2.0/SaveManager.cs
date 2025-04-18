﻿using System;
using System.Collections.Generic;
using WCSharp.Api;

public class SaveManager
{
    private SyncSaveLoad syncSaveLoad;
    private static string SavePath { get; } = "Run-Kitty-Run";
    public static Dictionary<player, KittyData> SaveData { get; set; } = new Dictionary<player, KittyData>();
    public static List<player> PlayersLoaded { get; } = new List<player>();
    public SaveManager()
    {
        syncSaveLoad = SyncSaveLoad.Instance;
        foreach (var player in Globals.ALL_PLAYERS) SaveData.Add(player, null);
        LoadAll();
    }

    public static void Initialize()
    {
        Globals.SaveSystem = new SaveManager();
    }

    public static void SaveAll()
    {
        var date = DateTimeManager.DateTime.ToString();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if (player.Controller == mapcontrol.Computer) continue;
            if (player.SlotState != playerslotstate.Playing) continue;
            SaveData[player].Date = date;
            Globals.SaveSystem.Save(player);
        }
    }

    public void Save(player player)
    {
        try
        {
            var date = DateTimeManager.DateTime.ToString();
            var playerData = SaveData[player];
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

    private void SaveAllDataToFile(player player)
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
            if (!SaveData.ContainsKey(player) || SaveData[player] == null)
                Globals.SaveSystem.NewSave(player); // Ensure save data exists for this player before saving.
            SaveData[player].Date = date;
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
            foreach (var player in Globals.ALL_PLAYERS)
            {
                if (player.Controller == mapcontrol.Computer) continue;
                if (player.SlotState != playerslotstate.Playing) continue;
                Load(player);
            }
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
            if (player.SlotState != playerslotstate.Playing) return;
            SaveData[player] = new KittyData();
            SaveData[player].PlayerName = player.Name;
            if (!PlayersLoaded.Contains(player)) PlayersLoaded.Add(player);
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
             var data = promise.DecodedString;
             var player = promise.SyncOwner;
             if (data.Length < 1)
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
        SaveData[player] = kittyData;
        if (!PlayersLoaded.Contains(player)) PlayersLoaded.Add(player);
    }

    public static KittyData GetKittyData(player player)
    {
        if (SaveData.TryGetValue(player, out KittyData kittyData) && kittyData != null)
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
