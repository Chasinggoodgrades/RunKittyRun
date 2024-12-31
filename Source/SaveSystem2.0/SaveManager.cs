using System;
using System.Collections.Generic;
using WCSharp.Api;

public class SaveManager
{
    private SyncSaveLoad syncSaveLoad;
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
        syncSaveLoad.WriteFileObjects($"Run-Kitty-Run/{player.Name}.txt", playerData);
    }

    public void Load(player player)
    {
        syncSaveLoad.Read($"Run-Kitty-Run/{player.Name}.txt", player, FinishLoading());
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
                 return;
             }
             ConvertJsonToSaveData(data, player);
         };
    }

    private static void ConvertJsonToSaveData(string data, player player)
    {
        if (!WCSharp.Json.JsonConvert.TryDeserialize(data, out KittyData kittyData))
        {
            Globals.SaveSystem.NewSave(player);
            return;
        }
        SaveData[player] = kittyData;
    }
}
