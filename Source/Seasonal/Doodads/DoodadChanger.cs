using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class DoodadChanger
{
    private static int SafezoneLanterns { get; set; } = FourCC("B005");
    private static int ChristmasTree { get; set; } = FourCC("B001");
    private static List<destructable> AllDestructables { get; set; } = new();
    public static void Initialize()
    {
        CreateInitDestructiables();
        if (Gamemode.CurrentGameMode != "Standard") return;
        SeasonalDoodads();
    }

    private static void SeasonalDoodads()
    {
        ChristmasDoodads();
    }

    public static void NoSeasonDoodads() => ReplaceDoodad(SafezoneLanterns, 1.0f);

    public static void ChristmasDoodads()
    {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return;
        ReplaceDoodad(ChristmasTree, 2.5f);
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
        positions.Clear();
    }


    private static void CreateInitDestructiables()
    {
        int counter = 0;

        foreach (var safeZone in Globals.SAFE_ZONES)
        {
            var rect = safeZone.r_Rect;

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

}