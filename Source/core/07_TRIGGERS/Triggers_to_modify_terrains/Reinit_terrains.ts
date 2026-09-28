import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { TerrainType } from 'core/04_STRUCTURES/TerrainType/TerrainType'
import { getUdgTerrainTypes, globals } from '../../../../globals'
import { createTimer } from '../../../Utils/mapUtils'
import { ChangeTerrainType } from '../Modify_terrain_Functions/Modify_terrain_functions'

const initReinitTerrains = () => {
    let terrainTypes: TerrainType[] = []
    let terrainTypeIds: number[] = []
    let terrainTypeIdsToReplace: number[] = []

    const init_ReinitAtStart = () => {
        createTimer(0, false, () => {
            let n = 0

            for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
                terrainTypes[n] = terrainType
                terrainTypeIds[n] = terrainType.getTerrainTypeId()
                n++
            }
        })
    }

    const ModifyTerrain = () => {
        let y = globals.MAP_MIN_Y

        let x: number
        let terrainTypeId: number
        let done: boolean
        let j: number

        while (y <= globals.MAP_MAX_Y) {
            x = globals.MAP_MIN_X

            while (x <= globals.MAP_MAX_X) {
                terrainTypeId = GetTerrainType(x, y)
                done = false
                j = 0

                while (!(terrainTypes[j] === null || done)) {
                    if (terrainTypeId === terrainTypeIdsToReplace[j]) {
                        ChangeTerrainType(x, y, terrainTypeIds[j])
                        done = true
                    }
                    j = j + 1
                }

                x = x + Constants.LARGEUR_CASE
            }

            y = y + Constants.LARGEUR_CASE
        }

        Text.mkA('Terrains reinitialized')
    }

    const ReinitTerrains = () => {
        for (let i = 0; i < terrainTypes.length; i++) {
            terrainTypeIdsToReplace[i] = terrainTypes[i].getTerrainTypeId()
            terrainTypes[i].setTerrainTypeId(terrainTypeIds[i])
        }

        ModifyTerrain()
    }

    return { ReinitTerrains, init_ReinitAtStart }
}

export const ReinitTerrains = initReinitTerrains()
