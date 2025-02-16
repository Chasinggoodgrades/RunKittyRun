using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using WCSharp.Events;
using static WCSharp.Api.Common;

public static class ItemSpawner
{
    private static List<int> SpawnableItems;
    private static List<int> Kibbles;
    private static List<item> TrackItems;
    private static List<Kibble> TrackKibbles;
    private static float ITEM_SPAWN_INTERVAL = 45.0f;
    public static int NUMBER_OF_ITEMS = 15;
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        SpawnableItems = StandardItems();
        TrackItems = new List<item>();
        TrackKibbles = new List<Kibble>();
        RegisterEvent();
        SpawnItems();
    }

    private static void RegisterEvent()
    {
        PeriodicEvents.AddPeriodicEvent(SpawnItems(), ITEM_SPAWN_INTERVAL);
    }

    private static Func<bool> SpawnItems()
    {
        return () =>
        {
            RemoveSpawnedItems();
            for(var i = 0; i < NUMBER_OF_ITEMS; i++)
            {
                TrackItems.Add(SpawnRegularItems());
                SpawnKibble();
            }
            return true;
        };
    }

    private static void RemoveSpawnedItems()
    {
        for (int i = 0; i < TrackItems.Count; i++)
        {
            var item = TrackItems[i];
            if (item.IsOwned) continue;
            item.Dispose();
            item = null;
        }

        for (int i = 0; i < TrackKibbles.Count; i++)
        {
            var kibble = TrackKibbles[i];
            kibble.Dispose();
            kibble = null;
        }

        TrackItems.Clear();
        TrackKibbles.Clear();
    }


    private static void SpawnKibble()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var kibble = new Kibble();
        TrackKibbles.Add(kibble);
    }

    private static item SpawnRegularItems()
    {
        var random = GetRandomInt(0, SpawnableItems.Count - 1);
        var item = SpawnableItems[random];
        var regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        var region = RegionList.WolfRegions[regionNumber];
        var x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        var y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);

        return CreateItem(item, x, y);
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