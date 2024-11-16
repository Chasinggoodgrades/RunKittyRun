using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class SeasonalManager
{
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
        SetWeather();
    }

    /// <summary>
    /// Returns if it is currently Christmas season or not.
    /// </summary>
    /// <returns></returns>
    public static bool ChristmasSeason() => DateTimeManager.CurrentMonth == 12;

    /// <summary>
    /// Admin command to activate Christmas season. Only works in standard mode.
    /// </summary>
    public static void ActivateChristmas()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        TerrainChanger.ActivateChristmasTerrain();
        DoodadChanger.ActivateChristmasDoodads();
        SetWeather("Christmas");
    
    }

    public static void NoSeason()
    {
        TerrainChanger.NoSeasonTerrain();
        DoodadChanger.NoSeasonDoodads();
        SetWeather();
    }

    private static void SetWeather(string type = "")
    {
        if (ChristmasSeason() || type == "Christmas")
        {
            CurrentWeather ??= weathereffect.Create(rect.CreateWorldBounds(), SnowEffect);
            CurrentWeather.Enable();
        }
        else
            if (CurrentWeather != null) CurrentWeather.Dispose();
    }



}