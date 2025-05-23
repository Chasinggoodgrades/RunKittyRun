﻿using WCSharp.Api;
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
        CurrentMonth = DateTimeManager.DateTime.Month;
        DetermineSeason();
        SetMinimap();
        SetWeather();
        DoodadChanger.Initialize();
        TerrainChanger.Initialize();
        SeasonalAwards.Initialize();
        ShopChanger.Initialize();
    }

    public static void DetermineSeason()
    {
        if (Gamemode.CurrentGameMode != "Standard")
        {
            Season = HolidaySeasons.None;
            return;
        }
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
        SetMinimap();
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
        SetMinimap();
        SetWeather();
    }

    private static void SetMinimap()
    {
        switch (Season)
        {
            case HolidaySeasons.Christmas:
                BlzChangeMinimapTerrainTex("snowMap.blp");
                break;

            case HolidaySeasons.None:
                BlzChangeMinimapTerrainTex("war3mapMap.blp");
                break;
        }
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
