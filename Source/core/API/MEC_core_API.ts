import { ServiceManager } from 'Services'
import { pathingBlockerUtils } from 'Utils/PathingBlockerUtils'
import { progressionUtils } from 'Utils/ProgressionUtils'
import { Escaper } from 'core/04_STRUCTURES/Escaper/Escaper'
import { Level } from 'core/04_STRUCTURES/Level/Level'
import { Region } from 'core/04_STRUCTURES/Region/Region'
import { TerrainType } from 'core/04_STRUCTURES/TerrainType/TerrainType'
import { AfkMode } from 'core/08_GAME/Afk_mode/Afk_mode'
import {
    getUdgEscapers,
    getUdgLevels,
    getUdgMonsterTypes,
    getUdgTerrainTypes,
    globals,
    udg_monsters,
    udg_spawned_monsters,
} from '../../../globals'
import { errorHandler, runInTrigger } from '../../Utils/mapUtils'
import { SetMeteorEffect } from '../04_STRUCTURES/Escaper/Escaper'
import { Hero2Escaper, IsHero } from '../04_STRUCTURES/Escaper/Escaper_functions'
import { MonsterNoMove } from '../04_STRUCTURES/Monster/MonsterNoMove'
import { MonsterSimplePatrol, createMonsterSmartPatrol } from '../04_STRUCTURES/Monster/MonsterSimplePatrol'
import { makingRightsToAll } from '../06_COMMANDS/Rights/manage_rights'
import { LoadMapFromCache } from '../07_TRIGGERS/Load_map_from_gamecache/LoadMapFromCache'
import { Gravity } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/Gravity'
import { ReinitTerrains } from '../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains'
import { ReinitTerrainsPositions } from '../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains_position_Change_variations_and_ut_at_beginning'
import { heroes } from '../08_GAME/Init_game/Heroes'
import { hooks } from './GeneralHooks'
import { MecHook } from './MecHook'
import { NewImmobileMonster, NewPatrolMonster } from '../04_STRUCTURES/Monster/Monster_functions'
import { Monster } from '../04_STRUCTURES/Monster/Monster'
import { e2e } from '../Test/e2e-tests/base/e2e-tests-base'
import { ReplaceBackslahsesInLinks } from '../01_libraries/Basic_functions'

export type IMEC_core_API = typeof MEC_core_API

