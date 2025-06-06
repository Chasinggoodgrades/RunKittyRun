﻿using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ItemSpawner
{
    public static List<Kibble> TrackKibbles;
    public static List<item> TrackItems;

    private static List<int> SpawnableItems;
    private static timer SpawnTimer = timer.Create();
    private static float ITEM_SPAWN_INTERVAL = 45.0f;
    public static int NUMBER_OF_ITEMS { get; set; } = 15;

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
            }
            SpawnKibble(NUMBER_OF_ITEMS);

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

        for (int i = 0; i < TrackKibbles.Count; i++)
        {
            var kibble = TrackKibbles[i];
            if (kibble.Item == null) continue; // Already been __destroyed.
            kibble.Dispose();
        }

        TrackKibbles.Clear();
    }

    public static void SpawnKibble(int numberOfItems)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (!Kibble.SpawningKibble) return;
        if (KibbleEvent.IsEventActive()) return;

        for (int i = 0; i < numberOfItems; i++)
        {
            var kibble = ObjectPool.GetEmptyObject<Kibble>();
            kibble.SpawnKibble();
            TrackKibbles.Add(kibble);
        }
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
