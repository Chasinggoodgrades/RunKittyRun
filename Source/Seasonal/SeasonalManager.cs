using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class SeasonalManager
{
    private static int CurrentMonth { get; set; }
    private static int SnowEffect { get; set; } = FourCC("SNls");

    /// <summary>
    /// Must be standard mode for seasonal changes to occur.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        CurrentMonth = DateTimeManager.DateTime.Month;
        SetWeather();
    }

    private static void SetWeather()
    {
        // December and January will have snow.
        if (CurrentMonth == 11 || CurrentMonth == 12)
            weathereffect.Create(rect.CreateWorldBounds(), SnowEffect);
    }

}