export const MEC_core_API = {
    json,

    setGameData: (jsonString: string, currentlyOnGameStart = true) => {
        errorHandler(() => {
            LoadMapFromCache.gameDataJsonString = jsonString
            LoadMapFromCache.initializeGameData(currentlyOnGameStart)

            pathingBlockerUtils.init()
            progressionUtils.init()
        })()
    },

    makingRightsToAll: () => {
        makingRightsToAll()
    },

    //globals getters
    getEscapers: getUdgEscapers,
    getTerrainTypes: getUdgTerrainTypes,
    getLevels: getUdgLevels,
    getMonsterTypes: getUdgMonsterTypes,
    getMonstersAll: () => {
        return udg_monsters
    },
    getSpawnedMonstersAll: () => {
        return udg_spawned_monsters
    },

    //constructors
    newMonsterSimplePatrol: (...args: ConstructorParameters<typeof MonsterSimplePatrol>) => {
        return createMonsterSmartPatrol(...args)
    },

    //hooks
    destroyHook: (hookId: number) => {
        return MecHook.destroy(hookId)
    },

    // if one of the cb for onBeforeCreateMonsterUnit returns false, the monsterUnit won't be created
    onBeforeCreateMonsterUnit: (cb: () => boolean) => {
        return hooks.hooks_onBeforeCreateMonsterUnit.new(cb)
    },

    onAfterCreateMonsterUnit: (cb: () => any) => {
        return hooks.hooks_onAfterCreateMonsterUnit.new(cb)
    },

    onStartLevel: (levelNum: number, cb: () => any) => {
        const level = getUdgLevels().get(levelNum)
        if (level) {
            return level.hooks_onStart.new(cb)
        }

        return null
    },

    onEndLevel: (levelNum: number, cb: () => any) => {
        const level = getUdgLevels().get(levelNum)
        if (level) {
            return level.hooks_onEnd.new(cb)
        }

        return null
    },

    onStartLevelAny: (cb: (level: Level) => any) => {
        return hooks.hooks_onStartLevelAny.new(cb)
    },

    onEndLevelAny: (cb: (level: Level) => any) => {
        return hooks.hooks_onEndLevelAny.new(cb)
    },

    onGameWinning: (cb: () => any) => {
        return hooks.hooks_onGameWinning.new(cb)
    },

    onEscaperDeath: (cb: (escaper: Escaper) => any) => {
        return hooks.hooks_onEscaperDeath.new(cb)
    },

    onCoopHeroRevive: (cb: (reviver: Escaper, revived: Escaper) => any) => {
        return hooks.hooks_onCoopHeroRevive.new(cb)
    },

    onHeroEnterRegion: (cb: (escaper: Escaper, region: Region) => any) => {
        return hooks.hooks_onHeroEnterRegion.new(cb)
    },

    onHeroEnterRegionOnce: (cb: (escaper: Escaper, region: Region) => any) => {
        return hooks.hooks_onHeroEnterRegionOnce.new(cb)
    },

    onModeSelection: (cb: (mode: 'solo' | 'coop') => any) => {
        return hooks.hooks_onModeSelection.new(cb)
    },

    onHeroTerrainChange: (cb: (escaper: Escaper, newTerrainType: TerrainType, oldTerrainType?: TerrainType) => any) => {
        return hooks.hooks_onHeroTerrainChange.new(cb)
    },

    // if one of the cb for onBeforeCreateMonsterUnit returns false, the meteor usage will be prevented
    onBeforeHeroUsingMeteor: (cb: (escaper: Escaper, targetMonster: Monster, meteor: item) => boolean) => {
        return hooks.hooks_onBeforeHeroUsingMeteor.new(cb)
    },

    //terrain
    terrain: {
        reinitTypes: ReinitTerrains.ReinitTerrains,
        reinitPositions: ReinitTerrainsPositions.ReinitTerrainsPosition,
    },

    //various settings
    setEffectForMissingHeroes: heroes.setEffectForMissingHeroes,
    setMeteorEffect: SetMeteorEffect,
    setGravity: Gravity.SetGravity,
    setCanTurnInTheAir: (b: boolean) => {
        globals.CAN_TURN_IN_AIR = b
    },
    setStaticSpawnPositions: heroes.setStaticSpawnPositions,

    //helpers
    isHero: IsHero,
    hero2Escaper: Hero2Escaper,

    setPointsEnabled: (enabled: boolean) => {
        ServiceManager.getService('Multiboard').setPointsEnabled(enabled)
    },

    adjustPlayerPoints: (playerId: number, points: number) => {
        ServiceManager.getService('Multiboard').adjustPlayerPoints(playerId, points)
    },

    setPlayerPoints: (playerId: number, points: number) => {
        ServiceManager.getService('Multiboard').setPlayerPoints(playerId, points)
    },

    resetRoundScores: () => {
        ServiceManager.getService('Multiboard').resetRoundScores()
    },

    removeMonsterType: (label: string) => getUdgMonsterTypes().remove(label),
    removeMonsterSpawn: (level: number, ms: string) => getUdgLevels().get(level)?.monsterSpawns.clearMonsterSpawn(ms),

    reinitProgressionMap: (forcedLevelIndex?: number) => progressionUtils.init({ forcedLevelIndex }),
    setWanderMinTime: (time: number) => (globals.wanderMinTime = time),
    setWanderExtraTime: (time: number) => (globals.wanderExtraTime = time),
    setForceReviveAtStart: (b: boolean) => (globals.forceReviveAtStart = b),
    setKillAfkHeroes: (b: boolean) => (globals.killAfkHeroes = b),
    setWanderEffect: (effect: string) => (globals.wanderEffectStr = ReplaceBackslahsesInLinks(effect)),
    setWanderEffectFacing: (b: boolean) => (globals.wanderEffectFacing = b),
    setScoreboardLabel: (label: string) => (globals.scoreboardLabel = label),

    createMonsterNoMoveForLevel: (levelId: number, mtLabel: string, x: number, y: number) => {
        const mt = getUdgMonsterTypes().getByLabel(mtLabel)
        const level = getUdgLevels().get(levelId)

        if (mt && level) {
            level.monsters.new(new MonsterNoMove(mt, x, y, 0), true)
        }
    },

    removeMonsterNoMoveForLevel: (levelId: number, monsterId: number) => {
        const level = getUdgLevels().get(levelId)

        if (level) {
            level.monsters.clearMonster(monsterId)
        }
    },

    errorHandler,
    runInTrigger,

    setAfkTime: (time: number) => {
        AfkMode.timeMinAfk = time
    },

    NewImmobileMonsterUnit: NewImmobileMonster,
    NewPatrolMonsterUnit: NewPatrolMonster,

    e2e,
}

export const initMEC_core_API = () => {
    MEC_core = MEC_core_API
    return MEC_core_API
}
