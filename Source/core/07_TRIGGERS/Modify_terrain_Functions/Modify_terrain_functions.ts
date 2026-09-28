import { Constants } from 'core/01_libraries/Constants'
import { CanUseTerrain } from './Terrain_functions'

export const GetNbCaseBetween = (minX: number, minY: number, maxX: number, maxY: number): number => {
    return R2I((maxX - minX) / Constants.LARGEUR_CASE) * R2I((maxY - minY) / Constants.LARGEUR_CASE)
}

export const ChangeTerrainType = (x: number, y: number, terrainTypeId: number, forceVariationUpdate = false) => {
    let doUpdate = forceVariationUpdate
    if (!forceVariationUpdate) {
        doUpdate = terrainTypeId !== GetTerrainType(x, y)
    }

    if (doUpdate) {
        SetTerrainType(x, y, terrainTypeId, -1, 1, 0)
    }
}

export const ChangeTerrainBetween = (terrainType: number, x1: number, y1: number, x2: number, y2: number): boolean => {
    let minX = RMinBJ(x1, x2)
    let minY = RMinBJ(y1, y2)
    let maxX = RMaxBJ(x1, x2)
    let maxY = RMaxBJ(y1, y2)

    let r: number
    let x: number
    let y: number

    if (!CanUseTerrain(terrainType)) {
        return false
    }

    x = minX
    y = minY

    while (true) {
        if (y > maxY) break
        while (true) {
            if (x > maxX) break
            ChangeTerrainType(x, y, terrainType)
            x = x + Constants.LARGEUR_CASE
        }
        x = minX
        y = y + Constants.LARGEUR_CASE
    }

    //call Text.A( "terrain changed to : " + TerrainTypeId2TerrainTypeAsciiString( GetTerrainType( minX, minY ) ) )

    return true
}
