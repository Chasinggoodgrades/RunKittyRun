import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { HolidaySeasons, Seasons } from '../Seasons'

export class TerrainChanger {
    public static Terrains: number[] = []
    public static SafezoneTerrain: number[] = []
    public static NormalCliff = 'cXc1'
    public static DirtCliff = 'cXc2'
    public static LastWolfTerrain = 0
    public static LastSafezoneTerrain = 0

    public static Initialize = () => {
        try {
            TerrainChanger.NoSeason()
            if (CurrentGameMode.active !== GameMode.Standard) return
            TerrainChanger.ChristmasTerrain()
            TerrainChanger.SetTerrain()
        } catch (e) {
            Logger.Critical(`Error in TerrainChanger.Initialize: ${e}`)
            throw e
        }
    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static SetTerrain = () => {
        TerrainChanger.SetWolfRegionTerrain()
        TerrainChanger.SetSafezoneTerrain()
    }

    public static NoSeason = () => {
        TerrainChanger.NoSeasonTerrain()
        TerrainChanger.SetTerrain()
    }

    public static ActivateChristmasTerrain = () => {
        TerrainChanger.ChristmasTerrain()
        TerrainChanger.SetTerrain()
    }

    private static NoSeasonTerrain = () => {
        TerrainChanger.Terrains[0] = FourCC('Lgrd')
        TerrainChanger.Terrains[1] = FourCC('Ygsb')
        TerrainChanger.Terrains[2] = FourCC('Vgrs')
        TerrainChanger.Terrains[3] = FourCC('Xhdg')
        TerrainChanger.Terrains[4] = FourCC('Ywmb')

        for (let i = 0; i < Globals.NumberOfRounds; i++) {
            TerrainChanger.SafezoneTerrain[i] = FourCC('Xblm')
        }
        TerrainChanger.SetTerrain()
    }

    private static ChristmasTerrain = () => {
        if (Seasons.getCurrentSeason() !== HolidaySeasons.Christmas) return
        /*        SafezoneTerrain[0] = FourCC("Xblm");
                SafezoneTerrain[1] = FourCC("Ksmb");
                SafezoneTerrain[2] = FourCC("Drds");
                SafezoneTerrain[3] = FourCC("Kdkt");
                SafezoneTerrain[4] = FourCC("Oaby");*/

        for (let i = 0; i < Globals.NumberOfRounds; i++) {
            TerrainChanger.SafezoneTerrain[i] = FourCC('Ibsq') // Icecrown Glaicer (Black Squares)
        }
        for (let i = 0; i < Globals.NumberOfRounds; i++) {
            TerrainChanger.Terrains[i] = FourCC('Nrck')
        }
    }

    private static SetWolfRegionTerrain = () => {
        const round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0
        TerrainChanger.ChangeMapTerrain(TerrainChanger.LastWolfTerrain, TerrainChanger.Terrains[round])
        TerrainChanger.LastWolfTerrain = TerrainChanger.Terrains[round]
    }

    private static SetSafezoneTerrain = () => {
        const round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0
        TerrainChanger.ChangeMapTerrain(TerrainChanger.LastSafezoneTerrain, TerrainChanger.SafezoneTerrain[round])
        TerrainChanger.LastSafezoneTerrain = TerrainChanger.SafezoneTerrain[round]
    }

    public static ChangeMapTerrain = (tileToChange: number, newTerrain: number) => {
        const mapRect = Globals.WORLD_BOUNDS
        const minX = mapRect.minX
        const minY = mapRect.minY
        const maxX = mapRect.maxX
        const maxY = mapRect.maxY

        for (let x = minX; x <= maxX; x += 128) {
            for (let y = minY; y <= maxY; y += 128) {
                const type = GetTerrainType(x, y)

                if (type === tileToChange) SetTerrainType(x, y, newTerrain, -1, 1, 1)
            }
        }
    }
}
