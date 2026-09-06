using static WCSharp.Api.Common;

/// <summary>
/// The single place that defines what each season looks like. Adding or tweaking a
/// season is a matter of writing/editing one SeasonTheme here - no other class needs
/// to know a new season exists.
/// </summary>
public static class SeasonThemeRegistry
{
    public static readonly SeasonTheme None = BuildNone();
    public static readonly SeasonTheme Christmas = BuildChristmas();
    public static readonly SeasonTheme Halloween = BuildHalloween();

    /// <summary>
    /// Every calendar-driven season, checked in this order. Add a new theme here
    /// (and only here) to make it eligible to turn on automatically by month.
    /// </summary>
    public static readonly SeasonTheme[] Seasonal =
    {
        Christmas,
        Halloween,
        // Easter,
        // Valentines,
    };

    public static SeasonTheme Get(HolidaySeasons season)
    {
        if (season == HolidaySeasons.None) return None;
        for (var i = 0; i < Seasonal.Length; i++)
        {
            if (Seasonal[i].Season == season) return Seasonal[i];
        }
        return None;
    }

    /// <summary>
    /// True if this doodad type is ambient decor for ANY season, not just the active
    /// one. DoodadChanger uses this to decide whether a destructable is its business
    /// at all before deciding whether to show or hide it.
    /// </summary>
    public static bool IsSeasonalDecor(int doodadType)
    {
        for (var i = 0; i < Seasonal.Length; i++)
        {
            var decor = Seasonal[i].DecorTypes;
            for (var j = 0; j < decor.Length; j++)
            {
                if (decor[j] == doodadType) return true;
            }
        }
        return false;
    }

    private static SeasonTheme BuildNone()
    {
        return new SeasonTheme
        {
            Season = HolidaySeasons.None,
            TerrainByRound = new[]
            {
                FourCC("Lgrd"),
                FourCC("Ygsb"),
                FourCC("Vgrs"),
                FourCC("Xhdg"),
                FourCC("Ywmb"),
            },
            SafezoneTerrain = FourCC("Xblm"),
            SafezoneDecorType = FourCC("B005"), // Lanterns
            SafezoneDecorScale = 1.0f,
            VendorSkin = Constants.UNIT_KITTY_VENDOR,
            KibbleTypes = new[]
            {
                Constants.ITEM_KIBBLE,
                Constants.ITEM_KIBBLE_TEAL,
                Constants.ITEM_KIBBLE_GREEN,
                Constants.ITEM_KIBBLE_PURPLE,
                Constants.ITEM_KIBBLE_RED,
                Constants.ITEM_KIBBLE_YELLOW,
            },
            WeatherEffect = null,
            TimeOfDay = 12f,
            MinimapTexture = "war3mapMap.blp",
        };
    }

    private static SeasonTheme BuildChristmas()
    {
        return new SeasonTheme
        {
            Season = HolidaySeasons.Christmas,
            ActiveMonths = new[] { 12 },
            TerrainByRound = new[] { FourCC("Nrck") },
            SafezoneTerrain = FourCC("Ibsq"), // Icecrown Glacier (black squares)
            SafezoneDecorType = FourCC("B001"), // Christmas tree
            SafezoneDecorScale = 2.5f,
            DecorTypes = new[]
            {
                FourCC("B002"), // Crystal - red
                FourCC("B003"), // Crystal - blue
                FourCC("B004"), // Crystal - green
                FourCC("B006"), // Snowglobe
                FourCC("B007"), // Lantern
                FourCC("B008"), // Fireplace
                FourCC("B009"), // Snowman
                FourCC("B00A"), // Firepit
                FourCC("ITig"), // Igloo
                FourCC("B00B"), // Red lava cracks
                FourCC("B00C"), // Blue lava cracks
                FourCC("B00D"), // Super Christmas tree


                //// These will remain visible in all seasons..
                //FourCC("YZef"),
                //FourCC("LOsm"),
                //FourCC("YOr2")
            },
            VendorSkin = Constants.UNIT_SANTA,
            KibbleTypes = new[] { Constants.ITEM_PRESENT },
            WeatherEffect = WeatherEffects.Snow,
            TimeOfDay = 23f,
            MinimapTexture = "snowMap.blp",
            FreebieAnnouncement = $"{Colors.COLOR_YELLOW}Special thanks to everyone for playing this holiday season! All players have been awarded the snow trail and snow wings from 2023 :){Colors.COLOR_RESET}",
            FreebieRewardNames = new[]
            {
                nameof(Globals.GAME_AWARDS_SORTED.Trails.SnowTrail2023),
                nameof(Globals.GAME_AWARDS_SORTED.Wings.SnowWings2023),
            },
        };
    }

    private static SeasonTheme BuildHalloween()
    {
        return new SeasonTheme
        {
            Season = HolidaySeasons.Halloween,
            ActiveMonths = new[] { 10 },
            TerrainByRound = new[] { FourCC("Irbk") }, // uniform across every round
            SafezoneTerrain = FourCC("Oaby"),
            SafezoneDecorType = FourCC("B007"),
            SafezoneDecorScale = 2.5f,
            DecorTypes = new[]
            {
                FourCC("B007"), // Lantern
                FourCC("B00L"), // Cauldron with heads
                FourCC("B00F"), // Skull pile
                FourCC("B00J"), // Sitting corpse
                FourCC("B00K"), // Impaled corpse
                FourCC("B008"), // Fireplace
                FourCC("B00M"), // Blue fire
                FourCC("B00N"), // Fire
                FourCC("B00B"), // Red lava cracks
                FourCC("B00C"), // Blue lava cracks
                FourCC("B00E"), // Demonic footprints
                FourCC("B00O"), // Bats
                FourCC("B00P"), // Fish Dead
                FourCC("B00Q"), // Flies
                FourCC("AOsr"), // Scorched remains
                FourCC("LOce"), // Empty cage
                FourCC("DOsv"), // Sewer vents

                //// These will remain visible in all seasons..
                //FourCC("YZef"),
                //FourCC("LOsm"),
                //FourCC("YOr2")
            },
            VendorSkin = Constants.UNIT_HALLOWEENSPIDER,
            KibbleTypes = new[] { Constants.ITEM_CANDY },
            WeatherEffect = null,
            TimeOfDay = 0f,
            MinimapTexture = "war3mapMap.blp",
            WolfSkin = Constants.UNIT_CUSTOM_DOG_GHOST_WOLF,
            OnActivate = SafezoneLightningEffect.Activate,
            OnDeactivate = SafezoneLightningEffect.Deactivate,
        };
    }
}
