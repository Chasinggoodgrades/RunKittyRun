using System;
using static WCSharp.Api.Common;

public static class TerrainChanger
{
    public static int[] Terrains { get; private set; }
    public static int[] SafezoneTerrain { get; private set; }
    public static string NormalCliff = "cXc1";
    public static string DirtCliff = "cXc2";
    public static int LastWolfTerrain = 0;
    public static int LastSafezoneTerrain = 0;

    public static void Initialize()
    {
        try
        {
            Terrains = new int[Gamemode.NumberOfRounds];
            SafezoneTerrain = new int[Gamemode.NumberOfRounds];
            Apply(SeasonThemeRegistry.None);
            if (Gamemode.CurrentGameMode != GameMode.Standard) return;
            Apply(SeasonalManager.CurrentTheme);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TerrainChanger.Initialize {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Fills the per-round terrain arrays from a theme and repaints the map.
    /// Replaces the old NoSeasonTerrain()/ChristmasTerrain()/ActivateChristmasTerrain()
    /// trio - works for any theme, including future seasons.
    /// </summary>
    public static void Apply(SeasonTheme theme)
    {
        for (var i = 0; i < Gamemode.NumberOfRounds; i++)
        {
            Terrains[i] = theme.GetTerrainForRound(i);
            SafezoneTerrain[i] = theme.SafezoneTerrain;
        }
        SetTerrain();
    }

    /// <summary>Repaints the terrain for the current round. Call again after a round change.</summary>
    public static void SetTerrain()
    {
        SetWolfRegionTerrain();
        SetSafezoneTerrain();
    }

    // Compatibility wrappers - remove once you've confirmed nothing outside
    // these files calls them directly.
    public static void NoSeason() => Apply(SeasonThemeRegistry.None);
    public static void ActivateChristmasTerrain() => Apply(SeasonThemeRegistry.Christmas);

    private static void SetWolfRegionTerrain()
    {
        var round = Globals.ROUND > 1 ? DifficultyConfig.GetVirtualRound(Globals.ROUND) - 1 : 0;
        ChangeMapTerrain(LastWolfTerrain, Terrains[round]);
        LastWolfTerrain = Terrains[round];
    }

    private static void SetSafezoneTerrain()
    {
        var round = Globals.ROUND > 1 ? DifficultyConfig.GetVirtualRound(Globals.ROUND) - 1 : 0;
        ChangeMapTerrain(LastSafezoneTerrain, SafezoneTerrain[round]);
        LastSafezoneTerrain = SafezoneTerrain[round];
    }

    public static void ChangeMapTerrain(int tileToChange, int newTerrain)
    {
        var mapRect = Globals.WORLD_BOUNDS;
        var minX = mapRect.MinX;
        var minY = mapRect.MinY;
        var maxX = mapRect.MaxX;
        var maxY = mapRect.MaxY;

        for (var x = minX; x <= maxX; x += 128)
        {
            for (var y = minY; y <= maxY; y += 128)
            {
                var type = GetTerrainType(x, y);

                if (type == tileToChange)
                    SetTerrainType(x, y, newTerrain, -1, 1, 1);
            }
        }
    }
}
