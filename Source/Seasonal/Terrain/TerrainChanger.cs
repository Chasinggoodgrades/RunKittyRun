using System;
using static WCSharp.Api.Common;

public static class TerrainChanger
{
    public static int[] Terrains { get; set; }
    public static int[] SafezoneTerrain { get; set; }
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
            NoSeason();
            if (Gamemode.CurrentGameMode != GameMode.Standard) return;
            ChristmasTerrain();
            SetTerrain();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TerrainChanger.Initialize {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static void SetTerrain()
    {
        SetWolfRegionTerrain();
        SetSafezoneTerrain();
    }

    public static void NoSeason()
    {
        NoSeasonTerrain();
        SetTerrain();
    }

    public static void ActivateChristmasTerrain()
    {
        ChristmasTerrain();
        SetTerrain();
    }

    private static void NoSeasonTerrain()
    {
        Terrains[0] = FourCC("Lgrd");
        Terrains[1] = FourCC("Ygsb");
        Terrains[2] = FourCC("Vgrs");
        Terrains[3] = FourCC("Xhdg");
        Terrains[4] = FourCC("Ywmb");

        for (int i = 0; i < Gamemode.NumberOfRounds; i++)
        {
            SafezoneTerrain[i] = FourCC("Xblm");
        }
        SetTerrain();
    }

    private static void ChristmasTerrain()
    {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return;
        /*        SafezoneTerrain[0] = FourCC("Xblm");
                SafezoneTerrain[1] = FourCC("Ksmb");
                SafezoneTerrain[2] = FourCC("Drds");
                SafezoneTerrain[3] = FourCC("Kdkt");
                SafezoneTerrain[4] = FourCC("Oaby");*/

        for (int i = 0; i < Gamemode.NumberOfRounds; i++)
        {
            SafezoneTerrain[i] = FourCC("Ibsq"); // Icecrown Glaicer (Black Squares)
        }
        for (int i = 0; i < Gamemode.NumberOfRounds; i++)
        {
            Terrains[i] = FourCC("Nrck");
        }
    }

    private static void SetWolfRegionTerrain()
    {
        var round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
        ChangeMapTerrain(LastWolfTerrain, Terrains[round]);
        LastWolfTerrain = Terrains[round];
    }

    private static void SetSafezoneTerrain()
    {
        var round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
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
