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

    /// <summary>The theme currently applied. Tracked so Apply() knows whose
    /// OnDeactivate hook to run before switching to a new theme.</summary>
    public static SeasonTheme CurrentTheme { get; private set; }

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
    /// Fills the per-round terrain arrays from a theme, repaints the map, and runs the
    /// theme's override hooks. Replaces the old NoSeasonTerrain()/ChristmasTerrain()/
    /// ActivateChristmasTerrain() trio - works for any theme, including future seasons,
    /// and for themes that override behavior instead of (or alongside) plain terrain,
    /// like Halloween's lightning-ringed safezones.
    /// </summary>
    public static void Apply(SeasonTheme theme)
    {
        if (CurrentTheme != null && CurrentTheme != theme)
        {
            CurrentTheme.OnDeactivate?.Invoke();
        }

        for (var i = 0; i < Gamemode.NumberOfRounds; i++)
        {
            Terrains[i] = theme.GetTerrainForRound(i);
            SafezoneTerrain[i] = theme.SafezoneTerrain;
        }

        CurrentTheme = theme;
        theme.OnActivate?.Invoke();
        SetTerrain();
    }

    /// <summary>Repaints the terrain for the current round and runs the active theme's
    /// OnRoundChange hook, if any. Call again after a round change.</summary>
    public static void SetTerrain()
    {
        SetWolfRegionTerrain();
        SetSafezoneTerrain();
        CurrentTheme?.OnRoundChange?.Invoke();
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
