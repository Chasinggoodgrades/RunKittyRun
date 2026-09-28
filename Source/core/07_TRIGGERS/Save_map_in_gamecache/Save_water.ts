import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { ZLibrary } from 'core/02_bibliotheques_externes/ZLibrary'
import { globals } from '../../../../globals'
import { arrayPush } from '../../01_libraries/Basic_functions'

const initSaveWater = () => {
    //save water heights
    const SaveWaterHeights = (json: { [x: string]: any }) => {
        if (json.terrainHeights) {
            json.waterHeights = json.terrainHeights
            return
        }

        json.waterHeights = MemoryHandler.getEmptyArray()
        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            let x = globals.MAP_MIN_X
            while (x <= globals.MAP_MAX_X) {
                arrayPush(json.waterHeights, R2I(ZLibrary.GetSurfaceZ(x, y)))
                x = x + Constants.LARGEUR_CASE
            }

            y = y + Constants.LARGEUR_CASE
        }

        Text.A('water heights saved')
    }

    //save water presence
    /*
 private function SaveWater_Actions takes nothing returns nothing
    local real x
    local boolean isWater
    if (y <= MAP_MAX_Y) then
        x = MAP_MIN_X
        loop
            exitwhen (x > MAP_MAX_X)
                isWater = false //not IsTerrainPathable(x, y, PATHING_TYPE_FLOATABILITY)
                if (isWater) then
 StringArrayForCache.stringArrayForCache.push("1")
                else
 StringArrayForCache.stringArrayForCache.push("0")
                endif
            x = x + Constants.LARGEUR_CASE
        endloop
        y = y + Constants.LARGEUR_CASE
    else
 DisableTrigger(GetTriggeringTrigger())
 StringArrayForCache.stringArrayForCache.writeInCache()
 Text.A("water presence saved")
 StartSaveWaterHeights()
    endif
endfunction
*/

    const SaveWater = (json: { [x: string]: any }) => {
        SaveWaterHeights(json)

        /*
	    y = MAP_MIN_Y
	StringArrayForCache.stringArrayForCache = new StringArrayForCache("terrain", "waterPresence", false)
 TriggerClearActions(SaveMapInCache.trigSaveMapInCache)
 TriggerAddAction(SaveMapInCache.trigSaveMapInCache, SaveWater_Actions)
 EnableTrigger(SaveMapInCache.trigSaveMapInCache)
	    */
    }

    return { SaveWater }
}

export const SaveWater = initSaveWater()
