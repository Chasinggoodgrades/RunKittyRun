import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { SaveLoad } from 'core/04_STRUCTURES/Escaper/Escaper_StartCommands'
import {
    getUdgCasterTypes,
    getUdgLevels,
    getUdgMonsterTypes,
    getUdgTerrainSaves,
    getUdgTerrainTypes,
    globals,
} from '../../../../globals'
import { jsonEncode } from '../../01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import { Gravity } from '../Slide_and_CheckTerrain_triggers/Gravity'
import { PushTerrainDataIntoJson } from './Save_terrain'

export class SaveMapInCache {
    public static lastSaveFile = ''

    private static gameAsJsonString = (withTerrainData = true) => {
        //old
        const jsonTerrain = MemoryHandler.getEmptyObject<any>()
        const jsonGameData = MemoryHandler.getEmptyObject<any>()

        //FOR TERRAIN FILE W3E
        //terrain types, order, height
        if (withTerrainData) {
            PushTerrainDataIntoJson(jsonTerrain)
            Text.A('map terrain saved')
        }

        //FOR GAME DATA
        jsonGameData.gameData = MemoryHandler.getEmptyObject<any>()
        jsonGameData.gameData.USE_VTOTO_SLIDE_LOGIC = globals.USE_VTOTO_SLIDE_LOGIC
        jsonGameData.gameData.coopCircles = globals.coopCircles
        jsonGameData.gameData.CAN_TURN_IN_AIR = globals.CAN_TURN_IN_AIR
        jsonGameData.gameData.canSlideOverPathingBlockers = globals.canSlideOverPathingBlockers
        jsonGameData.gameData.animOnRevive = globals.animOnRevive
        jsonGameData.gameData.wanderMinTime = globals.wanderMinTime
        jsonGameData.gameData.wanderExtraTime = globals.wanderExtraTime
        jsonGameData.gameData.gravity = Gravity.GetRealGravity()
        jsonGameData.gameData.heroBaseCollisionSize = globals.heroBaseCollisionSize
        jsonGameData.gameData.heroModelPath = globals.heroModelPath

        //terrain config
        jsonGameData.terrainTypesMec = getUdgTerrainTypes().toJson()
        Text.A('MEC terrain configuration saved')

        //monster types
        jsonGameData.monsterTypes = getUdgMonsterTypes().toJson()
        Text.A('monster types saved')

        //caster types
        jsonGameData.casterTypes = getUdgCasterTypes().toJson()
        Text.A('caster types saved')

        //save levels
        jsonGameData.levels = getUdgLevels().toJson()
        Text.A('levels saved')

        //terrain saves
        jsonGameData.terrainSaves = getUdgTerrainSaves().toJson()
        Text.A('terrain saves saved')

        //output
        const objData = MemoryHandler.getEmptyObject<{ [x: string]: any }>()
        objData['terrain'] = jsonTerrain
        objData['gameData'] = jsonGameData

        const output = jsonEncode(objData)
        MemoryHandler.destroyObject(objData)

        return output
    }

    private static smicStringObj = { str: '' }

    public static smic = (p: player | null = null, withTerrain = true, fileName?: string) => {
        if (p === null || GetLocalPlayer() == p) {
            const startTime = os.clock()

            SaveMapInCache.smicStringObj.str = SaveMapInCache.gameAsJsonString(withTerrain)
            fileName = fileName || Constants.MEC_SMIC_DATA_FILE_DATE_TPL.replace('[date]', os.date('%Y-%m-%d_%H-%M-%S'))

            SaveLoad.saveFile(fileName, p, SaveMapInCache.smicStringObj.str, false)

            SaveMapInCache.lastSaveFile = fileName

            Text.A('saving game data to file "' + fileName + '" done')

            const time = os.clock() - startTime

            Text.mkA('SMIC done in ' + time + ' s')
        }
    }
}
