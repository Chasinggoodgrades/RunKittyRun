using Source;
using WCSharp.SaveLoad;
using WCSharp.Api;
using static WCSharp.Api.Common;
using WCSharp.Json;
using System.Collections.Generic;
using System;
using System.Diagnostics;

public static class SaveManager
{
    public static Dictionary<player, SaveData> PlayerSaveData { get; } = new Dictionary<player, SaveData>();
    private static SaveSystem<SaveData> saveSystem;
    public static void Initialize()
    {
        saveSystem = new SaveSystem<SaveData>(new SaveSystemOptions
        {
            Hash1 = 826927,
            Hash2 = 945673,
            Salt = "QWNoZXMjMTgxNw",
            BindSavesToPlayerName = true,
            SaveFolder = "Run-Kitty-Run",
        });

        // load all..
        //GetStats(Player(0
        foreach (var p in Globals.ALL_PLAYERS)
        {
            if(p.Controller != mapcontrol.User) continue;
            saveSystem.OnSaveLoaded += SaveManager_OnSaveLoaded;
            saveSystem.Load(p);
            //if(Program.Debug) Console.WriteLine("Loading... " + p.Name);
        }
    }

    public static void SaveManager_OnSaveLoaded(SaveData save, LoadResult loadResult)
    {
        var player = save.GetPlayer();
        PlayerSaveData[save.GetPlayer()] = save;
        if (loadResult == LoadResult.NewSave)
        {
            save.Stats = new Dictionary<KittyType, KittyData>();
            NewSave(player);
        }
        else
        {
            var stats = save.Stats[KittyType.Kitty];
        }
    }

    public static void SaveAll()
    {
        foreach (var save in PlayerSaveData.Values)
            Save(save);
    }
    public static void Save(SaveData save) => saveSystem.Save(save);
    public static void Save(player Player) => Save(PlayerSaveData[Player]);
    public static void NewSave(player Player)
    {
        var kitty = KittyType.Kitty;
        var save = PlayerSaveData[Player];
        if(!save.Stats.TryGetValue(kitty, out var kittyData))
        {
            kittyData = new KittyData();
            save.Stats[kitty] = kittyData;
        }
        Save(save);
    }
}