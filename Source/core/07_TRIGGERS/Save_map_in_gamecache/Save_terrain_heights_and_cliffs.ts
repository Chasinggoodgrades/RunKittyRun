import { arrayPush, IsNearBounds } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { ZLibrary } from 'core/02_bibliotheques_externes/ZLibrary'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { globals } from '../../../../globals'
import { I2HexaString } from '../../01_libraries/Functions_on_numbers'

const initSaveTerrainHeights = () => {
    //save terrain cliff levels
    let cachedTerrainCliffs = ''

    const SaveTerrainCliffs = (json: { [x: string]: any }) => {
        if (cachedTerrainCliffs !== '') {
            json.terrainCliffs = cachedTerrainCliffs
            return
        }

        const terrainCliffsArr = MemoryHandler.getEmptyArray()

        let x: number
        let cliffLevel: number

        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            x = globals.MAP_MIN_X
            while (true) {
                if (x > globals.MAP_MAX_X) break
                if (IsNearBounds(x, y)) {
                    cliffLevel = 2
                } else {
                    cliffLevel = GetTerrainCliffLevel(x, y)
                }

                arrayPush(terrainCliffsArr, I2HexaString(cliffLevel))

                x = x + Constants.LARGEUR_CASE
            }
            y = y + Constants.LARGEUR_CASE
        }

        json.terrainCliffs = cachedTerrainCliffs = terrainCliffsArr.join('')
        MemoryHandler.destroyArray(terrainCliffsArr)

        Text.A('terrain cliffs saved')
    }

    //save terrain heights
    const SaveTerrainHeights = (json: { [x: string]: any }) => {
        json.terrainHeights = MemoryHandler.getEmptyArray()

        let height: number
        let isWater: boolean

        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            let x = globals.MAP_MIN_X
            while (x <= globals.MAP_MAX_X) {
                height = ZLibrary.GetSurfaceZ(x, y)
                //if (!IsNearBounds(x, y) && (GetTerrainCliffLevel(x, y) != 2 || height != 0)) then //if surfaceZ is 0 && cliff level 2, we consider it's a "default tilepoint", with no water, && we avoid the GetTerrainZ call (which is heavy)
                /*if (!IsNearBounds(x, y) && !IsTerrainPathable(x, y, PATHING_TYPE_FLOATABILITY)) then
			                    //near bounds, GetTerrainZ crashes the game
			                    //warning, PATHING_TYPE_FLOATABILITY doesn't find water everywhere there is (little spaces of water won't be detected), but I see no other solution
			                    height = ZLibrary.GetTerrainZ(x, y)
			                endif*/

                /*
			                if (RAbsBJ(height - ZLibrary.GetSurfaceZ(x, y)) > 5) then
 CreateUnit(Player(0), 'hpea', x, y, 0)
			                endif
			                */

                arrayPush(json.terrainHeights, R2I(height))

                x = x + Constants.LARGEUR_CASE
            }
            y = y + Constants.LARGEUR_CASE
        }

        Text.A('terrain heights saved')
    }

    return { SaveTerrainHeights, SaveTerrainCliffs }
}

export const SaveTerrainHeights = initSaveTerrainHeights()
