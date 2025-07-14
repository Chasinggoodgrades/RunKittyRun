using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DoodadChanger
{
    private static int SafezoneLanterns = FourCC("B005");
    private static int ChristmasTree = FourCC("B001");
    private static int CrystalRed = FourCC("B002");
    private static int CrystalBlue = FourCC("B003");
    private static int CrystalGreen = FourCC("B004");
    private static int Snowglobe = FourCC("B006");
    private static int Lantern = FourCC("B007");
    private static int Fireplace = FourCC("B008");
    private static int Snowman = FourCC("B009");
    private static int Firepit = FourCC("B00A");
    private static int Igloo = FourCC("ITig");
    private static int RedLavaCracks = FourCC("B00B");
    private static int BlueLavaCracks = FourCC("B00C");
    private static int SuperChristmasTree = FourCC("B00D");
    private static List<int> ChristmasDecor = InitChristmasDecor();
    private static List<destructable> AllDestructables { get; set; } = new();

    public static void Initialize()
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

    private static void SeasonalDoodads()
    {
        ChristmasDoodads();
    }

    public static void NoSeasonDoodads()
    {
        ReplaceDoodad(SafezoneLanterns, 1.0f);
        ShowSeasonalDoodads(false);
    }

    public static void ChristmasDoodads()
    {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return;
        ReplaceDoodad(ChristmasTree, 2.5f);
        ShowSeasonalDoodads(true);
    }

    private static void ReplaceDoodad(int newType, float scale)
    {
        List<(float x, float y)> positions = new();

        foreach (var des in AllDestructables)
        {
            positions.Add((des.X, des.Y));
            des.Dispose();
        }

        AllDestructables.Clear();

        foreach (var pos in positions)
        {
            var newDestructible = destructable.CreateDead(newType, pos.x, pos.y, 0, scale);
            AllDestructables.Add(newDestructible);
        }
        GC.RemoveList(ref positions);
    }

    private static void CreateInitDestructiables()
    {
        int counter = 0;

        foreach (var safeZone in Globals.SAFE_ZONES)
        {
            var rect = safeZone.Rect_;

            var minX = rect.MinX;
            var minY = rect.MinY;
            var maxX = rect.MaxX;
            var maxY = rect.MaxY;

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

    public static void ShowSeasonalDoodads(bool show = false) => EnumDestructablesInRect(Globals.WORLD_BOUNDS, null, () => HideDoodads(show));

    private static void HideDoodads(bool show)
    {
        var des = GetEnumDestructable();
        if (ChristmasDecor.Contains(des.Type))
            des.SetVisibility(show);
    }
}
