

class TerrainChanger
{
    public static number[] Terrains 
    public static number[] SafezoneTerrain 
    public static NormalCliff: string = "cXc1";
    public static DirtCliff: string = "cXc2";
    public static LastWolfTerrain: number = 0;
    public static LastSafezoneTerrain: number = 0;

    public static Initialize()
    {
        try
        {
            Terrains = new number[Gamemode.NumberOfRounds];
            SafezoneTerrain = new number[Gamemode.NumberOfRounds];
            NoSeason();
            if (Gamemode.CurrentGameMode != GameMode.Standard) return;
            ChristmasTerrain();
            SetTerrain();
        }
        catch (e: Error)
        {
            Logger.Critical("Error in TerrainChanger.Initialize {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static SetTerrain()
    {
        SetWolfRegionTerrain();
        SetSafezoneTerrain();
    }

    public static NoSeason()
    {
        NoSeasonTerrain();
        SetTerrain();
    }

    public static ActivateChristmasTerrain()
    {
        ChristmasTerrain();
        SetTerrain();
    }

    private static NoSeasonTerrain()
    {
        Terrains[0] = FourCC("Lgrd");
        Terrains[1] = FourCC("Ygsb");
        Terrains[2] = FourCC("Vgrs");
        Terrains[3] = FourCC("Xhdg");
        Terrains[4] = FourCC("Ywmb");

        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++)
        {
            SafezoneTerrain[i] = FourCC("Xblm");
        }
        SetTerrain();
    }

    private static ChristmasTerrain()
    {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return;
        /*        SafezoneTerrain[0] = FourCC("Xblm");
                SafezoneTerrain[1] = FourCC("Ksmb");
                SafezoneTerrain[2] = FourCC("Drds");
                SafezoneTerrain[3] = FourCC("Kdkt");
                SafezoneTerrain[4] = FourCC("Oaby");*/

        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++)
        {
            SafezoneTerrain[i] = FourCC("Ibsq"); // Icecrown Glaicer (Black Squares)
        }
        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++)
        {
            Terrains[i] = FourCC("Nrck");
        }
    }

    private static SetWolfRegionTerrain()
    {
        let round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
        ChangeMapTerrain(LastWolfTerrain, Terrains[round]);
        LastWolfTerrain = Terrains[round];
    }

    private static SetSafezoneTerrain()
    {
        let round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
        ChangeMapTerrain(LastSafezoneTerrain, SafezoneTerrain[round]);
        LastSafezoneTerrain = SafezoneTerrain[round];
    }

    public static ChangeMapTerrain(tileToChange: number, newTerrain: number)
    {
        let mapRect = Globals.WORLD_BOUNDS;
        let minX = mapRect.MinX;
        let minY = mapRect.MinY;
        let maxX = mapRect.MaxX;
        let maxY = mapRect.MaxY;

        for (let x = minX; x <= maxX; x += 128)
        {
            for (let y = minY; y <= maxY; y += 128)
            {
                let type = GetTerrainType(x, y);

                if (type == tileToChange)
                    SetTerrainType(x, y, newTerrain, -1, 1, 1);
            }
        }
    }
}
