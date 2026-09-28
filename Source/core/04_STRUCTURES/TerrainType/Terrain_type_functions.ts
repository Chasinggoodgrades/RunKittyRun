import { getUdgTerrainTypes } from '../../../../globals'
import { TerrainType } from './TerrainType'

export const TerrainTypeId2TerrainType = (terrainTypeId: number): TerrainType | null => {
    for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
        if (terrainType.getTerrainTypeId() === terrainTypeId) {
            return terrainType
        }
    }

    return null
}

export const IsTerrainTypeOfKind = (terrainTypeId: number, terrainTypeKind: string): boolean => {
    let terrainType = TerrainTypeId2TerrainType(terrainTypeId)
    if (terrainType === null) {
        return false
    }
    return terrainTypeKind == terrainType.getKind()
}
