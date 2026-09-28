import { Constants } from 'core/01_libraries/Constants'
import { TerrainType } from 'core/04_STRUCTURES/TerrainType/TerrainType'
import { getUdgTerrainTypes, globals } from '../../../../globals'
import { ChangeTerrainType } from '../Modify_terrain_Functions/Modify_terrain_functions'

const initRandomizeTerrains = () => {
    let oldTerrainTypes: number[] = []
    let newTerrainTypes: number[] = []
    let lastTerrainArrayId: number

    const ModifyTerrain = () => {
        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            let x = globals.MAP_MIN_X
            while (x <= globals.MAP_MAX_X) {
                const terrainTypeId = GetTerrainType(x, y)
                let done = false

                let j = 0
                while (j <= lastTerrainArrayId && !done) {
                    if (terrainTypeId === oldTerrainTypes[j]) {
                        ChangeTerrainType(x, y, newTerrainTypes[j])
                        done = true
                    }
                    j = j + 1
                }

                x += Constants.LARGEUR_CASE
            }

            y += Constants.LARGEUR_CASE
        }
    }

    const RandomizeTerrains = () => {
        let isTaken: boolean[] = []
        let terrainTypes: TerrainType[] = []

        let i = 0
        let n = 0

        for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
            terrainTypes[n] = terrainType
            oldTerrainTypes[n] = terrainType.getTerrainTypeId()
            n++
        }

        lastTerrainArrayId = n - 1

        i = 0
        while (true) {
            if (i > lastTerrainArrayId) break
            isTaken[i] = false
            i = i + 1
        }

        i = 0
        while (true) {
            if (i > lastTerrainArrayId) break
            while (true) {
                n = GetRandomInt(0, lastTerrainArrayId)
                if (!isTaken[n]) break
            }
            isTaken[n] = true
            newTerrainTypes[i] = oldTerrainTypes[n]
            i = i + 1
        }

        ModifyTerrain()

        i = 0
        while (true) {
            if (i > lastTerrainArrayId) break
            terrainTypes[i].setTerrainTypeId(newTerrainTypes[i])
            i = i + 1
        }
    }

    return { RandomizeTerrains }
}

export const RandomizeTerrains = initRandomizeTerrains()
