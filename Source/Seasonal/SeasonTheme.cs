using System;

/// <summary>
/// All the data that makes one holiday season look and feel different from another.
/// To add a new season: write one SeasonTheme in SeasonThemeRegistry and add it to the
/// Seasonal list. No "Changer" class needs to change.
/// </summary>
public sealed class SeasonTheme
{
    public HolidaySeasons Season { get; set; }

    // Calendar - which real-world months this season is active during.
    public int[] ActiveMonths { get; set; } = new int[0];

    // Terrain - one tile per round; the last entry repeats if there are more rounds
    // than entries (see GetTerrainForRound).
    public int[] TerrainByRound { get; set; } = new int[0];
    public int SafezoneTerrain { get; set; }

    // Doodads
    public int SafezoneDecorType { get; set; }
    public float SafezoneDecorScale { get; set; } = 1.0f;
    /// <summary>Ambient decorations (crystals, snowmen, etc.) only visible during this season.</summary>
    public int[] DecorTypes { get; set; } = new int[0];

    // Shop
    public int VendorSkin { get; set; }

    // Kibble item type that spawns
    public int[] KibbleTypes { get; set; } = new int[0];

    // Weather / minimap
    public int? WeatherEffect { get; set; }
    public float TimeOfDay { get; set; } = 12f;
    public string MinimapTexture { get; set; } = "war3mapMap.blp";

    // Awards - leave FreebieRewardNames empty for seasons with no giveaway.
    public string FreebieAnnouncement { get; set; }
    public string[] FreebieRewardNames { get; set; } = new string[0];

    // Wolves - applied automatically via Wolf.SetSkin(), see
    // SeasonalManager.ApplyThemeSideEffects. Leave at the default for seasons that
    // don't reskin wolves.
    public int WolfSkin { get; set; } = Constants.UNIT_CUSTOM_DOG;

    /// <summary>Runs once when this theme becomes the active one. Use it to set up
    /// anything the plain data fields above can't express.</summary>
    public Action OnActivate { get; set; }

    /// <summary>Runs once when this theme stops being active (a different theme is
    /// taking over). Use it to tear down whatever OnActivate/OnRoundChange created,
    /// so effects don't leak from one theme into the next.</summary>
    public Action OnDeactivate { get; set; }

    /// <summary>Runs every time TerrainChanger.SetTerrain() repaints - including the
    /// initial activation and every later round change. Only needed for themes with
    /// per-round behavior beyond the TerrainByRound tile swap.</summary>
    public Action OnRoundChange { get; set; }

    public int GetTerrainForRound(int round)
    {
        if (TerrainByRound.Length == 0) return 0;
        var index = round < TerrainByRound.Length ? round : TerrainByRound.Length - 1;
        return TerrainByRound[index];
    }

    public bool IsActiveInMonth(int month)
    {
        for (var i = 0; i < ActiveMonths.Length; i++)
        {
            if (ActiveMonths[i] == month) return true;
        }
        return false;
    }
}
