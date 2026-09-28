import { Constants } from 'core/01_libraries/Constants'
import {
    COLOR_TERRAIN_DEATH,
    COLOR_TERRAIN_SLIDE,
    COLOR_TERRAIN_WALK,
    udg_colorCode,
} from 'core/01_libraries/Init_colorCodes'
import type { TerrainType } from 'core/04_STRUCTURES/TerrainType/TerrainType'
import { Globals } from 'core/09_From_old_Worldedit_triggers/globals_variables_and_triggers'
import { TerrainTypeId2TerrainType } from '../../04_STRUCTURES/TerrainType/Terrain_type_functions'
import { TerrainTypeMax } from './Terrain_type_max'
import { TerrainTypeNamesAndData } from './Terrain_type_names_and_data'

export const IsTerrainAlreadyUsed = (terrainType: number): boolean => {
    let i = 0
    while (Globals.udg_used_terrain_types[i]) {
        if (Globals.udg_used_terrain_types[i] === terrainType) {
            return true
        }
        i = i + 1
    }
    return false
}

export const IsTerrainsLimitNumberReached = (): boolean => {
    return Globals.udg_nb_used_terrains === Constants.NB_MAX_OF_TERRAINS
}

export const AddNewTerrain = (newTerrain: number): boolean => {
    if (IsTerrainsLimitNumberReached() || IsTerrainAlreadyUsed(newTerrain)) {
        return false
    }
    Globals.udg_used_terrain_types[Globals.udg_nb_used_terrains] = newTerrain
    Globals.udg_nb_used_terrains = Globals.udg_nb_used_terrains + 1
    return true
}

export const CanUseTerrain = (terrainType: number): boolean => {
    if (IsTerrainAlreadyUsed(terrainType)) {
        return true
    }
    return AddNewTerrain(terrainType)
}

export const GetRandomTerrain = (): number => {
    return TerrainTypeMax.TerrainTypeMaxId2TerrainTypeId(GetRandomInt(1, TerrainTypeNamesAndData.NB_TERRAINS_TOTAL))
}

export const GetRandomUsedTerrain = (): number => {
    return Globals.udg_used_terrain_types[GetRandomInt(0, Globals.udg_nb_used_terrains - 1)]
}

export const GetRandomNotUsedTerrain = (): number => {
    let terrainType: number
    while (true) {
        terrainType = GetRandomTerrain()
        if (!IsTerrainAlreadyUsed(terrainType)) break
    }
    return terrainType
}

export const GetTerrainName = (terrain: number) => {
    if (terrain > TerrainTypeNamesAndData.NB_TERRAINS_TOTAL) {
        return TerrainTypeNamesAndData.TERRAIN_TYPE_NAMES[TerrainTypeMax.TerrainTypeId2TerrainTypeMaxId(terrain)]
    }

    if (terrain <= 0) {
        return null
    }

    return TerrainTypeNamesAndData.TERRAIN_TYPE_NAMES[terrain]
}

export const GetTerrainData = (terrain: number, x?: number, y?: number) => {
    //GetTerrainData('Nice') == "46 : Northrend - Glace    'Nice'"
    let str: string
    let maxId: number
    let terrainType: TerrainType | null

    if (terrain > TerrainTypeNamesAndData.NB_TERRAINS_TOTAL) {
        maxId = TerrainTypeMax.TerrainTypeId2TerrainTypeMaxId(terrain)
    } else if (terrain > 0) {
        maxId = terrain
        terrain = TerrainTypeMax.TerrainTypeMaxId2TerrainTypeId(maxId)
    } else {
        return null
    }
    str = udg_colorCode[Constants.RED] + TerrainTypeNamesAndData.TERRAIN_TYPE_DATA[maxId]

    terrainType = TerrainTypeId2TerrainType(terrain)
    if (terrainType) {
        str += '\n' + terrainType.toText()
    }

    // Additionaly display the coordinates of the target point
    if (x !== undefined && y !== undefined) {
        str += `\nCoordinates: (${R2I(x)}, ${R2I(y)})`
    }

    return str
}

export const DisplayTerrainDataToPlayer = (p: player, terrain: number) => {
    DisplayTimedTextToPlayer(p, 0, 0, Constants.TERRAIN_DATA_DISPLAY_TIME, GetTerrainData(terrain)!)
}
