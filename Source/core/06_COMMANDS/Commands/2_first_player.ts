import { getUdgEscapers, getUdgLevels, getUdgTerrainTypes, globals } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { ThemeUtils } from '../../../Utils/ThemeUtils'
import { IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { Text } from '../../01_libraries/Text'
import { TerrainTypeFromString } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_from_string'
import { ReinitTerrainsPositions } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains_position_Change_variations_and_ut_at_beginning'
import { Globals } from '../../09_From_old_Worldedit_triggers/globals_variables_and_triggers'
import {
    isPlayerId,
    resolvePlayerId,
    resolvePlayerIds,
    resolvePlayerIdsArray,
    USAGE,
} from '../Helpers/Command_functions'

export const initExecuteCommandRed = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'red'

    //-kill(kl) <Pcolor>   --> kills a hero
    registerCommand({
        name: 'kill',
        alias: ['kl'],
        group,
        argDescription: '<Pcolor>',
        description: 'Kills a hero',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            if (escaper.isTrueMaximaxou()) {
                if (isPlayerId(param1)) {
                    if (getUdgEscapers().get(resolvePlayerId(param1)) != null) {
                        getUdgEscapers().get(resolvePlayerId(param1))?.kill()
                    }
                    return true
                }

                if (param1 === 'all' || param1 === 'a') {
                    for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                        if (escaper !== esc && !esc.isEscaperSecondary()) {
                            esc.kill()
                        }
                    }
                }
                return true
            }

            if (isPlayerId(param1) && !getUdgEscapers().get(resolvePlayerId(param1))?.canCheat()) {
                if (getUdgEscapers().get(resolvePlayerId(param1)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param1))?.kill()
                }
            }
            return true
        },
    })

    //-kick(kc) <Pcolor>   --> kicks a player
    registerCommand({
        name: 'kick',
        alias: ['kc'],
        group,
        argDescription: '<Pcolor>',
        description: 'Kicks a player',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            if (escaper.isTrueMaximaxou()) {
                if (isPlayerId(param1)) {
                    const target = getUdgEscapers().get(resolvePlayerId(param1))

                    if (target != null) {
                        escaper.kick(target)
                    }

                    return true
                }
                if (param1 === 'all' || param1 === 'a') {
                    let i = 0
                    while (true) {
                        if (i >= Constants.NB_ESCAPERS) break

                        const target = getUdgEscapers().get(i)

                        if (target != escaper && target != null) {
                            escaper.kick(target)
                        }

                        i = i + 1
                    }
                }
                return true
            }

            const target = getUdgEscapers().get(resolvePlayerId(param1))

            if (isPlayerId(param1) && !target?.canCheat()) {
                if (target != null) {
                    escaper.kick(target)
                }
            }
            return true
        },
    })

    //-restart(-)
    registerCommand({
        name: 'restart',
        alias: [],
        group,
        argDescription: '',
        description: 'Restarts the game',
        cb: ({ noParam }) => {
            if (noParam) {
                getUdgLevels().restartTheGame()
            }
            return true
        },
    })

    //-restartLevel(-)
    registerCommand({
        name: 'restartLevel',
        alias: [],
        group,
        argDescription: '',
        description: 'Restarts the level',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                getUdgLevels().restartCurrentLevel(escaper)
            }
            return true
        },
    })

    //-noobedit
    registerCommand({
        name: 'noobedit',
        alias: ['ne'],
        group,
        argDescription: '<active>',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam === 2 && IsBoolString(param1)) {
                globals.autoreviveDelay = 0.3

                resolvePlayerIds(param2, e => {
                    if (S2B(param1)) {
                        Text.P(escaper.getPlayer(), 'Really? Noobs!')

                        if (e.getId() !== escaper.getId()) {
                            Text.P(e.getPlayer(), 'Really? Noobs!')
                        }

                        e.isNoobedit = true
                        e.setHasAutorevive(true)
                    } else {
                        Text.P(escaper.getPlayer(), "That's better, but you're still Noobs!")

                        if (e.getId() !== escaper.getId()) {
                            Text.P(e.getPlayer(), "That's better, but you're still Noobs!")
                        }

                        e.isNoobedit = false
                        e.setHasAutorevive(false)
                    }
                })
            }

            if (nbParam === 1 && IsBoolString(param1)) {
                if (S2B(param1)) {
                    Text.A('Really? Noobs!')
                } else {
                    if (getUdgLevels().isNoobEdit()) {
                        Text.A("That's better, but you're still Noobs!")
                    }
                }

                getUdgLevels().setIsNoobEdit(S2B(param1))
            }

            return true
        },
    })

    //-speededit
    registerCommand({
        name: 'speededit',
        alias: ['se'],
        group,
        argDescription: '<active> [player]',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (param2.length === 0) param2 = 'all'

            if ((nbParam === 1 || nbParam === 2) && IsBoolString(param1)) {
                resolvePlayerIds(param2, e => {
                    if (S2B(param1)) {
                        Text.P(e.getPlayer(), 'Letsgoooooo!')

                        if (e.getId() !== escaper.getId() && nbParam === 2) {
                            Text.P(escaper.getPlayer(), 'Letsgoooooo!')
                        }

                        e.isSpeedEdit = true
                        e.absoluteSlideSpeed(800, true)
                        e.absoluteRotationSpeed(1.34)
                    } else {
                        Text.P(e.getPlayer(), 'Speed disabled')

                        if (e.getId() !== escaper.getId() && nbParam === 2) {
                            Text.P(escaper.getPlayer(), 'Speed disabled')
                        }

                        e.isSpeedEdit = false
                        e.stopAbsoluteSlideSpeed(true)
                        e.stopAbsoluteRotationSpeed()
                    }
                })

                getUdgLevels().setIsSpeedEdit(S2B(param1))
            }

            return true
        },
    })

    //-setLevelProgression(setlp) all|allied|solo
    registerCommand({
        name: 'setLevelProgression',
        alias: ['setlp'],
        group,
        argDescription: '<all|allied|solo> [player]',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (param1 !== 'all' && param1 !== 'allied' && param1 !== 'solo') {
                Text.erP(escaper.getPlayer(), 'Invalid mode')
                return true
            }

            Text.A(`Level progression changed to: ${param1}`)
            getUdgLevels().setLevelProgression(param1)
            return true
        },
    })

    //-setPointsEnabled(setpe) bool
    registerCommand({
        name: 'setPointsEnabled',
        alias: ['setpe'],
        group,
        argDescription: '<bool>',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (!IsBoolString(param1)) {
                return true
            }

            const enabled = S2B(param1)
            ServiceManager.getService('Multiboard').setPointsEnabled(enabled)
            Text.P(escaper.getPlayer(), `Points have been ${enabled ? 'enabled' : 'disabled'}`)
            return true
        },
    })

    //-setPointsEarnedOnLevelCompletion(setpeolc) number
    registerCommand({
        name: 'setPointsEarnedOnLevelCompletion',
        alias: ['setpeolc'],
        group,
        argDescription: '<number>',
        description: '',
        enabled: () => ServiceManager.getService('Multiboard').arePointsEnabled(),
        cb: ({ param1 }, escaper) => {
            const points = S2I(param1)
            ServiceManager.getService('Multiboard').setPointsEarnedOnLevelCompletion(points)
            Text.P(escaper.getPlayer(), `Points earned on level completion ${points}`)
            return true
        },
    })

    //-setPointsEarnedOnMeteorCompletion(setpeomc) number
    registerCommand({
        name: 'setPointsEarnedOnMeteorCompletion',
        alias: ['setpeomc'],
        group,
        argDescription: '<number>',
        description: '',
        enabled: () => ServiceManager.getService('Multiboard').arePointsEnabled(),
        cb: ({ param1 }, escaper) => {
            const points = S2I(param1)
            ServiceManager.getService('Multiboard').setPointsEarnedOnMeteorCompletion(points)
            Text.P(escaper.getPlayer(), `Points earned on meteor completion ${points}`)
            return true
        },
    })

    //-setPointsEarnedOnMeteorCompletionMaxPerLevel(setpeomcmpl) number
    registerCommand({
        name: 'setPointsEarnedOnMeteorCompletionMaxPerLevel',
        alias: ['setpeomcmpl'],
        group,
        argDescription: '<number>',
        description: '',
        enabled: () => ServiceManager.getService('Multiboard').arePointsEnabled(),
        cb: ({ param1 }, escaper) => {
            const points = S2I(param1)
            ServiceManager.getService('Multiboard').setPointsEarnedOnMeteorCompletionMaxPerLevel(points)
            Text.P(escaper.getPlayer(), `Points earned on meteor completion max per level ${points}`)
            return true
        },
    })

    //-adjustPlayerPoints(adjustpp) <playerId> <points>
    registerCommand({
        name: 'adjustPlayerPoints',
        alias: ['adjustpp'],
        group,
        argDescription: '<playerId> <points>',
        description: '',
        cb: ({ param1, param2 }, escaper) => {
            const playerId = resolvePlayerId(param1)
            const points = S2I(param2)
            ServiceManager.getService('Multiboard').adjustPlayerPoints(playerId, points)
            Text.P(
                escaper.getPlayer(),
                `Player ${getUdgEscapers().get(playerId)?.getDisplayName()} points adjusted by ${points}`
            )
            return true
        },
    })

    //-setPlayerPoints(setpp) <playerId> <points>
    registerCommand({
        name: 'setPlayerPoints',
        alias: ['setpp'],
        group,
        argDescription: '<playerId> <points>',
        description: '',
        cb: ({ param1, param2 }, escaper) => {
            const playerId = resolvePlayerId(param1)
            const points = S2I(param2)
            ServiceManager.getService('Multiboard').setPlayerPoints(playerId, points)
            Text.P(
                escaper.getPlayer(),
                `Player ${getUdgEscapers().get(playerId)?.getDisplayName()} points set to ${points}`
            )
            return true
        },
    })

    //-setGameTheme(-) <theme|off> <units|rocks|terrain|all>
    registerCommand({
        name: 'setGameTheme',
        alias: [],
        group,
        argDescription: '<theme|off> <units|rocks|terrain|all>',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            // Reset theme
            if (IsBoolString(param1) && !S2B(param1)) {
                ThemeUtils.setCurrentTheme(undefined)
                ReinitTerrainsPositions.ReinitTerrainsPosition()
                Text.P(escaper.getPlayer(), 'Theme reset')
                return true
            }

            // Validate parameters
            if (nbParam !== 2) {
                return USAGE
            }

            if (param1 !== 'fullskill' && param1 !== 'murloc' && param1 !== 'rkr') {
                Text.P(escaper.getPlayer(), 'Invalid theme: ' + ['fullskill', 'murloc', 'rkr'].join(', '))
                return true
            }

            if (param2 !== 'units' && param2 !== 'rocks' && param2 !== 'terrain' && param2 !== 'all') {
                Text.P(escaper.getPlayer(), 'Invalid target: must be units, rocks, terrain, or all')
                return true
            }

            const theme = param1 as 'fullskill' | 'murloc' | 'rkr'
            const target = param2 as 'units' | 'rocks' | 'terrain' | 'all'
            const availableThemes = ThemeUtils.availableThemes

            // Handle units (moving monsters)
            if (target === 'units' || target === 'all') {
                ThemeUtils.setCurrentTheme(theme)
                ThemeUtils.applyGameTheme('units')
                Text.P(escaper.getPlayer(), `Applied ${theme} theme to units`)
            }

            // Handle rocks (stationary monsters)
            if (target === 'rocks' || target === 'all') {
                ThemeUtils.setCurrentTheme(theme)
                ThemeUtils.applyGameTheme('rocks')
                Text.P(escaper.getPlayer(), `Applied ${theme} theme to rocks`)
            }

            // Handle terrain
            if (target === 'terrain' || target === 'all') {
                const availableTerrains = Constants.NB_MAX_OF_TERRAINS - Globals.udg_nb_used_terrains
                let createTerrains = 0
                const tt = getUdgTerrainTypes()

                if (!tt.getByCode(availableThemes[theme].slideTerrain)) createTerrains++
                if (!tt.getByCode(availableThemes[theme].deathTerrain)) createTerrains++
                if (!tt.getByCode(availableThemes[theme].walkTerrain)) createTerrains++

                if (createTerrains >= availableTerrains) {
                    Text.P(
                        escaper.getPlayer(),
                        `Failed, limit of ${Constants.NB_MAX_OF_TERRAINS} terrain types reached`
                    )
                    return true
                }

                // Create terrain types if needed
                for (const terrainOrder of availableThemes[theme].terrainOrder) {
                    if (terrainOrder === 'slide') {
                        if (!tt.getByCode(availableThemes[theme].slideTerrain)) {
                            tt.newSlide(
                                `sgt${theme}s`,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].slideTerrain}'`
                                ),
                                550,
                                true
                            )
                        }
                    } else if (terrainOrder === 'death') {
                        if (!tt.getByCode(availableThemes[theme].deathTerrain)) {
                            tt.newDeath(
                                `sgt${theme}d`,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].deathTerrain}'`
                                ),
                                'Abilities\\Spells\\NightElf\\EntanglingRoots\\EntanglingRootsTarget.mdl',
                                0.2,
                                20
                            )
                        }
                    } else if (terrainOrder === 'walk') {
                        if (!tt.getByCode(availableThemes[theme].walkTerrain)) {
                            tt.newWalk(
                                `sgt${theme}w`,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].walkTerrain}'`
                                ),
                                522
                            )
                        }
                    }
                }

                const slideTerrain = tt.getByCode(availableThemes[theme].slideTerrain)
                const deathTerrain = tt.getByCode(availableThemes[theme].deathTerrain)
                const walkTerrain = tt.getByCode(availableThemes[theme].walkTerrain)

                if (!slideTerrain || !deathTerrain || !walkTerrain) {
                    Text.P(escaper.getPlayer(), 'Failed to create terrain types')
                    return true
                }

                // Modify existing terrains
                for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
                    for (const terrainOrder of availableThemes[theme].terrainOrder) {
                        if (
                            terrainOrder === 'slide' &&
                            terrainType.kind === 'slide' &&
                            terrainType.terrainTypeId !== slideTerrain.terrainTypeId
                        ) {
                            ThemeUtils.modifyTerrain(
                                terrainType.terrainTypeId,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].slideTerrain}'`
                                )
                            )
                        } else if (
                            terrainOrder === 'death' &&
                            terrainType.kind === 'death' &&
                            terrainType.terrainTypeId !== deathTerrain.terrainTypeId
                        ) {
                            ThemeUtils.modifyTerrain(
                                terrainType.terrainTypeId,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].deathTerrain}'`
                                )
                            )
                        } else if (
                            terrainOrder === 'walk' &&
                            terrainType.kind === 'walk' &&
                            terrainType.terrainTypeId !== walkTerrain.terrainTypeId
                        ) {
                            ThemeUtils.modifyTerrain(
                                terrainType.terrainTypeId,
                                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(
                                    `'${availableThemes[theme].walkTerrain}'`
                                )
                            )
                        }
                    }
                }

                Text.P(escaper.getPlayer(), `Applied ${theme} theme to terrain`)
            }

            Text.A(`Welcome to: ${theme} 2.0`)
            return true
        },
    })

    //-setMonsterSkin <unitId|off>
    registerCommand({
        name: 'setMonsterSkin',
        alias: [],
        group,
        argDescription: '<unitId|off>',
        description: 'Change monster skin',
        cb: ({ param1 }, escaper) => {
            // Reset to default
            if (IsBoolString(param1) && !S2B(param1)) {
                ThemeUtils.setCustomMonsterSkin(undefined)

                for (const [_, level] of pairs(getUdgLevels().getAll())) {
                    if (level.isActivated()) {
                        for (const [_, monster] of pairs(level.monsters.getAll())) {
                            if (monster.u) {
                                monster.setMonsterSkin(undefined)
                            }
                        }

                        for (const [_, monsterSpawn] of pairs(level.monsterSpawns.getAll())) {
                            monsterSpawn.refresh()
                        }
                    }
                }

                Text.P(escaper.getPlayer(), 'Monster skins reset to default')
                return true
            }

            const skinId = FourCC(param1)
            ThemeUtils.setCustomMonsterSkin(skinId)

            for (const [_, level] of pairs(getUdgLevels().getAll())) {
                if (level.isActivated()) {
                    for (const [_, monster] of pairs(level.monsters.getAll())) {
                        if (monster.u) {
                            monster.setMonsterSkin(skinId)
                        }
                    }

                    for (const [_, monsterSpawn] of pairs(level.monsterSpawns.getAll())) {
                        monsterSpawn.refresh()
                    }
                }
            }

            Text.P(escaper.getPlayer(), `Monster skin changed to: ${param1}`)
            return true
        },
    })

    //-overrideCommandAccess(oca) <view|grant|revoke> <cmd> <player|all>
    registerCommand({
        name: 'overrideCommandAccess',
        alias: ['oca'],
        group,
        argDescription: '<view | grant | revoke> <cmd> <player|all>',
        description: 'Override command access',
        cb: ({ param1, param2, param3 }, escaper) => {
            if (param1 !== 'view' && param1 !== 'grant' && param1 !== 'revoke') {
                return true
            }

            const cmd = ServiceManager.getService('Cmd').findTargetCommandSingle(param2, escaper)

            if (!cmd) {
                Text.P(escaper.getPlayer(), 'You need access to this command to be able to override it')
                return true
            }

            switch (param1) {
                case 'view': {
                    const targets = resolvePlayerIdsArray(param3)

                    for (const target of targets) {
                        Text.P(
                            escaper.getPlayer(),
                            `${target.getDisplayName()}: ${cmd.name}: ${
                                target.cmdAccessMap[cmd.name] ? 'Access' : 'No access'
                            }`
                        )
                    }

                    targets.__destroy()
                    break
                }

                case 'grant': {
                    const targets = resolvePlayerIdsArray(param3)

                    for (const target of targets) {
                        target.cmdAccessMap[cmd.name] = true
                        Text.P(escaper.getPlayer(), `${target.getDisplayName()}: ${cmd.name}: access granted`)
                    }

                    targets.__destroy()
                    break
                }

                case 'revoke': {
                    const targets = resolvePlayerIdsArray(param3)

                    for (const target of targets) {
                        delete target.cmdAccessMap[cmd.name]
                        Text.P(escaper.getPlayer(), `${target.getDisplayName()}: ${cmd.name}: access revoked`)
                    }

                    targets.__destroy()
                    break
                }

                default: {
                    Text.P(escaper.getPlayer(), 'Invalid mode')
                    break
                }
            }

            return true
        },
    })

    //-day
    registerCommand({
        name: 'day',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: () => {
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
            SetTimeOfDayScale(0.0)
            return true
        },
    })

    //-night
    registerCommand({
        name: 'night',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: () => {
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 0.0)
            SetTimeOfDayScale(0.0)
            return true
        },
    })
}
