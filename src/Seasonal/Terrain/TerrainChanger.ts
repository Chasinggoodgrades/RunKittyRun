export class TerrainChanger {
    public static Terrains: number[] = []
    public static SafezoneTerrain: number[] = []
    public static NormalCliff: string = 'cXc1'
    public static DirtCliff: string = 'cXc2'
    public static LastWolfTerrain: number = 0
    public static LastSafezoneTerrain: number = 0

    public static Initialize() {
        try {
            this.NoSeason()
            if (Gamemode.CurrentGameMode != GameMode.Standard) return
            this.ChristmasTerrain()
            this.SetTerrain()
        } catch (e) {
            Logger.Critical('Error in TerrainChanger.Initialize {e.Message}')
            throw e
        }
    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static SetTerrain() {
        this.SetWolfRegionTerrain()
        this.SetSafezoneTerrain()
    }

    public static NoSeason() {
        this.NoSeasonTerrain()
        this.SetTerrain()
    }

    public static ActivateChristmasTerrain() {
        this.ChristmasTerrain()
        this.SetTerrain()
    }

    private static NoSeasonTerrain() {
        this.Terrains[0] = FourCC('Lgrd')
        this.Terrains[1] = FourCC('Ygsb')
        this.Terrains[2] = FourCC('Vgrs')
        this.Terrains[3] = FourCC('Xhdg')
        this.Terrains[4] = FourCC('Ywmb')

        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++) {
            this.SafezoneTerrain[i] = FourCC('Xblm')
        }
        this.SetTerrain()
    }

    private static ChristmasTerrain() {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return
        /*        SafezoneTerrain[0] = FourCC("Xblm");
                SafezoneTerrain[1] = FourCC("Ksmb");
                SafezoneTerrain[2] = FourCC("Drds");
                SafezoneTerrain[3] = FourCC("Kdkt");
                SafezoneTerrain[4] = FourCC("Oaby");*/

        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++) {
            SafezoneTerrain[i] = FourCC('Ibsq') // Icecrown Glaicer (Black Squares)
        }
        for (let i: number = 0; i < Gamemode.NumberOfRounds; i++) {
            Terrains[i] = FourCC('Nrck')
        }
    }

    private static SetWolfRegionTerrain() {
        let round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0
        ChangeMapTerrain(LastWolfTerrain, Terrains[round])
        LastWolfTerrain = Terrains[round]
    }

    private static SetSafezoneTerrain() {
        let round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0
        ChangeMapTerrain(LastSafezoneTerrain, SafezoneTerrain[round])
        LastSafezoneTerrain = SafezoneTerrain[round]
    }

    public static ChangeMapTerrain(tileToChange: number, newTerrain: number) {
        let mapRect = Globals.WORLD_BOUNDS
        let minX = mapRect.MinX
        let minY = mapRect.MinY
        let maxX = mapRect.MaxX
        let maxY = mapRect.MaxY

        for (let x = minX; x <= maxX; x += 128) {
            for (let y = minY; y <= maxY; y += 128) {
                let type = GetTerrainType(x, y)

                if (type == tileToChange) SetTerrainType(x, y, newTerrain, -1, 1, 1)
            }
        }
    }
}
