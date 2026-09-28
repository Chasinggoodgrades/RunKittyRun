import {
    getUdgCasterTypes,
    getUdgEscapers,
    getUdgLevels,
    getUdgMonsterTypes,
    getUdgTerrainTypes,
    globals,
    setHeroModelPath,
} from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { progressionUtils } from '../../../Utils/ProgressionUtils'
import { IsBoolString, IsEscaperInGame, jsonDecode, jsonEncode, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { Text } from '../../01_libraries/Text'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { GetMirrorEscaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { SaveLoad } from '../../04_STRUCTURES/Escaper/Escaper_StartCommands'
import {
    auditContactChunks,
    getContactChunkStats,
    getContactChunkTierSizes,
    isContactChunksAuditWatched,
    rebuildContactChunks,
    setContactChunksAuditWatch,
    setContactChunkTierSizes,
} from '../../04_STRUCTURES/Monster/ContactChunks'
import { HorizontalRegionDirection } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import { MakeMECRegionMode } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeMECRegion'
import { SaveMapInCache } from '../../07_TRIGGERS/Save_map_in_gamecache/SaveMapInCache'
import { ReinitTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains'
import { ReinitTerrainsPositions } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains_position_Change_variations_and_ut_at_beginning'
import { AfkMode } from '../../08_GAME/Afk_mode/Afk_mode'
import { Globals } from '../../09_From_old_Worldedit_triggers/globals_variables_and_triggers'
import { MEC_core_API } from '../../API/MEC_core_API'
import { udg_doubleHeroesEnabled } from '../../Double_heroes/double_heroes_config'
import { setDesyncProbeEnabled } from '../../Log/DesyncProbe'
import { flushLogs } from '../../Log/log'
import { e2e } from '../../Test/e2e-tests/base/e2e-tests-base'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { isPlayerId, resolvePlayerId, USAGE } from '../Helpers/Command_functions'
import { ActivateTeleport, DisableTeleport } from '../Helpers/Teleport'

export const initExecuteCommandMax = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'max'

    //-reinitTerrains(rit)   --> rekinds of terrain
    registerCommand({
        name: 'reinitTerrains',
        alias: ['rit'],
        group,
        argDescription: '',
        description: 'ReinitTerrains(<nb>): reinitializes terrains type with <nb> terrains',
        cb: ({ noParam }) => {
            if (noParam) {
                ReinitTerrains.ReinitTerrains()
            }
            return true
        },
    })

    //-reinitTerrainsPosition(ritp)   --> rethe terrain on the map
    registerCommand({
        name: 'reinitTerrainsPosition',
        alias: ['ritp'],
        group,
        argDescription: '',
        description: 'Reinitializes the terrain on the map as it was at start of the game',
        cb: ({ noParam }) => {
            if (noParam) {
                ReinitTerrainsPositions.ReinitTerrainsPosition()
            }
            return true
        },
    })

    //-control(cl) <Pcolor1>|all(a) [<Pcolor2>]   --> gives the control of a hero to player <Pcolor2>
    registerCommand({
        name: 'control',
        alias: ['cl'],
        group,
        argDescription: '<Pcolor1>|all(a) [<Pcolor2>]',
        description: 'Gives the control of a hero to player <Pcolor2>',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2)) {
                return true
            }

            let escaper2: Escaper | null

            if (nbParam === 2) {
                if (!isPlayerId(param2)) {
                    Text.erP(escaper.getPlayer(), 'param2 should be a player color')
                    return true
                }
                escaper2 = getUdgEscapers().get(resolvePlayerId(param2))
                if (escaper2 === null) {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param2 + " doesn't exist")
                    return true
                }
            } else {
                escaper2 = escaper
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) !== null) {
                        getUdgEscapers().get(i)?.giveHeroControl(escaper2)
                    }
                    i = i + 1
                }
                if (escaper === escaper2) {
                    Text.P(escaper.getPlayer(), 'all heroes are now yours')
                } else {
                    Text.P(escaper.getPlayer(), 'all heroes are now to player ' + param2)
                }
                return true
            }
            if (isPlayerId(param1)) {
                let n = resolvePlayerId(param1)
                if (getUdgEscapers().get(n) !== null) {
                    getUdgEscapers().get(n)?.giveHeroControl(escaper2)
                    GetMirrorEscaper(getUdgEscapers().get(n))?.giveHeroControl(escaper2)
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param1 + " doesn't exist")
                    return true
                }
                if (escaper === escaper2) {
                    Text.P(escaper.getPlayer(), 'hero of player ' + param1 + ' is now yours')
                } else {
                    Text.P(escaper.getPlayer(), 'hero of player ' + param1 + ' is now to player ' + param2)
                }
            }
            return true
        },
    })

    //-resetOwners(ro)   --> gives back the control of heroes to their owner
    registerCommand({
        name: 'resetOwners',
        alias: ['ro'],
        group,
        argDescription: '',
        description: 'Gives back the control of heroes to their owner',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) !== null) {
                        getUdgEscapers().get(i)?.resetOwner()
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'all heroes are now to their owners')
            }
            return true
        },
    })

    //-setlives(setl) <nbLives>
    registerCommand({
        name: 'setlives',
        alias: ['setl'],
        group,
        argDescription: '<nbLives>',
        description: 'Sets the number of lives',
        cb: ({ nbParam, param1 }) => {
            if (!(nbParam === 1 && IsPositiveInteger(param1))) {
                return true
            }
            ServiceManager.getService('Lives').setNb(S2I(param1))
            return true
        },
    })

    //-teleport(t) <boolean status>   --> enable or disable teleport trigger
    registerCommand({
        name: 'teleport',
        alias: ['t'],
        group,
        argDescription: '<boolean status>',
        description: 'Enables or disables teleport trigger',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'param1 should be a boolean or a real')
                return true
            }

            const hero = escaper.getHero()
            if (hero) {
                if (S2B(param1)) {
                    ActivateTeleport(hero, false)
                    Text.P(escaper.getPlayer(), 'teleport on')
                } else {
                    DisableTeleport(hero)
                    Text.P(escaper.getPlayer(), 'teleport off')
                }
            }
            return true
        },
    })

    //-redRights(redr) <boolean status>
    registerCommand({
        name: 'redRights',
        alias: ['redr'],
        group,
        argDescription: '<boolean status>',
        description: 'Enables or disables red rights',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1 && IsBoolString(param1))) {
                return true
            }
            Globals.udg_areRedRightsOn = S2B(param1)
            if (S2B(param1)) {
                Text.P(escaper.getPlayer(), 'red rights on')
            } else {
                Text.P(escaper.getPlayer(), 'red rights off')
            }
            return true
        },
    })

    //-autorevive(ar) [<boolean status> [<Pcolor>|all(a)]]
    registerCommand({
        name: 'autorevive',
        alias: ['ar'],
        group,
        argDescription: '<boolean status> [<Pcolor>|all(a)]',
        description: 'Enables or disables autorevive',
        cb: ({ noParam, nbParam, param1, param2 }, escaper) => {
            if (noParam) {
                escaper.setHasAutorevive(true)
                Text.P(escaper.getPlayer(), 'you have now autorevive to on')
                return true
            }
            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'param1 should be a boolean')
                return true
            }
            let b = S2B(param1)
            if (nbParam === 1) {
                escaper.setHasAutorevive(b)
                if (b) {
                    Text.P(escaper.getPlayer(), 'you have now autorevive to on')
                } else {
                    Text.P(escaper.getPlayer(), 'you have now autorevive to off')
                }
                return true
            }
            if (!(nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'no more than 2 params allowed for this command')
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) !== null) {
                        getUdgEscapers().get(i)?.setHasAutorevive(b)
                    }
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'autorevive to on for all')
                } else {
                    Text.P(escaper.getPlayer(), 'autorevive to off for all')
                }
                return true
            }
            if (isPlayerId(param2)) {
                let n = resolvePlayerId(param2)
                if (getUdgEscapers().get(n) !== null) {
                    getUdgEscapers().get(n)?.setHasAutorevive(b)
                    if (b) {
                        Text.P(escaper.getPlayer(), 'autorevive to on for player ' + param2)
                    } else {
                        Text.P(escaper.getPlayer(), 'autorevive to off for player ' + param2)
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param2 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param2 should be a player color or "all"')
            }
            return true
        },
    })

    //-createHero(crh) [<Pcolor>|all(a)]
    registerCommand({
        name: 'createHero',
        alias: ['crh'],
        group,
        argDescription: '<Pcolor>|all(a)',
        description: 'Creates a hero for the player',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                if (!escaper.createHeroAtStart()) {
                    Text.erP(escaper.getPlayer(), 'You already have a hero !')
                }

                getUdgLevels().deactivateEmptyLevels()
                return true
            }
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'no more than one param allowed for this command')
                return true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) == null) {
                        getUdgEscapers().newAt(i)
                        if (udg_doubleHeroesEnabled) {
                            getUdgEscapers().newAt(i + Constants.NB_PLAYERS_MAX)
                        }
                    }
                    getUdgEscapers().get(i)?.createHeroAtStart()
                    if (udg_doubleHeroesEnabled) {
                        getUdgEscapers()
                            .get(i + Constants.NB_PLAYERS_MAX)
                            ?.createHeroAtStart()
                    }
                    i = i + 1
                }

                getUdgLevels().deactivateEmptyLevels()
                return true
            }
            if (isPlayerId(param1)) {
                let n = resolvePlayerId(param1)
                if (getUdgEscapers().get(n) == null) {
                    getUdgEscapers().newAt(n)
                    if (udg_doubleHeroesEnabled) {
                        getUdgEscapers().newAt(n + Constants.NB_PLAYERS_MAX)
                    }
                }
                if (!getUdgEscapers().get(n)?.createHeroAtStart()) {
                    Text.erP(escaper.getPlayer(), 'this player already has a hero')
                }
                if (udg_doubleHeroesEnabled) {
                    getUdgEscapers()
                        .get(n + Constants.NB_PLAYERS_MAX)
                        ?.createHeroAtStart()
                }

                getUdgLevels().deactivateEmptyLevels()
            }

            return true
        },
    })

    //-deleteHero(delh) [<Pcolor>|all(a)]
    registerCommand({
        name: 'deleteHero',
        alias: ['delh'],
        group,
        argDescription: '<Pcolor>|all(a)',
        description: 'Deletes a hero for the player',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.removeHero()
                getUdgLevels().deactivateEmptyLevels()
                return true
            }

            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'no more than one param allowed for this command')
                return true
            }

            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (i < Constants.NB_ESCAPERS) {
                    if (
                        getUdgEscapers().get(i) != null &&
                        getUdgEscapers().get(i) != escaper &&
                        !getUdgEscapers().get(i)?.isEscaperSecondary()
                    ) {
                        if (IsEscaperInGame(i)) {
                            getUdgEscapers().get(i)?.removeHero()
                        } else {
                            getUdgEscapers().destroyEscaper(i)
                        }
                    }
                    i = i + 1
                }

                getUdgLevels().deactivateEmptyLevels()
                return true
            }

            if (isPlayerId(param1)) {
                let n = resolvePlayerId(param1)
                if (getUdgEscapers().get(n) != null) {
                    if (IsEscaperInGame(n)) {
                        getUdgEscapers().get(n)?.removeHero()
                    } else {
                        getUdgEscapers().destroyEscaper(n)
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param1 + " doesn't exist")
                }

                getUdgLevels().deactivateEmptyLevels()
            } else {
                Text.erP(escaper.getPlayer(), 'param1 should be a player color or "all"')
            }
            return true
        },
    })

    //-canCheat(cc) <Pcolor>|all(a) [<boolean status>]
    registerCommand({
        name: 'canCheat',
        alias: ['cc'],
        group,
        argDescription: '<Pcolor>|all(a) [<boolean status>]',
        description: 'Sets the canCheat status for the player',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'one or two params for this command')
                return true
            }

            let b = false

            if (nbParam === 2) {
                if (IsBoolString(param2)) {
                    b = S2B(param2)
                } else {
                    Text.erP(escaper.getPlayer(), 'param2 must be a boolean')
                    return true
                }
            } else {
                b = true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null && getUdgEscapers().get(i) != escaper) {
                        if (!getUdgEscapers().get(i)?.isMaximaxou()) {
                            getUdgEscapers().get(i)?.setCanCheat(b)
                        }
                    }
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'all players can now cheat and make')
                } else {
                    Text.P(escaper.getPlayer(), "all players who haven't Maximaxou rights can't cheat or make anymore")
                }
                return true
            }
            if (isPlayerId(param1)) {
                let n = resolvePlayerId(param1)
                if (getUdgEscapers().get(n) != null) {
                    if (getUdgEscapers().get(n) != escaper) {
                        if (!getUdgEscapers().get(n)?.isMaximaxou()) {
                            getUdgEscapers().get(n)?.setCanCheat(b)
                            if (b) {
                                Text.P(escaper.getPlayer(), 'player ' + param1 + ' can now cheat and make')
                            } else {
                                Text.P(escaper.getPlayer(), 'player ' + param1 + ' no longer can cheat and make')
                            }
                        } else {
                            Text.erP(
                                escaper.getPlayer(),
                                "you can't change rights of player " + param1 + ', he has Maximaxou rights like you'
                            )
                        }
                    } else {
                        Text.erP(escaper.getPlayer(), "you can't change your own rights")
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param1 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param1 must be a player color or "all"')
            }
            return true
        },
    })

    //-setAfkTime(setafkt) <time>
    registerCommand({
        name: 'setAfkTime',
        alias: ['setafkt'],
        group,
        argDescription: '<time>',
        description: 'Sets the afk time',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1 || S2I(param1) <= 0) {
                return USAGE
            }
            AfkMode.timeMinAfk = S2R(param1)
            Text.P(escaper.getPlayer(), 'afk time to ' + param1)
            return true
        },
    })

    //-setAutoreviveDelay(setard) <time>   --> maximum 15 seconds
    registerCommand({
        name: 'setAutoreviveDelay',
        alias: ['setard'],
        group,
        argDescription: '<time>',
        description: 'Sets the autorevive delay, maximum 15 seconds',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1 && (S2R(param1) > 0 || param1 === '0') && S2R(param1) <= 15)) {
                return USAGE
            }
            let x = S2R(param1)
            globals.autoreviveDelay = x
            if (x > 1) {
                Text.P(escaper.getPlayer(), 'autorevive delay to ' + R2S(x) + ' seconds')
            } else {
                Text.P(escaper.getPlayer(), 'autorevive delay to ' + R2S(x) + ' second')
            }
            return true
        },
    })

    //-saveMapInCache(smic)
    registerCommand({
        name: 'saveMapInCache',
        alias: ['smic'],
        group,
        argDescription: '[<outputFilename> [withoutTerrain|wt]]',
        description:
            'Saves the map in cache for usage with mec-smic-loader. If you specify "withoutTerrain" as second parameter, the data will be lighter but not usable with smic-loader, only with -lmfc command.',
        cb: ({ noParam, param1, param2, nbParam }, escaper) => {
            if (nbParam > 2) {
                return USAGE
            }

            let withTerrain = true
            if (nbParam === 2) {
                if (param2 !== 'withoutTerrain' && param2 !== 'wt') {
                    return USAGE
                }
                withTerrain = false
            }

            if (noParam) {
                SaveMapInCache.smic(escaper.getPlayer(), withTerrain)
            } else {
                SaveMapInCache.smic(escaper.getPlayer(), withTerrain, `MEC/mec-smic-data-custom_${param1}.txt`)
            }
            return true
        },
    })

    //-loadMapFromCache(lmfc)
    registerCommand({
        name: 'loadMapFromCache',
        alias: ['lmfc'],
        group,
        argDescription: '[<smicName>]',
        description:
            'Loads the specified map from cache created with -smic. If no parameter, loads the last cache saved during this game.',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (nbParam > 1) {
                return USAGE
            }

            if (noParam && SaveMapInCache.lastSaveFile === '') {
                Text.erP(escaper.getPlayer(), 'First use -smic in this game, or specify a smicName')
                return true
            }

            Text.A('Loading map from cache...')
            SaveLoad.readFile(
                noParam ? SaveMapInCache.lastSaveFile : `MEC/mec-smic-data-custom_${param1}.txt`,
                Natives.UGetTriggerPlayer(),
                data => {
                    const gameData = (jsonDecode(data) as any).gameData

                    MEC_core_API.setGameData(jsonEncode(gameData), false)
                    Text.A('Loading map from cache done.')
                },
                false
            )

            return true
        },
    })

    //-removeTerrain(remt) <terrainLabel>
    registerCommand({
        name: 'removeTerrain',
        alias: ['remt'],
        group,
        argDescription: '<terrainLabel>',
        description: 'Removes a terrain from the map',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (getUdgTerrainTypes().remove(param1)) {
                Text.mkP(escaper.getPlayer(), 'Terrain removed')
            } else {
                Text.erP(escaper.getPlayer(), 'Unknown terrain')
            }
            return true
        },
    })

    //-removeMonster(remm) <monsterLabel>
    registerCommand({
        name: 'removeMonster',
        alias: ['remm'],
        group,
        argDescription: '<monsterLabel>',
        description: 'Removes a monster from the map',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (getUdgMonsterTypes().remove(param1)) {
                Text.mkP(escaper.getPlayer(), 'monster type removed')
            } else {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
            }
            return true
        },
    })

    //-removeLastLevel(remll)
    registerCommand({
        name: 'removeLastLevel',
        alias: ['remll'],
        group,
        argDescription: '',
        description: 'Removes the last level from the map',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                if (getUdgLevels().destroyLastLevel()) {
                    Text.mkP(
                        escaper.getPlayer(),
                        'level number ' + I2S(getUdgLevels().getLastLevelId() + 1) + ' destroyed'
                    )
                } else {
                    Text.erP(escaper.getPlayer(), 'impossible to destroy the first level')
                }
            }
            return true
        },
    })

    //-removeCaster(remc) <casterLabel>
    registerCommand({
        name: 'removeCaster',
        alias: ['remc'],
        group,
        argDescription: '<casterLabel>',
        description: 'Removes a caster from the map',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //apply command
            getUdgCasterTypes().remove(param1)
            Text.mkP(escaper.getPlayer(), 'caster type removed')
            return true
        },
    })

    //-setTerrainsOrder(setto) <terrainLabels>
    registerCommand({
        name: 'setTerrainsOrder',
        alias: ['setto'],
        group,
        argDescription: '<terrainLabels>',
        description: 'Sets the order of the terrains',
        cb: ({ cmd }, escaper) => {
            if (getUdgTerrainTypes().setOrder(cmd)) {
                Text.mkP(escaper.getPlayer(), 'terrains order set')
            } else {
                Text.erP(
                    escaper.getPlayer(),
                    "couldn't terrains order. Usage : put all the terrain types as parameters, once each"
                )
            }
            return true
        },
    })

    //-setTerrainCliffClass(settcc) <terrainLabel> <cliffClass>
    registerCommand({
        name: 'setTerrainCliffClass',
        alias: ['settcc'],
        group,
        argDescription: '<terrainLabel> <cliffClass>',
        description: 'Sets the cliff class of a terrain',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            let b = getUdgTerrainTypes().getByLabel(param1) != null
            if (!b) {
                return true
            }
            //checkParam 2
            if (param2 !== '1' && param2 !== '2') {
                Text.erP(escaper.getPlayer(), 'cliff class must be 1 or 2')
            }
            //apply command
            getUdgTerrainTypes().getByLabel(param1)?.setCliffClassId(S2I(param2))
            Text.mkP(escaper.getPlayer(), 'cliff class changed to ' + param2)
            return true
        },
    })

    //-setMainTile<tileset>
    registerCommand({
        name: 'setMainTileset',
        alias: [],
        group,
        argDescription: '<tileset>',
        description: 'Sets the main tileset',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam > 1) {
                return true
            }
            if (getUdgTerrainTypes().setMainTileset(param1)) {
                Text.mkP(escaper.getPlayer(), 'main tilechanged')
            } else {
                Text.P(
                    escaper.getPlayer(),
                    'available tilesets : ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'auto|r ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'A|r = Ashenvale ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'B|r = Barrens ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'C|r = Felwood ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'D|r = Dungeon ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'F|r = Lordaeron Fall ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'G|r = Underground ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'L|r = Lordaeron Summer ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'N|r = Northrend ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'Q|r = Village Fall ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'V|r = Village ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'W|r = Lordaeron Winter ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'X|r = Dalaran ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'Y|r = Cityscape ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'Z|r = Sunken Ruins ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'I|r = Icecrown ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'J|r = Dalaran Ruins ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'O|r = Outland ; ' +
                        Text.MAKE_TEXT_COLORCODE +
                        'K|r = Black Citadel'
                )
            }
            return true
        },
    })

    //-logs
    registerCommand({
        name: 'logs',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }) => {
            if (noParam) {
                flushLogs()
            }

            return true
        },
    })

    //-clickWhereYouAre
    registerCommand({
        name: 'clickWhereYouAre',
        alias: ['cwya'],
        group,
        argDescription: '[<boolean status> [<Pcolor>|all(a)]]',
        description: 'Toggles or sets click where you are feature',
        cb: ({ noParam, nbParam, param1, param2 }, escaper) => {
            if (noParam) {
                // Toggle for self
                const currentState = escaper.tClickWhereYouAre !== null
                escaper.enableClickWhereYouAre(!currentState)
                if (!currentState) {
                    Text.P(escaper.getPlayer(), 'you now turn')
                } else {
                    Text.P(escaper.getPlayer(), 'you stop turn')
                }
                return true
            }

            if (!(nbParam === 1 || nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'zero, one or two params for this command')
                return true
            }

            let b = false

            if (nbParam === 2) {
                if (IsBoolString(param1)) {
                    b = S2B(param1)
                } else {
                    Text.erP(escaper.getPlayer(), 'param1 must be a boolean')
                    return true
                }
            } else if (nbParam === 1) {
                if (IsBoolString(param1)) {
                    // Single boolean param applies to self
                    b = S2B(param1)
                    escaper.enableClickWhereYouAre(b)
                    if (b) {
                        Text.P(escaper.getPlayer(), 'you now turn')
                    } else {
                        Text.P(escaper.getPlayer(), 'you stop turn')
                    }
                    return true
                } else {
                    Text.erP(escaper.getPlayer(), 'param1 must be a boolean')
                    return true
                }
            }

            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    getUdgEscapers().get(i)?.enableClickWhereYouAre(b)
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'all players now turn')
                } else {
                    Text.P(escaper.getPlayer(), 'all players stop turn')
                }
                return true
            }
            if (isPlayerId(param2)) {
                let n = resolvePlayerId(param2)
                if (getUdgEscapers().get(n) != null) {
                    getUdgEscapers().get(n)?.enableClickWhereYouAre(b)
                    if (b) {
                        Text.P(escaper.getPlayer(), 'player ' + param2 + ' now turn')
                    } else {
                        Text.P(escaper.getPlayer(), 'player ' + param2 + ' no longer turn')
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param2 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param2 must be a player color or "all"')
            }
            return true
        },
    })

    //-reinitProgressionMap ['level' | 'distance' | 'bfs' | 'segment']
    registerCommand({
        name: 'reinitProgressionMap',
        alias: [],
        group,
        argDescription: "['level' | 'distance' | 'bfs' | 'segment']",
        description: '',
        cb: ({ param1 }, escaper) => {
            Text.P(escaper.getPlayer(), 'Reinitializing progression map')

            if (param1.length > 0) {
                if (param1 !== 'level' && param1 !== 'distance' && param1 !== 'bfs' && param1 !== 'segment') {
                    Text.erP(escaper.getPlayer(), 'param1 must be "level" or "distance" or "bfs" or "segment"')
                    return true
                }

                progressionUtils.init({ debug: param1 })
            } else {
                progressionUtils.init()
            }

            Text.P(escaper.getPlayer(), 'Done')
            return true
        },
    })

    //-createDebugMecRegion(crdebmr)
    registerCommand({
        name: 'createDebugMecRegion',
        alias: ['crdebmr'],
        group,
        argDescription: '[<mode> [<directionForHorizontal>]]',
        description:
            'Mode can be "horizRect", "rect", "parallelogram", "trapeze", "circle" or "line" (defaults to "horizRect"). Direction for horizRect can be "up", "down", "left" or "right" (defaults to "up")',
        cb: ({ param1, param2, nbParam }, escaper) => {
            if (nbParam > 2) {
                return USAGE
            }

            let mode: MakeMECRegionMode = 'horizRect'
            if (nbParam >= 1) {
                if (
                    param1 === 'horizRect' ||
                    param1 === 'rect' ||
                    param1 === 'circle' ||
                    param1 === 'line' ||
                    param1 == 'parallelogram' ||
                    param1 == 'trapeze'
                ) {
                    mode = param1
                } else {
                    return USAGE
                }
            }

            let directionForHorizontal: HorizontalRegionDirection = 'up'
            if (nbParam === 2) {
                if (!['up', 'down', 'left', 'right'].includes(param2)) {
                    return USAGE
                } else {
                    directionForHorizontal = param2 as HorizontalRegionDirection
                }
            }

            escaper.makeCreateDebugMECRegions(mode, directionForHorizontal)

            Text.mkP(escaper.getPlayer(), 'MakeCreateDebugMECRegions enabled')
            return true
        },
    })

    //-setHeroModelPath(shmp) [<modelPath>]
    registerCommand({
        name: 'setHeroModelPath',
        alias: [],
        group,
        argDescription: '[<modelPath>]',
        description:
            'Sets the model the hero is drawn with while an effect stands in for its unit, during an async slide. ' +
            'Persistent between "smiced" games. Without an argument, tells the one in use.',
        cb: ({ nbParam, param1 }, escaper) => {
            const p = escaper.getPlayer()

            if (nbParam === 0) {
                Text.mkP(p, `Hero model path: ${globals.heroModelPath}`)
                return true
            }

            if (nbParam !== 1) {
                return USAGE
            }

            setHeroModelPath(param1)

            Text.mkP(p, `Hero model path set to "${param1}"`)

            return true
        },
    })

    //-desyncProbe <boolean>   --> prints, once a second on every machine, what must be the same on all of them
    registerCommand({
        name: 'desyncProbe',
        alias: [],
        group,
        argDescription: '<boolean>',
        description:
            'Writes, once a second and on every machine, values that must be the same on all of them, to ' +
            'CustomMapData/MEC/desync_probe_p<player number>.txt. After a desync, every player sends their file: ' +
            'the first value that differs at the same probe tick shows what diverged.',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1 || !IsBoolString(param1)) {
                return USAGE
            }

            setDesyncProbeEnabled(S2B(param1))
            Text.mkP(
                escaper.getPlayer(),
                S2B(param1)
                    ? 'Desync probe on: every machine writes its last minute to CustomMapData/MEC/desync_probe_p<player number>.txt'
                    : 'Desync probe off'
            )

            return true
        },
    })

    //-contactChunks [stats | audit | rebuild | tiers <chunkSize> [<chunkSize> ...]]
    registerCommand({
        name: 'contactChunks',
        alias: [],
        group,
        argDescription: '[stats | audit | auditWatch | auditUnwatch | rebuild | tiers <chunkSize> [<chunkSize> ...]]',
        description:
            "Reads or retunes the contact chunks, the index MEC's own contact check finds the monsters of a hero with. " +
            'Chunk sizes are given in units, from the finest up; a tier holding the whole map is always added on top of them.',
        cb: ({ nbParam, param1, param2, param3, param4, param5, param6, param7 }, escaper) => {
            const p = escaper.getPlayer()

            if (nbParam === 0 || param1 === 'stats') {
                if (nbParam > 1) {
                    return USAGE
                }

                for (const line of getContactChunkStats()) {
                    Text.mkP(p, line)
                }

                return true
            }

            if (param1 === 'audit') {
                if (nbParam !== 1) {
                    return USAGE
                }

                const offenders = auditContactChunks()

                if (offenders.length === 0) {
                    Text.mkP(p, 'Contact chunks audit: every registered monster stands in its own chunks.')
                    return true
                }

                Text.erP(p, `Contact chunks audit: ${offenders.length} monsters outside their chunks:`)

                for (const line of offenders) {
                    Text.erP(p, line)
                }

                return true
            }

            if (param1 === 'auditWatch' || param1 === 'auditUnwatch') {
                if (nbParam !== 1) {
                    return USAGE
                }

                const isWatching = param1 === 'auditWatch'

                if (isWatching === isContactChunksAuditWatched()) {
                    Text.erP(p, `The contact chunks audit is already ${isWatching ? 'watched' : 'unwatched'}.`)
                    return true
                }

                setContactChunksAuditWatch(isWatching)

                Text.mkP(
                    p,
                    isWatching
                        ? 'Contact chunks audited every second. Nothing is said while nothing is wrong.'
                        : 'Contact chunks no longer audited.'
                )

                return true
            }

            if (param1 === 'rebuild') {
                if (nbParam !== 1) {
                    return USAGE
                }

                rebuildContactChunks(true)
                return true
            }

            if (param1 !== 'tiers') {
                return USAGE
            }

            if (nbParam < 2) {
                Text.mkP(p, `Contact chunk tiers: ${getContactChunkTierSizes().join(', ')} units`)
                return true
            }

            const tierSizes: number[] = []

            for (const param of [param2, param3, param4, param5, param6, param7]) {
                if (param === '') {
                    break
                }

                const chunkSize = S2I(param)

                if (!IsPositiveInteger(param) || chunkSize < Constants.LARGEUR_CASE) {
                    Text.erP(p, `Wrong chunk size "${param}": at least ${Constants.LARGEUR_CASE} units expected.`)
                    return true
                }

                if (tierSizes.length > 0 && chunkSize <= tierSizes[tierSizes.length - 1]) {
                    Text.erP(p, 'The chunk sizes have to be given from the finest up.')
                    return true
                }

                tierSizes[tierSizes.length] = chunkSize
            }

            setContactChunkTierSizes(tierSizes)
            Text.mkP(p, `Contact chunk tiers set to ${tierSizes.join(', ')} units.`)

            return true
        },
    })

    //-e2e tests
    registerCommand({
        name: 'e2e',
        alias: [],
        group,
        argDescription: '[run] <testName> | ls | speed <percentage> | stop | pause | resume',
        description: 'Handles the e2e tests.',
        cb: ({ param1, param2, nbParam }, escaper) => {
            if (nbParam > 2 || nbParam === 0) {
                return USAGE
            }

            switch (param1) {
                case 'ls':
                    if (nbParam !== 1) {
                        return USAGE
                    }
                    e2e.listTests(escaper)
                    break

                case 'stop':
                    if (nbParam !== 1) {
                        return USAGE
                    }
                    e2e.stop()
                    break

                case 'speed':
                    if (nbParam !== 2) {
                        return USAGE
                    }
                    const speed = Number(param2)
                    e2e.setSpeed(speed)
                    break

                case 'pause':
                    if (nbParam !== 1) {
                        return USAGE
                    }
                    e2e.pause()
                    break

                case 'resume':
                    if (nbParam !== 1) {
                        return USAGE
                    }
                    e2e.resume()
                    break

                case 'nextStep':
                    if (nbParam !== 1) {
                        return USAGE
                    }
                    e2e.nextStep()
                    break

                case 'run':
                    if (nbParam !== 2) {
                        return USAGE
                    }
                    e2e.startTest(param2)
                    break

                default:
                    e2e.startTest(param1)
            }

            return true
        },
    })

    //-debugLongDistanceMoves
    registerCommand({
        name: 'debugLongDistanceMoves',
        alias: [],
        group,
        argDescription: '<boolean>',
        description: 'Disables all effects',
        cb: ({ param1, nbParam }, escaper) => {
            if (nbParam != 1 || !IsBoolString(param1)) {
                return USAGE
            }

            globals.debugLongDistanceMoves = S2B(param1)
            Text.mkP(escaper.getPlayer(), 'debugLongDistanceMoves set to ' + param1)

            return true
        },
    })
}
