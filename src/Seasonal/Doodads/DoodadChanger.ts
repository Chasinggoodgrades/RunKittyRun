

class DoodadChanger
{
    private static SafezoneLanterns: number = FourCC("B005");
    private static ChristmasTree: number = FourCC("B001");
    private static CrystalRed: number = FourCC("B002");
    private static CrystalBlue: number = FourCC("B003");
    private static CrystalGreen: number = FourCC("B004");
    private static Snowglobe: number = FourCC("B006");
    private static Lantern: number = FourCC("B007");
    private static Fireplace: number = FourCC("B008");
    private static Snowman: number = FourCC("B009");
    private static Firepit: number = FourCC("B00A");
    private static Igloo: number = FourCC("ITig");
    private static RedLavaCracks: number = FourCC("B00B");
    private static BlueLavaCracks: number = FourCC("B00C");
    private static SuperChristmasTree: number = FourCC("B00D");
    private static List<int> ChristmasDecor = InitChristmasDecor();
    private static List<destructable> AllDestructables = new();

    public static Initialize()
    {
        CreateInitDestructiables();
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        SeasonalDoodads();
    }

    private static List<int> InitChristmasDecor()
    {
        return new List<int>
        {
            CrystalRed,
            CrystalBlue,
            CrystalGreen,
            Snowglobe,
            Lantern,
            Fireplace,
            Snowman,
            Firepit,
            Igloo,
            RedLavaCracks,
            BlueLavaCracks,
            SuperChristmasTree,
        };
    }

    private static SeasonalDoodads()
    {
        ChristmasDoodads();
    }

    public static NoSeasonDoodads()
    {
        ReplaceDoodad(SafezoneLanterns, 1.0);
        ShowSeasonalDoodads(false);
    }

    public static ChristmasDoodads()
    {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return;
        ReplaceDoodad(ChristmasTree, 2.5);
        ShowSeasonalDoodads(true);
    }

    private static ReplaceDoodad(newType: number, scale: number)
    {
        List<(x: number, y: number)> positions = new();

        for (let des in AllDestructables)
        {
            positions.Add((des.X, des.Y));
            des.Dispose();
        }

        AllDestructables.Clear();

        for (let pos in positions)
        {
            let newDestructible = destructable.CreateDead(newType, pos.x, pos.y, 0, scale);
            AllDestructables.Add(newDestructible);
        }
        GC.RemoveList( positions); // TODO; Cleanup:         GC.RemoveList(ref positions);
    }

    private static CreateInitDestructiables()
    {
        let counter: number = 0;

        for (let safeZone in Globals.SAFE_ZONES)
        {
            let rect = safeZone.Rect_;

            let minX = rect.MinX;
            let minY = rect.MinY;
            let maxX = rect.MaxX;
            let maxY = rect.MaxY;

            if (counter % 4 != 0)
                AllDestructables.Add(destructable.CreateDead(SafezoneLanterns, minX, maxY)); // Top left corner
            if (counter % 4 != 1 && counter != 14)
                AllDestructables.Add(destructable.CreateDead(SafezoneLanterns, maxX, maxY)); // Top right corner
            if (counter % 4 != 2)
                AllDestructables.Add(destructable.CreateDead(SafezoneLanterns, maxX, minY)); // Bottom right corner
            if (counter % 4 != 3 && counter != 0)
                AllDestructables.Add(destructable.CreateDead(SafezoneLanterns, minX, minY)); // Bottom left corner

            counter++;
        }
    }

    public static ShowSeasonalDoodads(show: boolean = false)  { return EnumDestructablesInRect(Globals.WORLD_BOUNDS, null, () => HideDoodads(show)); }

    private static HideDoodads(show: boolean)
    {
        let des = GetEnumDestructable();
        if (ChristmasDecor.Contains(des.Type))
            des.SetVisibility(show);
    }
}
