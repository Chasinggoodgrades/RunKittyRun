import { Constants } from 'core/01_libraries/Constants'
import { getUdgTerrainTypes, globals } from '../../../../globals'
import { ChangeTerrainType } from '../Modify_terrain_Functions/Modify_terrain_functions'
import { GetTerrainData } from '../Modify_terrain_Functions/Terrain_functions'
import { TerrainTypeFromString } from '../Modify_terrain_Functions/Terrain_type_from_string'

const initChangeOneTerrain = () => {
    let oldTerrain: number
    let newTerrain: number

    const ModifyTerrain = () => {
        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            let x = globals.MAP_MIN_X
            while (x <= globals.MAP_MAX_X) {
                if (GetTerrainType(x, y) === oldTerrain) {
                    ChangeTerrainType(x, y, newTerrain)
                }
                x = x + Constants.LARGEUR_CASE
            }
            y = y + Constants.LARGEUR_CASE
        }
    }

    const ChangeOneTerrain = (terrainTypeLabel: string, newTerrainType: string) => {
        const terrainType = getUdgTerrainTypes().getByLabel(terrainTypeLabel)
        if (terrainType === null) {
            throw 'Wrong terrain label "' + terrainTypeLabel + '"'
        }
        oldTerrain = terrainType.getTerrainTypeId()
        newTerrain = TerrainTypeFromString.TerrainTypeString2TerrainTypeId(newTerrainType)
        if (newTerrain === 0) {
            throw 'New terrain "' + newTerrainType + '" unknown'
        }
        if (getUdgTerrainTypes().isTerrainTypeIdAlreadyUsed(newTerrain)) {
            throw 'Terrain "' + newTerrainType + '" already in use'
        }
        if (!terrainType.setTerrainTypeId(newTerrain)) {
            throw 'Terrain tiles number limit reached'
        }

        ModifyTerrain()
        return GetTerrainData(newTerrain)
    }

    return { ChangeOneTerrain }
}

export const ChangeOneTerrain = initChangeOneTerrain()
