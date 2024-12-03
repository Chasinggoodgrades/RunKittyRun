using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public enum HolidaySeasons
{
    Christmas,
    Halloween,
    Easter,
    Valentines,
    None
}

public static class SeasonalManager
{
    public static HolidaySeasons Season { get; set; }
    private static int CurrentMonth { get; set; }
    private static int SnowEffect { get; set; } = FourCC("SNls");
    private static weathereffect CurrentWeather;

    /// <summary>
    /// Must be standard mode for seasonal changes to occur.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        CurrentMonth = DateTimeManager.DateTime.Month;
        DetermineSeason();
        SetWeather();
        DoodadChanger.Initialize();
        TerrainChanger.Initialize();
        SeasonalAwards.Initialize();
        ShopChanger.Initialize();
    }

    public static void DetermineSeason()
    {
        switch (CurrentMonth)
        {
            case 12:
                Season = HolidaySeasons.Christmas;
                break;
/*            case 10:
                Season = HolidaySeasons.Halloween;
                break;
            case 4:
                Season = HolidaySeasons.Easter;
                break;
            case 2:
                Season = HolidaySeasons.Valentines;
                break;*/
            default:
                Season = HolidaySeasons.None;
                break;
        }
    }

    /// <summary>
    /// Returns if it is currently Christmas season or not.
    /// </summary>
    /// <returns></returns>
    public static bool ChristmasSeason()
    {
        if (DateTimeManager.CurrentMonth != 12) return false;
        Season = HolidaySeasons.Christmas;
        return true;
    }

    /// <summary>
    /// Admin command to activate Christmas season. Only works in standard mode.
    /// </summary>
    public static void ActivateChristmas()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        Season = HolidaySeasons.Christmas;
        TerrainChanger.ActivateChristmasTerrain();
        DoodadChanger.ChristmasDoodads();
        ShopChanger.SetSeasonalShop();
        SetWeather();
    
    }

    /// <summary>
    /// Admin Command for no seasons. Works regardless of mode.
    /// </summary>
    public static void NoSeason()
    {
        Season = HolidaySeasons.None;
        TerrainChanger.NoSeason();
        DoodadChanger.NoSeasonDoodads();
        ShopChanger.SetSeasonalShop();
        SetWeather();
    }

    private static void SetWeather()
    {
        if (Season == HolidaySeasons.Christmas)
        {
            CurrentWeather ??= weathereffect.Create(Globals.WORLD_BOUNDS, SnowEffect);
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 23);
            SuspendTimeOfDay(true);
            CurrentWeather.Enable();
        }
        else if (Season == HolidaySeasons.None)
        {
            CurrentWeather?.Dispose();
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
            SuspendTimeOfDay(true);
            CurrentWeather = null;
        }
    }



}