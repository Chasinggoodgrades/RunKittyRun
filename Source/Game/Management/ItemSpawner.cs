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
    private static float ITEM_SPAWN_INTERVAL = 45.0f;
    private static int NUMBER_OF_ITEMS = 15;
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        SpawnableItems = StandardItems();
        Kibbles = KibbleItems();
        TrackItems = new List<item>();
        RegisterEvent();
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
                TrackItems.Add(SpawnKibble());
            }
            return true;
        };
    }

    private static void RemoveSpawnedItems()
    {
        foreach(var item in TrackItems)
            if(!item.IsOwned) RemoveItem(item);
        TrackItems.Clear();
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

    private static item SpawnKibble()
    {
        var random = GetRandomInt(0, SpawnableItems.Count - 1);
        var item = Kibbles[random];
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

    private static List<int> KibbleItems()
    {
        return new List<int>
        {
            Constants.ITEM_KIBBLE,
            Constants.ITEM_KIBBLE_GREEN,
            Constants.ITEM_KIBBLE_RED,
            Constants.ITEM_KIBBLE_PURPLE,
            Constants.ITEM_KIBBLE_TEAL
        };
    }

}