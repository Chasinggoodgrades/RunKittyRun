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

        saveSystem.OnSaveLoaded += SaveManager_OnSaveLoaded;

        foreach(var player in WCSharp.Shared.Util.EnumeratePlayers())
        {
            saveSystem.Load(player);
        }
    }

    public static void SaveManager_OnSaveLoaded(SaveData save, LoadResult loadResult)
    {
        try
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
                EnsureData(player);
                Save(player);
            }
        }
        catch (Exception e)
        {
            if(Program.Debug) Console.WriteLine(e.Message);
            throw;
        }
    }

    private static void EnsureData(player player)
    {
        foreach(var selectData in Enum.GetValues(typeof(SelectedData)))
        {
            if (!PlayerSaveData[player].Stats[KittyType.Kitty].SelectedData.ContainsKey((SelectedData)selectData))
                PlayerSaveData[player].Stats[KittyType.Kitty].SelectedData[(SelectedData)selectData] = -1;
        }

        foreach(var gamestat in Enum.GetValues(typeof(StatTypes)))
        {
            if (!PlayerSaveData[player].Stats[KittyType.Kitty].GameStats.ContainsKey((StatTypes)gamestat))
                PlayerSaveData[player].Stats[KittyType.Kitty].GameStats[(StatTypes)gamestat] = 0;
        }

        foreach(var time in Enum.GetValues(typeof(RoundTimes)))
        {
            if (!PlayerSaveData[player].Stats[KittyType.Kitty].GameTimes.ContainsKey((RoundTimes)time))
                PlayerSaveData[player].Stats[KittyType.Kitty].GameTimes[(RoundTimes)time] = 0;
        }

        foreach (var award in Enum.GetValues(typeof(Awards)))
        {
            if (!PlayerSaveData[player].Stats[KittyType.Kitty].GameAwards.ContainsKey((Awards)award))
                PlayerSaveData[player].Stats[KittyType.Kitty].GameAwards[(Awards)award] = 0;
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