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

    // Weather / minimap
    public int? WeatherEffect { get; set; }
    public float TimeOfDay { get; set; } = 12f;
    public string MinimapTexture { get; set; } = "war3mapMap.blp";

    // Awards - leave FreebieRewardNames empty for seasons with no giveaway.
    public string FreebieAnnouncement { get; set; }
    public string[] FreebieRewardNames { get; set; } = new string[0];

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
