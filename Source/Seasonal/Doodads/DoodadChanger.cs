using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DoodadChanger
{
    private static readonly int SafezoneLanterns = FourCC("B005");
    private static readonly List<destructable> AllDestructables = new();
    private static SeasonTheme _theme = SeasonThemeRegistry.None;

    public static void Initialize()
    {
        CreateInitDestructables();
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        Apply(SeasonalManager.CurrentTheme);
    }

    /// <summary>
    /// Swaps the safezone decoration for the theme's version and shows/hides its
    /// ambient decor. Replaces the old ChristmasDoodads()/NoSeasonDoodads() pair -
    /// works for any theme, including future seasons.
    /// </summary>
    public static void Apply(SeasonTheme theme)
    {
        _theme = theme;
        ReplaceSafezoneDecor(theme.SafezoneDecorType, theme.SafezoneDecorScale);
        ShowSeasonalDoodads(theme.Season != HolidaySeasons.None);
    }

    // Compatibility wrappers - remove once you've confirmed nothing outside
    // these files calls them directly.
    public static void NoSeasonDoodads() => Apply(SeasonThemeRegistry.None);
    public static void ChristmasDoodads() => Apply(SeasonThemeRegistry.Christmas);

    private static void ReplaceSafezoneDecor(int newType, float scale)
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

    private static void CreateInitDestructables()
    {
        var counter = 0;

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

    public static void ShowSeasonalDoodads(bool show = false) =>
        EnumDestructablesInRect(Globals.WORLD_BOUNDS, null, () => HideDoodads(show));

    private static void HideDoodads(bool show)
    {
        var des = GetEnumDestructable();

        // Only touch destructables that are seasonal decor for SOME theme - leave
        // unrelated map doodads alone. Checking the full registry (not just the
        // active theme) is what makes this correct when switching AWAY from a
        // season: the active theme's own list is empty at that point, so checking
        // only against it would never find anything to hide.
        if (!SeasonThemeRegistry.IsSeasonalDecor(des.Type)) return;

        Console.WriteLine("seasonal decor: " + des.Type + " belongs to active theme: " + ContainsType(_theme.DecorTypes, des.Type));
        Console.WriteLine(show ? "showing" : "hiding");
        var belongsToActiveTheme = ContainsType(_theme.DecorTypes, des.Type);
        des.SetVisibility(show && belongsToActiveTheme);
    }

    private static bool ContainsType(int[] types, int type)
    {
        for (var i = 0; i < types.Length; i++)
        {
            if (types[i] == type) return true;
        }
        return false;
    }
}
