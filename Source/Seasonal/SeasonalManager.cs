using WCSharp.Api;
using static WCSharp.Api.Common;

public static class SeasonalManager
{
    public static HolidaySeasons Season { get; private set; } = HolidaySeasons.None;
    public static SeasonTheme CurrentTheme { get; private set; } = SeasonThemeRegistry.None;

    private static weathereffect _currentWeather;

    /// <summary>
    /// Must be standard mode for seasonal changes to occur.
    /// </summary>
    public static void Initialize()
    {
        DetermineSeason();
        TerrainChanger.Initialize();
        DoodadChanger.Initialize();
        ShopChanger.Initialize();
        Kibble.Apply(CurrentTheme);
        ApplyThemeSideEffects();
    }

    public static void DetermineSeason()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard)
        {
            SetSeason(HolidaySeasons.None);
            return;
        }

        var month = DateTimeManager.CurrentMonth;
        foreach (var theme in SeasonThemeRegistry.Seasonal)
        {
            if (theme.IsActiveInMonth(month))
            {
                SetSeason(theme.Season);
                return;
            }
        }
        SetSeason(HolidaySeasons.None);
    }

    /// <summary>
    /// Admin command to force a specific season on. "None" always works; anything
    /// else requires standard mode, the same rule the calendar-driven path follows.
    /// </summary>
    public static void ActivateSeason(HolidaySeasons season)
    {
        if (season != HolidaySeasons.None && Gamemode.CurrentGameMode != GameMode.Standard) return;
        SetSeason(season);
        TerrainChanger.Apply(CurrentTheme);
        DoodadChanger.Apply(CurrentTheme);
        ShopChanger.Apply(CurrentTheme);
        Kibble.Apply(CurrentTheme);
        ApplyThemeSideEffects();
    }

    // Compatibility wrappers so existing admin commands keep working unchanged.
    public static void ActivateChristmas() => ActivateSeason(HolidaySeasons.Christmas);
    public static void NoSeason() => ActivateSeason(HolidaySeasons.None);

    private static void SetSeason(HolidaySeasons season)
    {
        Season = season;
        CurrentTheme = SeasonThemeRegistry.Get(season);
    }

    private static void ApplyThemeSideEffects()
    {
        BlzChangeMinimapTerrainTex(CurrentTheme.MinimapTexture);
        ApplyWeather(CurrentTheme.WeatherEffect, CurrentTheme.TimeOfDay);
        Wolf.SetSkin(CurrentTheme.WolfSkin);
        SeasonalAwards.Initialize(CurrentTheme);
    }

    private static void ApplyWeather(int? effect, float timeOfDay)
    {
        if (_currentWeather != null)
        {
            _currentWeather.Dispose();
            _currentWeather = null;
        }

        if (effect.HasValue)
        {
            _currentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, effect.Value);
        }

        SetFloatGameState(GAME_STATE_TIME_OF_DAY, timeOfDay);
        SuspendTimeOfDay(true);
        _currentWeather?.Enable();
    }

    /// <summary>Manual weather override for admins - independent of the active season.</summary>
    public static bool SetWeather(string weather)
    {
        int? effect;
        var timeOfDay = CurrentTheme.TimeOfDay;

        switch (weather.ToLower())
        {
            case "none":
                effect = null;
                timeOfDay = 12f;
                break;
            case "snow":
                effect = WeatherEffects.Snow;
                break;
            case "hsnow":
                effect = WeatherEffects.HeavySnow;
                break;
            case "blizzard":
                effect = WeatherEffects.Blizzard;
                break;
            case "hrain":
                effect = WeatherEffects.HeavyRain;
                break;
            case "rain":
                effect = WeatherEffects.LightRain;
                break;
            case "rays":
                effect = WeatherEffects.RaysOfLight;
                break;
            case "moonlight":
                effect = WeatherEffects.RaysOfMoonlight;
                break;
            case "dalaran":
                effect = WeatherEffects.DalaranShield;
                break;
            default:
                return false;
        }

        ApplyWeather(effect, timeOfDay);
        return true;
    }
}
