﻿using System;
using System.Collections.Generic;
using WCSharp.Api;

public class SaveManager
{
    private SyncSaveLoad syncSaveLoad;
    private static string SavePath { get; } = "Run-Kitty-Run";
    public static Dictionary<player, KittyData> SaveData { get; set; } = new Dictionary<player, KittyData>();

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
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Globals.SaveSystem.Save(player);
        }
    }

    public void Save(player player)
    {
        var playerData = SaveData[player];
        if (!player.IsLocal) return;
        syncSaveLoad.WriteFileObjects($"{SavePath}/{player.Name}.txt", playerData);
    }

    public void Load(player player)
    {
        syncSaveLoad.Read($"{SavePath}/{player.Name}.txt", player, FinishLoading());
    }

    public void LoadAll()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Load(player);
        }
    }

    private void NewSave(player player)
    {
        SaveData[player] = new KittyData();
        SaveData[player].PlayerName = player.Name;
        Save(player);
        if (!Gamemode.IsGameModeChosen) return;
        Globals.ALL_KITTIES[player].SaveData = SaveData[player];
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
                 player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}No save found. Creating new save.|r");
                 return;
             }
             ConvertJsonToSaveData(data, player);
         };
    }

    private static void ConvertJsonToSaveData(string data, player player)
    {
        if (!WCSharp.Json.JsonConvert.TryDeserialize(data, out KittyData kittyData))
        {
            player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}Failed to deserialize data. Creating new save.|r");
            Globals.SaveSystem.NewSave(player);
            return;
        }
        SaveData[player] = kittyData;
    }
}