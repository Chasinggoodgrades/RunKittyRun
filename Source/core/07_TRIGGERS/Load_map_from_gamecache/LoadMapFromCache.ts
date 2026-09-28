import {
    getUdgCasterTypes,
    getUdgLevels,
    getUdgMonsterTypes,
    getUdgTerrainSaves,
    getUdgTerrainTypes,
    globals,
    setHeroBaseCollisionSize,
    setHeroModelPath,
} from '../../../../globals'
import { jsonDecode } from '../../01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import {
    initCasterTypes,
    initLevels,
    initMonsterTypes,
    initTerrainSaves,
    initTerrainTypes,
} from '../../Init/initArrays'
import { Gravity } from '../Slide_and_CheckTerrain_triggers/Gravity'

export class LoadMapFromCache {
    public static gameDataJsonString: string | null = null

    public static initializeGameData = (currentlyOnGameStart = true) => {
        if (LoadMapFromCache.gameDataJsonString) {
            const gameData: any = jsonDecode(LoadMapFromCache.gameDataJsonString)

            if (!gameData || typeof gameData !== 'object') {
                Text.erA('invalid game data string')
            } else {
                const levelIdBefore = getUdgLevels().getCurrentLevel().id

                if (!currentlyOnGameStart) {
                    //erase previous data from the game
                    getUdgLevels().destroy()
                    getUdgCasterTypes().destroy()
                    getUdgMonsterTypes().destroy()
                    getUdgTerrainTypes().destroy()
                    getUdgTerrainSaves().destroy()
                    initTerrainTypes()
                    initMonsterTypes()
                    initCasterTypes()
                    initLevels()
                    initTerrainSaves()
                }

                // game properties
                if (gameData.gameData) {
                    if (gameData.gameData.USE_VTOTO_SLIDE_LOGIC !== undefined) {
                        globals.USE_VTOTO_SLIDE_LOGIC = gameData.gameData.USE_VTOTO_SLIDE_LOGIC
                    }

                    if (gameData.gameData.coopCircles !== undefined) {
                        globals.coopCircles = gameData.gameData.coopCircles
                    }

                    if (gameData.gameData.CAN_TURN_IN_AIR !== undefined) {
                        globals.CAN_TURN_IN_AIR = gameData.gameData.CAN_TURN_IN_AIR
                    }

                    if (gameData.gameData.canSlideOverPathingBlockers !== undefined) {
                        globals.canSlideOverPathingBlockers = gameData.gameData.canSlideOverPathingBlockers
                    }

                    if (gameData.gameData.animOnRevive !== undefined) {
                        globals.animOnRevive = gameData.gameData.animOnRevive
                    }

                    if (gameData.gameData.wanderMinTime !== undefined) {
                        globals.wanderMinTime = gameData.gameData.wanderMinTime
                    }

                    if (gameData.gameData.wanderExtraTime !== undefined) {
                        globals.wanderExtraTime = gameData.gameData.wanderExtraTime
                    }

                    if (gameData.gameData.gravity !== undefined) {
                        Gravity.SetGravity(gameData.gameData.gravity)
                    }

                    // For old maps retrocompatibility, the MEC_core.setGameData applied won't contain an heroBaseCollisionSize value,
                    //    this will be detected and set heroBaseCollisionSize to 0 to keep the same behavior as before
                    setHeroBaseCollisionSize(gameData.gameData.heroBaseCollisionSize ?? 0)

                    // a map saved before this was saved keeps the model of the engine
                    if (gameData.gameData.heroModelPath) {
                        setHeroModelPath(gameData.gameData.heroModelPath)
                    }
                }

                //terrain types MEC
                if (gameData.terrainTypesMec) {
                    getUdgTerrainTypes().newFromJson(gameData.terrainTypesMec)
                }

                //monster types
                if (gameData.monsterTypes) {
                    getUdgMonsterTypes().newFromJson(gameData.monsterTypes)
                }

                //caster types
                if (gameData.casterTypes) {
                    getUdgCasterTypes().newFromJson(gameData.casterTypes)
                }

                //levels
                if (gameData.levels) {
                    getUdgLevels().newFromJson(gameData.levels)
                }

                //terrain saves - must run after levels, since level-scoped terrain saves resolve their Level by id
                if (gameData.terrainSaves) {
                    getUdgTerrainSaves().newFromJson(gameData.terrainSaves)
                }

                if (!currentlyOnGameStart) {
                    // load the level number we were in before, or first level if the previous level id doesn't exist
                    const newLevelId = levelIdBefore <= getUdgLevels().getLastLevelId() ? levelIdBefore : 0
                    if (newLevelId === levelIdBefore) {
                        getUdgLevels().refreshCurrentLevel()
                    } else {
                        getUdgLevels().goToLevel(undefined, false, newLevelId)
                    }
                }
            }
        }
    }
}
