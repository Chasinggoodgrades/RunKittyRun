import { TerrainTypeMax } from './Terrain_type_max'

const initTerrainTypeGrass = () => {
    const terrainMap: { [x: number]: number } = {
        1: 5,
        2: 11,
        3: 12,
        4: 17,
        5: 26,
        6: 29,
        7: 40,
        8: 45,
        9: 55,
        10: 63,
        11: 65,
        12: 71,
        13: 73,
        14: 80,
        15: 106,
        16: 107,
        17: 139,
    }

    const reversedTerrainMap: { [x: number]: number } = {
        5: 1,
        11: 2,
        12: 3,
        17: 4,
        26: 5,
        29: 6,
        40: 7,
        45: 8,
        55: 9,
        63: 10,
        65: 11,
        71: 12,
        73: 13,
        80: 14,
        106: 15,
        107: 16,
        139: 17,
    }

    const TerrainTypeGrassId2MaxId = (grassId: number): number => {
        return terrainMap[grassId] || 0
    }

    const TerrainTypeMaxId2GrassId = (maxId: number): number => {
        return reversedTerrainMap[maxId] || 0
    }

    const TerrainTypeGrassId2TerrainTypeId = (grassId: number): number => {
        return TerrainTypeMax.TerrainTypeMaxId2TerrainTypeId(TerrainTypeGrassId2MaxId(grassId))
    }

    return { TerrainTypeGrassId2MaxId, TerrainTypeMaxId2GrassId, TerrainTypeGrassId2TerrainTypeId }
}

export const TerrainTypeGrass = initTerrainTypeGrass()
