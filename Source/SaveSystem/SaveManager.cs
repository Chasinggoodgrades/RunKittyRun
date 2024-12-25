using Source;
using WCSharp.SaveLoad;
using WCSharp.Api;
using System.Collections.Generic;
using System;

public static class SaveManager
{
    public static Dictionary<player, SaveData> PlayerSaveData { get; } = new Dictionary<player, SaveData>();
    private static SaveSystem<SaveData> saveSystem;
    public static void Initialize()
    {
        saveSystem = new SaveSystem<SaveData>(new SaveSystemOptions
        {
            Hash1 = 39667,
            Hash2 = 2861,
            Salt = "QWNoZXMjMTgxNw",
            BindSavesToPlayerName = true,
            SaveFolder = "Run-Kitty-Run",
            AttemptToLoadNewerVersions = true,
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
            PlayerSaveData[save.GetPlayer()] = save;
            if (loadResult == LoadResult.NewSave)
            {
                NewSave(save.GetPlayer());
            }
            if (loadResult.Failed())             {
                if(Program.Debug) Console.WriteLine($"Failed to load save for {save.GetPlayer().Name}");
                NewSave(save.GetPlayer());
            }
            else
            {
                var stats = save.Stats;
                Save(save);
            }
        }
        catch (Exception e)
        {
            if(Program.Debug) Console.WriteLine(e.Message);
            throw;
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
        var save = PlayerSaveData[Player];
        save.Stats = new KittyData();
        Save(save);
    }
}