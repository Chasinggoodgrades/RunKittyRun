using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ItemSpawner
{
    public static List<Kibble> TrackKibbles;

    private static List<int> SpawnableItems;
    private static List<item> TrackItems;
    private static timer SpawnTimer = timer.Create();
    private static float ITEM_SPAWN_INTERVAL = 45.0f;
    public static int NUMBER_OF_ITEMS = 15;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        SpawnableItems = StandardItems();
        TrackItems = new List<item>();
        TrackKibbles = new List<Kibble>();
        RegisterEvent();
        SpawnItems();
    }

    private static void RegisterEvent()
    {
        SpawnTimer.Start(ITEM_SPAWN_INTERVAL, true, SpawnItems);
    }

    private static void SpawnItems()
    {
        try
        {
            RemoveSpawnedItems();
            for (var i = 0; i < NUMBER_OF_ITEMS; i++)
            {
                SpawnRegularItems();
                SpawnKibble();
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"ItemSpawner: SpawnItems: {e.Message}");
        }
    }

    private static void RemoveSpawnedItems()
    {
        for (int i = 0; i < TrackItems.Count; i++)
        {
            var item = TrackItems[i];
            if (item.IsOwned) continue;
            item.Dispose();
        }

        TrackItems.Clear();

        if (KibbleEvent.IsEventActive()) return;

        foreach(var kibble in TrackKibbles)
        {
            if (kibble.Item == null) continue; // alrady been __destroyed.
            kibble.__destroy();
        }

        TrackKibbles.Clear();
    }


    private static void SpawnKibble()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (KibbleEvent.IsEventActive()) return;

        var kibble = MemoryHandler.GetEmptyObject<Kibble>();
        kibble.SpawnKibble();
        TrackKibbles.Add(kibble);
    }

    private static void SpawnRegularItems()
    {
        var random = GetRandomInt(0, SpawnableItems.Count - 1);
        var item = SpawnableItems[random];
        var regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        var region = RegionList.WolfRegions[regionNumber];
        var x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        var y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);
        var i = CreateItem(item, x, y);
        TrackItems.Add(i);
    }

    private static List<int> StandardItems()
    {
        return new List<int>
        {
            Constants.ITEM_ADRENALINE_POTION,
            Constants.ITEM_HEALING_WATER,
            Constants.ITEM_ELIXIR
        };
    }

}
