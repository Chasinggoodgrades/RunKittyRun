using System;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class SaveManager
{
    private SyncSaveLoad syncSaveLoad;
    public static Dictionary<player, KittyData> SaveData { get; set; } = new Dictionary<player, KittyData>();

    public SaveManager()
    {
        syncSaveLoad = SyncSaveLoad.Instance;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            SaveData.Add(player, new KittyData());
        }
    }

    public static void Initialize()
    {
        Globals.SaveSystem = new SaveManager();
    }

    public void Save(player player)
    {
        var playerData = SaveData[player];
        if (!player.IsLocal) return;
        syncSaveLoad.WriteFileObjects($"Run-Kitty-Run/{player.Name}.txt", playerData);
    }

    public void Load(player player)
    {
        syncSaveLoad.Read($"Run-Kitty-Run/{player.Name}.txt", player, ConvertingSaveData());
    }

    public void LoadAll()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Load(player);
        }
    }

    private static Action<FilePromise> ConvertingSaveData()
    {
        return (promise) =>
         {
             var data = promise.DecodedString;
             var player = promise.SyncOwner;
             ConvertJsonToSaveData(data, player);
         };
    }

    private static void ConvertJsonToSaveData(string data, player player)
    {
        var playerData = SaveData[player];
        
        // read the json string and convert


    }
}
