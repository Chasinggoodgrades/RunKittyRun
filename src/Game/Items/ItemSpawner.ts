

class ItemSpawner
{
    public static List<Kibble> TrackKibbles;
    public static List<item> TrackItems;

    private static List<int> SpawnableItems;
    private static SpawnTimer: timer = timer.Create();
    private static ITEM_SPAWN_INTERVAL: number = 45.0;
    public static NUMBER_OF_ITEMS: number = 15;

    public static Initialize()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        SpawnableItems = StandardItems();
        TrackItems = new List<item>();
        TrackKibbles = new List<Kibble>();
        RegisterEvent();
        SpawnItems();
    }

    private static RegisterEvent()
    {
        SpawnTimer.Start(ITEM_SPAWN_INTERVAL, true, SpawnItems);
    }

    private static SpawnItems()
    {
        try
        {
            RemoveSpawnedItems();
            for (let i = 0; i < NUMBER_OF_ITEMS; i++)
            {
                SpawnRegularItems();
            }
            SpawnKibble(NUMBER_OF_ITEMS);

        }
        catch (e: Error)
        {
            Logger.Critical("ItemSpawner: SpawnItems: {e.Message}");
        }
    }

    private static RemoveSpawnedItems()
    {
        for (let i: number = 0; i < TrackItems.Count; i++)
        {
            let item = TrackItems[i];
            ItemSpatialGrid.UnregisterItem(item);
            if (item.IsOwned) continue;
            item.Dispose();
        }

        TrackItems.Clear();

        if (KibbleEvent.IsEventActive()) return;

        for (let i: number = 0; i < TrackKibbles.Count; i++)
        {
            let kibble = TrackKibbles[i];
            ItemSpatialGrid.UnregisterKibble(kibble);
            if (kibble.Item == null) continue; // Already been __destroyed.
            kibble.Dispose();
        }

        TrackKibbles.Clear();
    }

    public static SpawnKibble(numberOfItems: number)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (!Kibble.SpawningKibble) return;
        if (KibbleEvent.IsEventActive()) return;

        for (let i: number = 0; i < numberOfItems; i++)
        {
            let kibble = ObjectPool.GetEmptyObject<Kibble>();
            kibble.SpawnKibble();
            TrackKibbles.Add(kibble);
        }
    }

    private static SpawnRegularItems()
    {
        let random = GetRandomInt(0, SpawnableItems.Count - 1);
        let item = SpawnableItems[random];
        let regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        let region = RegionList.WolfRegions[regionNumber];
        let x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        let y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);
        let i = CreateItem(item, x, y);
        TrackItems.Add(i);
        ItemSpatialGrid.RegisterItem(i);
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
