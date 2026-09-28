import { GetRandomNotUsedTerrain, GetRandomTerrain, GetRandomUsedTerrain } from './Terrain_functions'
import { TerrainTypeGrass } from './Terrain_type_grass'
import { TerrainTypeMax } from './Terrain_type_max'
import { IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'

const initTerrainTypeFromString = () => {
    const TerrainTypeString2TerrainTypeId = (str: string): number => {
        if (IsPositiveInteger(str)) {
            return TerrainTypeMax.TerrainTypeMaxId2TerrainTypeId(S2I(str))
        }

        if (SubStringBJ(str, 1, 1) === 'g' && IsPositiveInteger(SubStringBJ(str, 2, StringLength(str)) ?? '')) {
            return TerrainTypeGrass.TerrainTypeGrassId2TerrainTypeId(S2I(SubStringBJ(str, 2, StringLength(str)) ?? ''))
        }

        if (StringLength(str) === 6 && SubStringBJ(str, 1, 1) === "'" && SubStringBJ(str, 6, 6) === "'") {
            return TerrainTypeMax.TerrainTypeAsciiString2TerrainTypeId(str)
        }

        if (str === 'x') {
            return GetRandomTerrain()
        }

        if (str === 'xnk') {
            return GetRandomNotUsedTerrain()
        }

        if (str === 'xak') {
            return GetRandomUsedTerrain()
        }

        return 0
    }

    return { TerrainTypeString2TerrainTypeId }
}

export const TerrainTypeFromString = initTerrainTypeFromString()
