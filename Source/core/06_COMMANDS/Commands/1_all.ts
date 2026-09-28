import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { animUtils } from '../../../Utils/AnimUtils'
import { EffectUtils } from '../../../Utils/EffectUtils'
import { progressionUtils } from '../../../Utils/ProgressionUtils'
import { createTimer, runInTrigger } from '../../../Utils/mapUtils'
import { creepData } from '../../../creeps'
import { B2S, canPlayerControlUnit, ClearTextForPlayer, IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsInteger, PercentageStringOrX2Integer } from '../../01_libraries/Functions_on_numbers'
import { checkOpacityValue, DrawGrid, SetGridOpacity, SetGridOpacityForAllGrids } from '../../01_libraries/Grid'
import { ColorString2Id, udg_colorCode, udg_colorStrings } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { Escaper, LUCKY_LUKE_DEFAULT_TRANSPARENCY } from '../../04_STRUCTURES/Escaper/Escaper'
import { EscaperEffectFunctions } from '../../04_STRUCTURES/Escaper/EscaperEffect_functions'
import { execute, newCmd } from '../../04_STRUCTURES/Escaper/EscaperSavedCommands'
import { Disco } from '../../04_STRUCTURES/Escaper/Escaper_disco'
import { ColorInfo, GetMirrorEscaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { TerrainTypeWalk } from '../../04_STRUCTURES/TerrainType/TerrainTypeWalk'
import {
    DisplayTerrainDataToPlayer,
    GetTerrainData,
} from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_functions'
import { TerrainTypeFromString } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_from_string'
import { TerrainTypeNamesAndData } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_names_and_data'
import { AutoContinueAfterSliding } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/Auto_continue_after_sliding'
import { TurnOnSlide } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/To_turn_on_slide'
import { Apm } from '../../08_GAME/Apm_clics_par_minute/Apm'
import { Cpm } from '../../08_GAME/Apm_clics_par_minute/Cpm'
import { Globals } from '../../09_From_old_Worldedit_triggers/globals_variables_and_triggers'
import { setClickCatcherEnabled } from '../../Async_slide/AsyncSlideInput'
import { AUTO_TURN_MODES, AutoTurnMode, getAutoTurnMode, setAutoTurnMode } from '../../Async_slide/AutoTurn'
import { isTestingLeftClicks, setTestLeftClicks } from '../../Async_slide/HeroEffect'
import { PRESS_TIME_TO_ENABLE_FOLLOW_MOUSE } from '../../Follow_mouse/Follow_mouse'
import { GetStringAssignedFromCommand, KeyboardShortcut } from '../../Keyboard_shortcuts/KeyboardShortcut'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { glowCb, isPlayerId, resolvePlayerId, resolvePlayerIds, USAGE } from '../Helpers/Command_functions'
import { cameraFieldMap, updateAsyncNeeds } from '../Helpers/commands-helpers'

export const initCommandAll = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'all'

    for (const { name, alias } of udg_colorStrings) {
        //-<color>   --> change the base color of the hero
        registerCommand({
            name,
            alias,
            group,
            argDescription: '',
            description: '',
            cb: ({ noParam, nbParam, param1 }, escaper) => {
                if (noParam) {
                    escaper.setBaseColor(ColorString2Id(name))
                    return true
                }
                if (nbParam == 1 && escaper.isTrueMaximaxou() && isPlayerId(param1)) {
                    getUdgEscapers().get(resolvePlayerId(param1))?.setBaseColor(ColorString2Id(name))
                }
                return true
            },
        })
    }

    //-vertexColor(vc) [ <red> <green> <blue> [<transparency>] ]   --> without parameter takes a random vertex color without changing transparency
    registerCommand({
        name: 'vertexColor',
        alias: ['vc', 'wild'],
        group,
        argDescription: '[ <red> <green> <blue> [<transparency>] ]',
        description: 'Without parameter takes a random vertex color without changing transparency',
        cb: ({ noParam, nbParam, param1, param2, param3, param4 }, escaper) => {
            if (noParam || nbParam === 1) {
                if (nbParam === 1) {
                    if (!(isPlayerId(param1) && escaper.isTrueMaximaxou())) {
                        return true
                    }

                    const targetEscaper = getUdgEscapers().get(resolvePlayerId(param1))

                    if (!targetEscaper) {
                        return true
                    }

                    escaper = targetEscaper
                }
                escaper.setVcRed(GetRandomPercentageBJ())
                escaper.setVcGreen(GetRandomPercentageBJ())
                escaper.setVcBlue(GetRandomPercentageBJ())
            } else {
                if (!(nbParam === 3 || nbParam === 4)) {
                    return true
                }
                if (!escaper.setVcRed(I2R(PercentageStringOrX2Integer(param1)))) {
                    Text.P(
                        escaper.getPlayer(),
                        udg_colorCode[Constants.RED] + 'Red : not a correct percentage (' + param1 + ')'
                    )
                }
                if (!escaper.setVcGreen(I2R(PercentageStringOrX2Integer(param2)))) {
                    Text.P(
                        escaper.getPlayer(),
                        udg_colorCode[Constants.GREEN] + 'Green : not a correct percentage (' + param2 + ')'
                    )
                }
                if (!escaper.setVcBlue(I2R(PercentageStringOrX2Integer(param3)))) {
                    Text.P(
                        escaper.getPlayer(),
                        udg_colorCode[Constants.BLUE] + 'Blue : not a correct percentage (' + param3 + ')'
                    )
                }
                if (nbParam === 4) {
                    if (!escaper.setVcTransparency(I2R(PercentageStringOrX2Integer(param4)))) {
                        Text.P(
                            escaper.getPlayer(),
                            udg_colorCode[Constants.GREY] + 'Transparency : not a correct percentage (' + param4 + ')'
                        )
                    }
                }
            }
            escaper.refreshVertexColor()
            return true
        },
    })

    //-vertexColorRed(vcr) [<red>]   --> changes the red part of the vertex color only
    registerCommand({
        name: 'vertexColorRed',
        alias: ['vcr'],
        group,
        argDescription: '[<red>]',
        description: 'Changes the red part of the vertex color only',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.setVcRed(GetRandomPercentageBJ())
                escaper.refreshVertexColor()
                return true
            }
            if (!(nbParam === 1)) {
                return true
            }
            if (!escaper.setVcRed(I2R(PercentageStringOrX2Integer(param1)))) {
                Text.P(
                    escaper.getPlayer(),
                    udg_colorCode[Constants.RED] + 'Red : not a correct percentage (' + param1 + ')'
                )
                return true
            }
            escaper.refreshVertexColor()
            return true
        },
    })

    //-vertexColorGreen(vcg) [<Green>]   --> changes the green part of the vertex color only
    registerCommand({
        name: 'vertexColorGreen',
        alias: ['vcg'],
        group,
        argDescription: '[<Green>]',
        description: 'Changes the green part of the vertex color only',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.setVcGreen(GetRandomPercentageBJ())
                escaper.refreshVertexColor()
                return true
            }
            if (!(nbParam === 1)) {
                return true
            }
            if (!escaper.setVcGreen(I2R(PercentageStringOrX2Integer(param1)))) {
                Text.P(
                    escaper.getPlayer(),
                    udg_colorCode[Constants.GREEN] + 'Green : not a correct percentage (' + param1 + ')'
                )
                return true
            }
            escaper.refreshVertexColor()
            return true
        },
    })

    //-vertexColorBlue(vcb) [<Blue>]   --> changes the blue part of the vertex color only
    registerCommand({
        name: 'vertexColorBlue',
        alias: ['vcb'],
        group,
        argDescription: '[<Blue>]',
        description: 'Changes the blue part of the vertex color only',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.setVcBlue(GetRandomPercentageBJ())
                escaper.refreshVertexColor()
                return true
            }
            if (!(nbParam === 1)) {
                return true
            }
            if (!escaper.setVcBlue(I2R(PercentageStringOrX2Integer(param1)))) {
                Text.P(
                    escaper.getPlayer(),
                    udg_colorCode[Constants.BLUE] + 'Blue : not a correct percentage (' + param1 + ')'
                )
                return true
            }
            escaper.refreshVertexColor()
            return true
        },
    })

    //-vertexColorTransparency(vct) [<transparency>]   --> changes the transparency of the hero
    registerCommand({
        name: 'vertexColorTransparency',
        alias: ['vct'],
        group,
        argDescription: '[<transparency>]',
        description: 'Changes the transparency of the hero',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.setVcTransparency(GetRandomPercentageBJ())
                escaper.refreshVertexColor()
                return true
            }
            if (!(nbParam === 1)) {
                return true
            }
            if (!escaper.setVcTransparency(I2R(PercentageStringOrX2Integer(param1)))) {
                Text.P(
                    escaper.getPlayer(),
                    udg_colorCode[Constants.GREY] + 'Transparency : not a correct percentage (' + param1 + ')'
                )
                return true
            }
            escaper.refreshVertexColor()
            return true
        },
    })

    //-noVertex(nv)   --> put normal vertex color : RGB(100, 100, 100) with 0 transparency
    registerCommand({
        name: 'noVertex',
        alias: ['nv'],
        group,
        argDescription: '',
        description: 'Put normal vertex color : RGB(100, 100, 100) with 0 transparency',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (!(noParam || nbParam === 1)) {
                return true
            }
            if (nbParam === 1) {
                if (!(escaper.isTrueMaximaxou() && isPlayerId(param1))) {
                    return true
                }

                const targetEscaper = getUdgEscapers().get(resolvePlayerId(param1))

                if (!targetEscaper) {
                    return true
                }

                escaper = targetEscaper
            }
            escaper.setVcRed(100)
            escaper.setVcGreen(100)
            escaper.setVcBlue(100)
            escaper.setVcTransparency(0)
            escaper.refreshVertexColor()
            return true
        },
    })

    //-colorInfo(ci) [<Pcolor>]   --> displays base color and vertex color of a hero
    registerCommand({
        name: 'colorInfo',
        alias: ['ci'],
        group,
        argDescription: '[<Pcolor>]',
        description: 'Displays base color and vertex color of a hero',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                ColorInfo(escaper, escaper.getPlayer())
                return true
            }
            if (nbParam === 1 && isPlayerId(param1)) {
                const targetEscaper = getUdgEscapers().get(resolvePlayerId(param1))
                targetEscaper && ColorInfo(targetEscaper, escaper.getPlayer())
                return true
            }
            return true
        },
    })

    //-effect(ef) <effect>   --> adds an effect on each hand of the hero
    registerCommand({
        name: 'effect',
        alias: ['ef'],
        group,
        argDescription: '<effect>',
        description: 'Adds an effect on each hand of the hero',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!EscaperEffectFunctions.IsEffectStr(param1)) {
                return true
            }
            if (nbParam == 2 && escaper.isTrueMaximaxou() && isPlayerId(param2)) {
                const targetEscaper = getUdgEscapers().get(resolvePlayerId(param2))

                if (!targetEscaper) {
                    return true
                }

                escaper = targetEscaper
            } else {
                if (nbParam !== 1) {
                    return true
                }
            }
            const str = EscaperEffectFunctions.String2EffectStr(param1)

            if (str) {
                escaper.newEffect(str, 'hand right')
                escaper.newEffect(str, 'hand left')
            }

            return true
        },
    })

    //-customEffect(ce) <effect> <body_part>   --> adds an effect on a body part of the hero
    registerCommand({
        name: 'customEffect',
        alias: ['ce'],
        group,
        argDescription: '<effect> <body_part>',
        description: 'Adds an effect on a body part of the hero',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            if (!(EscaperEffectFunctions.IsEffectStr(param1) && EscaperEffectFunctions.IsBodyPartStr(param2))) {
                return true
            }
            const str = EscaperEffectFunctions.String2EffectStr(param1)

            if (str) {
                const str3 = EscaperEffectFunctions.String2BodyPartStr(param2)

                if (str3) {
                    escaper.newEffect(str, str3)
                }
            }

            return true
        },
    })

    //-effectsEverywhere(efe) <effect>   --> adds the same effect to each body part of the hero
    registerCommand({
        name: 'effectsEverywhere',
        alias: ['efe'],
        group,
        argDescription: '<effect>',
        description: 'Adds the same effect to each body part of the hero',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!EscaperEffectFunctions.IsEffectStr(param1)) {
                return true
            }
            if (nbParam == 2 && escaper.isTrueMaximaxou() && isPlayerId(param2)) {
                const targetEscaper = getUdgEscapers().get(resolvePlayerId(param2))

                if (!targetEscaper) {
                    return true
                }

                escaper = targetEscaper
            } else {
                if (nbParam !== 1) {
                    return true
                }
            }

            const str = EscaperEffectFunctions.String2EffectStr(param1)

            if (str) {
                escaper.newEffect(str, 'hand right')
                escaper.newEffect(str, 'hand left')
                escaper.newEffect(str, 'foot left')
                escaper.newEffect(str, 'foot right')
                escaper.newEffect(str, 'head')
                escaper.newEffect(str, 'chest')
            }

            return true
        },
    })

    //-deleteEffects(de) [<numberOfEffectsToRemove>]   --> delete a specified effect of the hero or all effects if not specified
    registerCommand({
        name: 'deleteEffects',
        alias: ['de'],
        group,
        argDescription: '[<numberOfEffectsToRemove>]',
        description: 'Delete a specified effect of the hero or all effects if not specified',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (!(noParam || nbParam === 1)) {
                return true
            }

            let n = 0

            if (nbParam === 1) {
                if (S2I(param1) !== 0) {
                    n = S2I(param1)
                    if (n < 1 || n > Constants.LIMIT_NB_HERO_EFFECTS) {
                        return true
                    }
                } else if (isPlayerId(param1)) {
                    if (!escaper.isTrueMaximaxou()) {
                        return true
                    }

                    const targetEscaper = getUdgEscapers().get(resolvePlayerId(param1))

                    if (!targetEscaper) {
                        return true
                    }

                    escaper = targetEscaper
                    n = Constants.LIMIT_NB_HERO_EFFECTS
                } else {
                    n = 0
                }
            } else {
                n = Constants.LIMIT_NB_HERO_EFFECTS
            }
            escaper.destroyLastEffects(n)
            return true
        },
    })

    //-cameraField(cf) x   --> changes the camera field (height), default is 2500
    registerCommand({
        name: 'cameraField',
        alias: ['cf'],
        group,
        argDescription: 'x',
        description: 'Changes the camera field (height), default is 2500',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!((nbParam === 1 || nbParam === 2) && IsInteger(param1))) {
                return true
            }

            if (nbParam === 2) {
                if (param2.toUpperCase() in cameraFieldMap) {
                    SetCameraFieldForPlayer(escaper.getPlayer(), cameraFieldMap[param2.toUpperCase()], S2I(param1), 0)
                    Text.P(escaper.getPlayer(), `Set: ${param2.toUpperCase()} to ${S2I(param1)}`)
                }

                return true
            }

            if (nbParam === 1) {
                escaper.setCameraField(S2I(param1))
            }

            return true
        },
    })

    //-debugCameraField
    registerCommand({
        name: 'debugCameraField',
        alias: ['dcf'],
        group,
        argDescription: '',
        description: '',
        cb: (_, escaper) => {
            Text.P(
                escaper.getPlayer(),
                `
            TARGET_DISTANCE: ${GetCameraField(CAMERA_FIELD_TARGET_DISTANCE)}
            FARZ: ${GetCameraField(CAMERA_FIELD_FARZ)}
            ANGLE_OF_ATTACK: ${Rad2Deg(GetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK))}
            FIELD_OF_VIEW: ${Rad2Deg(GetCameraField(CAMERA_FIELD_FIELD_OF_VIEW))}
            ROLL: ${Rad2Deg(GetCameraField(CAMERA_FIELD_ROLL))}
            ROTATION: ${Rad2Deg(GetCameraField(CAMERA_FIELD_ROTATION))}
            ZOFFSET: ${GetCameraField(CAMERA_FIELD_ZOFFSET)}
            NEARZ: ${GetCameraField(CAMERA_FIELD_NEARZ)}
            LOCAL_PITCH: ${Rad2Deg(GetCameraField(CAMERA_FIELD_LOCAL_PITCH))}
            LOCAL_YAW: ${Rad2Deg(GetCameraField(CAMERA_FIELD_LOCAL_YAW))}
            LOCAL_ROLL: ${Rad2Deg(GetCameraField(CAMERA_FIELD_LOCAL_ROLL))}
                    `
            )

            return true
        },
    })

    //-resetCamera(rc)   --> put the camera back like chosen field
    registerCommand({
        name: 'resetCamera',
        alias: ['rc'],
        group,
        argDescription: '',
        description: 'Put the camera back like chosen field',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.resetCamera()
            return true
        },
    })

    //-resetCameraInit(rci)   --> changes the camera field back to its default value (2500)
    registerCommand({
        name: 'resetCameraInit',
        alias: ['rci'],
        group,
        argDescription: '',
        description: 'Changes the camera field back to its default value (2500)',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.setCameraField(Constants.DEFAULT_CAMERA_FIELD)
            return true
        },
    })

    //-animation(an) <string>   --> makes your hero doing an animation
    registerCommand({
        name: 'animation',
        alias: ['an'],
        group,
        argDescription: '<string>',
        description: 'Makes your hero doing an animation',
        cb: ({ cmd, noParam, param1 }, escaper) => {
            if (noParam || !escaper.isAlive()) {
                return true
            }

            const hero = escaper.getHero()

            if (hero) {
                const spaceIndex = cmd.indexOf(' ')
                const args = spaceIndex !== -1 ? cmd.substring(spaceIndex + 1) : param1

                animUtils.setAnimation(hero, args)

                if (!escaper.isEscaperSecondary()) {
                    const hero2 = GetMirrorEscaper(escaper)?.getHero()

                    if (hero2) {
                        animUtils.setAnimation(hero2, args)
                    }
                }
            }

            return true
        },
    })

    //-mapNbMonsters(mnbm) [moving(m)|all(a)|notMoving(nm)]   --> "moving" is the default value
    registerCommand({
        name: 'mapNbMonsters',
        alias: ['mnbm'],
        group,
        argDescription: '[moving(m)|all(a)|notMoving(nm)]',
        description: '"moving" is the default value',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (!(noParam || nbParam === 1)) {
                return true
            }

            let n = 0

            if (noParam || param1 === 'all' || param1 === 'a') {
                n = getUdgLevels().getNbMonsters('all')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' monsters in the map.')
                return true
            }
            if (param1 === 'moving' || param1 === 'm') {
                n = getUdgLevels().getNbMonsters('moving')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' moving monsters in the map.')
                return true
            }
            if (param1 === 'notMoving' || param1 === 'nm') {
                n = getUdgLevels().getNbMonsters('not moving')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' non moving monsters in the map.')
                return true
            }
            if (param1 === 'bookOfLife' || param1 === 'bol') {
                n = getUdgLevels().getNbMonsters('book of life')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' book(s) of life in the map.')
                return true
            }
            return true
        },
    })

    //-levelNbMonsters(lnbm) [moving(m)|all(a)|notMoving(nm)]   --> "moving" is the default value
    registerCommand({
        name: 'levelNbMonsters',
        alias: ['lnbm'],
        group,
        argDescription: '[moving(m)|all(a)|notMoving(nm)|bookOfLife(bol)]',
        description: '"moving" is the default value',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (!(noParam || nbParam === 1)) {
                return true
            }

            let n = 0

            if (noParam || param1 === 'all' || param1 === 'a') {
                n = getUdgLevels().getCurrentLevel(escaper).getNbMonsters('all')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' monsters in this level.')

                let p = 0

                for (const [_, ms] of pairs(getUdgLevels().getCurrentLevel(escaper).monsterSpawns.getAll())) {
                    if (ms.monsters) {
                        p += BlzGroupGetSize(ms.monsters)
                    }
                }

                if (p > 0) {
                    Text.P(escaper.getPlayer(), 'There are ' + I2S(p) + ' spawned monsters in this level.')
                }

                return true
            }
            if (param1 === 'moving' || param1 === 'm') {
                n = getUdgLevels().getCurrentLevel(escaper).getNbMonsters('moving')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' moving monsters in this level.')
                return true
            }
            if (param1 === 'notMoving' || param1 === 'nm') {
                n = getUdgLevels().getCurrentLevel(escaper).getNbMonsters('not moving')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' non moving monsters in this level.')
                return true
            }
            if (param1 === 'bookOfLife' || param1 === 'bol') {
                n = getUdgLevels().getCurrentLevel(escaper).getNbMonsters('book of life')
                Text.P(escaper.getPlayer(), 'There are ' + I2S(n) + ' book(s) of life in this level.')
                return true
            }

            return true
        },
    })

    //-kill(kl)   --> kills your hero
    registerCommand({
        name: 'kill',
        alias: ['kl'],
        group,
        argDescription: '',
        description: 'Kills your hero',
        enabled: ({ noParam }) => noParam,
        cb: ({}, escaper) => {
            if (!escaper.kill()) {
                Text.erP(escaper.getPlayer(), 'You are already dead.')
            }
            return true
        },
    })

    //-kick(kc)   --> kicks yourself
    registerCommand({
        name: 'kick',
        alias: ['kc'],
        group,
        argDescription: '',
        description: 'Kicks yourself',
        enabled: ({ noParam }) => noParam,
        cb: ({}, escaper) => {
            CustomDefeatBJ(escaper.getPlayer(), 'You have kicked... yourself.')
            Text.A(udg_colorCode[escaper.getColorId()] + escaper.getDisplayName() + ' has kicked himself !')
            escaper.destroy()
            GetMirrorEscaper(escaper)?.destroy()

            // Delay it a bit
            runInTrigger(() => getUdgLevels().deactivateEmptyLevels())

            return true
        },
    })

    //-getTerrainInfo(gti) [ <terrain> | <lowInteger> <upInteger> ]
    registerCommand({
        name: 'getTerrainInfo',
        alias: ['gti'],
        group,
        argDescription: '[ <terrain> | <lowInteger> <upInteger> ]',
        description: '',
        cb: ({ noParam, nbParam, param1, param2 }, escaper) => {
            if (noParam) {
                escaper.makeGetTerrainType()
                Text.mkP(escaper.getPlayer(), 'Get terrain info mode enabled')
                return true
            }

            let i = 0
            let n = 0

            if (nbParam === 1) {
                n = TerrainTypeFromString.TerrainTypeString2TerrainTypeId(param1)
                if (n !== 0) {
                    DisplayTerrainDataToPlayer(escaper.getPlayer(), n)
                }
                return true
            }
            if (nbParam === 2) {
                if (IsInteger(param1) && IsInteger(param2)) {
                    i = S2I(param1)
                    n = S2I(param2)
                    if (
                        i >= 1 &&
                        i < n &&
                        n <= TerrainTypeNamesAndData.NB_TERRAINS_TOTAL &&
                        n - i < Constants.NB_MAX_TERRAIN_DATA_DISPLAY
                    ) {
                        Text.DisplayLineToPlayer(escaper.getPlayer())
                        while (true) {
                            if (i > n) break
                            DisplayTerrainDataToPlayer(escaper.getPlayer(), i)
                            i = i + 1
                        }
                    }
                }
                return true
            }
            //mode recherche
            //param = cmd_param(cmd, 0)
            //n = StringLength(param)
            //if (SubStringBJ(param, 1, 1) == "\"" && SubStringBJ(param, n, n) == "\"") then
            //    call DisplayTerrainDataSearchToPlayer(TP, SubStringBJ(param, 2, n-1))
            //endif
            return true
        },
    })

    //-getMonsterInfo(gmi)   --> click on a monster to get its info
    registerCommand({
        name: 'getMonsterInfo',
        alias: ['gmi'],
        group,
        argDescription: '',
        description: 'Click on a monster to get its info',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeGetMonsterInfo()
            Text.mkP(escaper.getPlayer(), 'Get monster info mode enabled')
            return true
        },
    })

    //-stop(s)   --> stop creating monsters or terrain or stop getTerrainInfoMode or getMonsterInfoMode
    registerCommand({
        name: 'stop',
        alias: ['s'],
        group,
        argDescription: '',
        description: 'Stop creating monsters or terrain or stop getTerrainInfoMode or getMonsterInfoMode',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            if (escaper.destroyMake()) {
                Text.mkP(escaper.getPlayer(), 'stop')
            } else {
                Text.erP(escaper.getPlayer(), 'nothing to stop')
            }
            return true
        },
    })

    //-disco(d) [off|1~30]  -> choose the number of color changes in ten seconds, or stop color changing (without parameter once a second)
    registerCommand({
        name: 'disco',
        alias: ['d'],
        group,
        argDescription: '[off|1~30]',
        description:
            'choose the number of color changes in ten seconds, or stop color changing (without parameter once a second)',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            let n = 0

            if (noParam) {
                n = 10
            } else {
                if (nbParam === 1) {
                    if (IsInteger(param1)) {
                        n = S2I(param1)
                        if (n < 1 || n > 30) {
                            return true
                        }
                    } else {
                        if (param1 == 'off' && escaper.discoTrigger != null) {
                            escaper.discoTrigger.destroy()
                            GetMirrorEscaper(escaper)?.discoTrigger?.destroy()

                            Text.P(escaper.getPlayer(), 'disco off')
                        }
                        return true
                    }
                } else {
                    return true
                }
            }

            escaper.discoTrigger?.destroy()
            escaper.discoTrigger = createTimer(10 / I2R(n), true, () => Disco.Disco_Actions(escaper.getEscaperId())) //n changements en 10 secondes

            const mirrorEscaper = GetMirrorEscaper(escaper)

            if (mirrorEscaper) {
                mirrorEscaper.discoTrigger?.destroy()
                mirrorEscaper.discoTrigger = createTimer(10 / I2R(n), true, () =>
                    Disco.Disco_Actions(escaper.getEscaperId())
                ) //n changements en 10 secondes
            }

            Text.P(escaper.getPlayer(), 'disco : ' + I2S(n) + ' changes in 10 seconds')
            return true
        },
    })

    //-clearText(clr)   --> remove the text on the screen
    registerCommand({
        name: 'clearText',
        alias: ['clr'],
        group,
        argDescription: '',
        description: 'Remove the text on the screen',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                ClearTextForPlayer(escaper.getPlayer())
            }
            return true
        },
    })

    //-usedTerrains(ut)   --> display the terrains already used (onto the map) during this game (16 is the maximum possible !)
    registerCommand({
        name: 'usedTerrains',
        alias: ['ut'],
        group,
        argDescription: '',
        description: 'Display the terrains already used (onto the map) during this game (16 is the maximum possible !)',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.DisplayLineToPlayer(escaper.getPlayer())
                Text.P_timed(
                    escaper.getPlayer(),
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    udg_colorCode[Constants.TEAL] + '       Used terrains :'
                )

                let i = 0
                let str = ''

                while (true) {
                    if (i >= Globals.udg_nb_used_terrains) break
                    str = udg_colorCode[Constants.TEAL] + I2S(i + 1) + ' : '
                    str = str + GetTerrainData(Globals.udg_used_terrain_types[i])
                    Text.P_timed(escaper.getPlayer(), Constants.TERRAIN_DATA_DISPLAY_TIME, str)
                    i = i + 1
                }
            }
            return true
        },
    })

    //-drunk(-) <real drunkValue>   --> value between 5 and 60
    registerCommand({
        name: 'drunk',
        alias: [],
        group,
        argDescription: '<real drunkValue>',
        description: 'Value between 5 and 60',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            const k = GetPlayerId(escaper.getPlayer())
            let x = 0
            let n = 0

            if (noParam) {
                if (!TurnOnSlide.udg_isDrunk[k]) {
                    TurnOnSlide.udg_isDrunk[k] = true
                    x = TurnOnSlide.udg_drunk[k]
                    Text.P(escaper.getPlayer(), 'drunk mode to ' + R2S(x))
                } else {
                    return true
                }
            } else {
                x = S2R(param1)
                if (nbParam == 1 && x >= 5 && x <= 60) {
                    TurnOnSlide.udg_isDrunk[k] = true
                    TurnOnSlide.udg_drunk[k] = x
                } else {
                    return true
                }
            }
            if (x < 10) {
                n = 1
                Text.P(escaper.getPlayer(), 'You begin to feel bad.')
            } else {
                if (x < 15) {
                    n = 2
                    Text.P(escaper.getPlayer(), 'Burp !')
                } else {
                    n = 3
                    if (x < 30) {
                        Text.P(escaper.getPlayer(), 'You understand now why driving drunk is dangerous ??!!')
                    } else {
                        Text.P(escaper.getPlayer(), 'Dunno how you can stand...')
                    }
                }
            }
            if (n !== TurnOnSlide.udg_drunkLevel[k]) {
                EffectUtils.destroyEffect(TurnOnSlide.udg_drunkEffect[k])

                const hero = escaper.getHero()

                if (hero) {
                    TurnOnSlide.udg_drunkEffect[k] = EffectUtils.addSpecialEffectTarget(
                        TurnOnSlide.DRUNK_EFFECTS[n],
                        hero,
                        'head'
                    )
                }

                TurnOnSlide.udg_drunkLevel[k] = n
            }
            return true
        },
    })

    //-noDrunk(-)   --> stop drunk mode
    registerCommand({
        name: 'noDrunk',
        alias: [],
        group,
        argDescription: '',
        description: 'Stop drunk mode',
        cb: ({ noParam }, escaper) => {
            const k = GetPlayerId(escaper.getPlayer())
            if (noParam && TurnOnSlide.udg_isDrunk[k]) {
                TurnOnSlide.udg_isDrunk[k] = false
                TurnOnSlide.udg_drunkLevel[k] = 0
                EffectUtils.destroyEffect(TurnOnSlide.udg_drunkEffect[k])
                Text.P(escaper.getPlayer(), 'You feel better now.')
            }
            return true
        },
    })

    //-autoContinueAfterSliding(acas) <boolean status>
    registerCommand({
        name: 'autoContinueAfterSliding',
        alias: ['acas'],
        group,
        argDescription: '<boolean status>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            const k = GetPlayerId(escaper.getPlayer())
            if (nbParam === 1 && IsBoolString(param1)) {
                if (AutoContinueAfterSliding.udg_autoContinueAfterSliding[k] !== S2B(param1)) {
                    AutoContinueAfterSliding.udg_autoContinueAfterSliding[k] = S2B(param1)
                    if (k < Constants.NB_PLAYERS_MAX) {
                        AutoContinueAfterSliding.udg_autoContinueAfterSliding[k + Constants.NB_PLAYERS_MAX] =
                            S2B(param1)
                    }

                    if (S2B(param1)) {
                        Text.P(escaper.getPlayer(), 'auto continue after sliding on')
                    } else {
                        Text.P(escaper.getPlayer(), 'auto continue after sliding off')
                    }
                }
            }
            return true
        },
    })

    //-apm(-) [all|a]   --> displays apm on slide of everybody or just yourself
    registerCommand({
        name: 'apm',
        alias: [],
        group,
        argDescription: '[all|a]',
        description: 'Displays apm on slide of everybody or just yourself',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            const k = GetPlayerId(escaper.getPlayer())
            if (noParam) {
                Apm.DisplayApm(k)
            } else {
                if (nbParam === 1 && (param1 === 'all' || param1 === 'a')) {
                    Apm.DisplayApmAll(k)
                }
            }
            return true
        },
    })

    //-cpm(-) [all|a]   --> displays cpm on slide of everybody or just yourself
    registerCommand({
        name: 'cpm',
        alias: [],
        group,
        argDescription: '[all|a]',
        description: 'Displays cpm on slide of everybody or just yourself',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            const k = GetPlayerId(escaper.getPlayer())
            if (noParam) {
                Cpm.DisplayCpm(k)
            } else {
                if (nbParam === 1 && (param1 === 'all' || param1 === 'a')) {
                    Cpm.DisplayCpmAll(k)
                }
            }
            return true
        },
    })

    //-assign(as) <shortcut> <command>   --> puts a command into a key (A Z E R Q S D or F)
    registerCommand({
        name: 'assign',
        alias: ['as'],
        group,
        argDescription: '[<modifier>]<key> <command>',
        description:
            'puts a command into any alphanumeric key with of without modifiers ctrl (C) or shift (S) or both (CS)',
        cb: ({ cmd, nbParam, param1 }, escaper) => {
            if (nbParam <= 1) {
                return true
            }

            const stringAssignedFromCommand = GetStringAssignedFromCommand(cmd)

            if (stringAssignedFromCommand) {
                const keyboardShortcut = new KeyboardShortcut(escaper, param1, stringAssignedFromCommand)
                escaper.getKeyboardShortcutsArray().new(keyboardShortcut, true)
                Text.mkP(escaper.getPlayer(), 'command assigned')
            }

            return true
        },
    })

    //-unassign(uas) <shortcut>   --> removes the command put into a key
    registerCommand({
        name: 'unassign',
        alias: ['uas'],
        group,
        argDescription: '[<modifier>]<key>',
        description: 'Removes the command put into a key',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }

            if (escaper.getKeyboardShortcutsArray().destroyOneByKey(param1)) {
                Text.mkP(escaper.getPlayer(), 'shortcut removed')
            } else {
                Text.erP(escaper.getPlayer(), 'you have no such shortcut')
            }

            return true
        },
    })

    //-displayShortcuts(ds)   --> displays the commands associated to your shortcuts
    registerCommand({
        name: 'displayShortcuts',
        alias: ['ds'],
        group,
        argDescription: '',
        description: 'Displays the commands associated to your shortcuts',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.getKeyboardShortcutsArray().displayAll()
            }
            return true
        },
    })

    //-saveCommand(sc) <commandLabel> <command>   --> save a command into a name of your choice
    registerCommand({
        name: 'saveCommand',
        alias: ['sc'],
        group,
        argDescription: '<commandLabel> <command>',
        description: 'Save a command into a name of your choice',
        cb: ({ cmd, nbParam, param1 }, escaper) => {
            if (!(nbParam > 1)) {
                return true
            }
            newCmd(escaper, param1, '-' + GetStringAssignedFromCommand(cmd))
            Text.P(escaper.getPlayer(), 'new command "' + param1 + '" added')
            return true
        },
    })

    //-executeCommand(ec) <commandLabel>   --> execute a command you saved with "saveCommand"
    registerCommand({
        name: 'executeCommand',
        alias: ['ec'],
        group,
        argDescription: '<commandLabel>',
        description: 'Execute a command you saved with "saveCommand"',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (!execute(escaper, param1)) {
                Text.erP(escaper.getPlayer(), 'unknown command name')
            }
            return true
        },
    })

    //-getCurrentLevel(getcl)   --> displays the number of the current level (first one is number 0)
    registerCommand({
        name: 'getCurrentLevel',
        alias: ['getcl'],
        group,
        argDescription: '[player]',
        description: 'Displays the number of the current level (first one is number 0)',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam > 1) {
                return true
            }

            const targetEscaper = nbParam === 1 ? getUdgEscapers().get(resolvePlayerId(param1)) || escaper : escaper

            if (targetEscaper.getId() === escaper.getId()) {
                Text.P(
                    escaper.getPlayer(),
                    'the current level is number ' + I2S(getUdgLevels().getCurrentLevel(targetEscaper).getId())
                )
            } else {
                Text.P(
                    escaper.getPlayer(),
                    `${targetEscaper.getDisplayName()} is on level number ` +
                        I2S(getUdgLevels().getCurrentLevel(targetEscaper).getId())
                )
            }

            return true
        },
    })

    //-leaderboard
    registerCommand({
        name: 'leaderboard',
        alias: ['ldb'],
        group,
        argDescription: 'on | off | mb|multiboard|reset | classic | global | current | speedrun',
        description: 'Displays the leaderboard',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1) {
                if (IsBoolString(param1)) {
                    escaper.hideLeaderboard = !S2B(param1)
                    ServiceManager.getService('Multiboard').setVisibility(escaper, S2B(param1))
                } else if (param1 === 'classic') {
                    ServiceManager.getService('Multiboard').setMode(escaper, 'leaderboard')
                } else if (param1 === 'reset' || param1 === 'multiboard' || param1 === 'mb') {
                    ServiceManager.getService('Multiboard').setMode(escaper, 'multiboard')
                } else if (param1 === 'global') {
                    ServiceManager.getService('Multiboard').setMode(escaper, 'multiboard')
                    ServiceManager.getService('Multiboard').setStatsMode(escaper, 'global')
                } else if (param1 === 'current') {
                    ServiceManager.getService('Multiboard').setMode(escaper, 'multiboard')
                    ServiceManager.getService('Multiboard').setStatsMode(escaper, 'current')
                } else if (param1 === 'speedrun') {
                    ServiceManager.getService('Multiboard').setMode(escaper, 'multiboard')
                    ServiceManager.getService('Multiboard').setStatsMode(escaper, 'speedrun')
                }

                Text.mkP(escaper.getPlayer(), 'Leaderboard updated for yourself')
            } else {
                return USAGE
            }

            return true
        },
    })

    //-firstPersonCam(fpc)
    registerCommand({
        name: 'firstPersonCam',
        alias: ['fpc'],
        group,
        argDescription: 'on | off',
        description: 'Displays the first person camera',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1 && IsBoolString(param1)) {
                escaper.getFirstPersonHandle().toggleFirstPerson(S2B(param1))
                Text.mkP(escaper.getPlayer(), `First person cam ${S2B(param1) ? 'enabled' : 'disabled'}`)
            }

            return true
        },
    })

    //-lockCam(lc)
    registerCommand({
        name: 'lockCam',
        alias: ['lc', 'spectate'],
        group,
        argDescription: '[<player> | on | off]',
        description: 'Locks the camera',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            let target: Escaper | null = null

            if (nbParam > 1) {
                throw 'Wrong command parameters'
            }

            if (param1 !== 'progression') {
                if (IsBoolString(param1)) {
                    if (S2B(param1)) {
                        target = escaper
                    } else {
                        target = null
                    }
                } else {
                    target = noParam ? escaper : nbParam === 1 ? getUdgEscapers().get(resolvePlayerId(param1)) : null
                }
            }

            escaper.setLockCamTarget(target, param1 === 'progression' ? param1 : undefined)

            if (target || param1 === 'progression') {
                Text.mkP(escaper.getPlayer(), 'Camera locked')
            } else {
                Text.mkP(escaper.getPlayer(), 'Camera unlocked')
            }

            return true
        },
    })

    //-lockCamRotation(lcr)
    registerCommand({
        name: 'lockCamRotation',
        alias: ['lcr'],
        group,
        argDescription: 'on | off',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1 && IsBoolString(param1)) {
                escaper.setLockCamTarget(S2B(param1) ? escaper : null)
                escaper.toggleLockCamRotation(S2B(param1))
                Text.mkP(escaper.getPlayer(), `Camera rotation ${S2B(param1) ? 'locked' : 'unlocked'}`)
            }

            return true
        },
    })

    //-lockCamHeight(lch)
    registerCommand({
        name: 'lockCamHeight',
        alias: ['lch'],
        group,
        argDescription: 'on | off',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1 && IsBoolString(param1)) {
                escaper.resetCamera()
                escaper.toggleLockCamHeight(S2B(param1))
                Text.mkP(escaper.getPlayer(), `Camera height ${S2B(param1) ? 'locked' : 'unlocked'}`)
            }

            return true
        },
    })

    //-spinCam
    registerCommand({
        name: 'spinCam',
        alias: [],
        group,
        argDescription: '[speed | off]',
        description: 'Spins the camera',
        cb: ({ nbParam, param1 }, escaper) => {
            if (IsBoolString(param1) && !S2B(param1)) {
                Text.mkP(escaper.getPlayer(), 'Spin disabled')
                escaper.setSpinCamSpeed(0)
            } else {
                Text.mkP(escaper.getPlayer(), 'Spin enabled')
                escaper.setSpinCamSpeed(nbParam === 1 ? -S2R(param1) : 1)
            }

            return true
        },
    })

    //-followMouse [<boolean>]   --> toggle or set follow mouse mode (active while holding right mouse button)
    registerCommand({
        name: 'followMouse',
        alias: ['fm'],
        group,
        argDescription: '[<boolean>]',
        description: 'Toggle or set follow mouse mode (active while holding right mouse button)',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            let flag = true

            if (noParam) {
                // Toggle mode
                flag = !escaper.getSimpleFollowMouse()
            } else if (nbParam === 1) {
                if (!IsBoolString(param1)) {
                    return true
                }
                flag = S2B(param1)
            } else {
                return true
            }

            escaper.enableSimpleFollowMouseMode(flag)

            if (flag) {
                Text.mkP(
                    escaper.getPlayer(),
                    'Follow mouse mode enabled: hold right click while sliding to follow mouse'
                )
            } else {
                Text.mkP(escaper.getPlayer(), 'Follow mouse mode disabled')
            }

            return true
        },
    })

    //-followMouseMax <boolean>
    registerCommand({
        name: 'followMouseMax',
        alias: [],
        group,
        argDescription: '<boolean> [neverDisable|nd]',
        description: 'Follows the mouse',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam != 1 && nbParam != 2) {
                return true
            }

            const neverDisable = param2 == 'neverDisable' || param2 == 'nd'

            escaper.enableFollowMouseMode(S2B(param1), neverDisable)

            if (S2B(param1)) {
                Text.mkP(
                    escaper.getPlayer(),
                    'Follow mouse mode enabled : hold right click during ' +
                        PRESS_TIME_TO_ENABLE_FOLLOW_MOUSE +
                        's while sliding to activate it. Do a normal click to disable it'
                )
            } else {
                Text.mkP(escaper.getPlayer(), 'Follow mouse mode disabled')
            }

            return true
        },
    })

    //-mirror <boolean>
    registerCommand({
        name: 'mirror',
        alias: ['m', 'reverse'],
        group,
        argDescription: '<boolean>',
        description: 'Mirrors the camera',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            if (!IsBoolString(param1)) {
                return true
            }

            if (!(escaper.getLastTerrainType() instanceof TerrainTypeWalk)) {
                Text.erP(escaper.getPlayer(), 'You must be on a walkable terrain to use this command')
                return true
            }

            escaper.setSlideMirror(S2B(param1))

            if (S2B(param1)) {
                Text.mkP(escaper.getPlayer(), 'Mirror mode enabled')
            } else {
                Text.mkP(escaper.getPlayer(), 'Mirror mode disabled')
            }

            return true
        },
    })

    //-ignoreDeathMessages(idm) <boolean>
    registerCommand({
        name: 'ignoreDeathMessages',
        alias: ['idm'],
        group,
        argDescription: '<boolean>',
        description: 'Ignores death messages',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            if (!IsBoolString(param1)) {
                return true
            }

            escaper.setIgnoreDeathMessages(S2B(param1))

            if (S2B(param1)) {
                Text.mkP(escaper.getPlayer(), 'Ignoring death messages')
            } else {
                Text.mkP(escaper.getPlayer(), 'Not ignoring death messages')
            }

            return true
        },
    })

    //-panCameraOnRevive(pcor) <coop | all | none>
    registerCommand({
        name: 'panCameraOnRevive',
        alias: ['pcor'],
        group,
        argDescription: '<coop | all | none> [width] [height]',
        description: 'Pan camera on revive, default width = 2048; height = 1536',
        cb: ({ param1, param2, param3 }, escaper) => {
            if (param1 !== 'coop' && param1 !== 'all' && param1 !== 'none') {
                Text.mkP(escaper.getPlayer(), `param1 must be: coop | all | none`)
                return true
            }

            if (S2I(param2) !== 0) {
                escaper.moveCamDistanceWidth = S2I(param2)
            }

            if (S2I(param3) !== 0) {
                escaper.moveCamDistanceHeight = S2I(param3)
            } else if (S2I(param2) !== 0) {
                escaper.moveCamDistanceHeight = S2I(param2)
            }

            escaper.setPanCameraOnRevive(param1)
            Text.mkP(
                escaper.getPlayer(),
                `Pan camera on revive set to: ${param1} at ${escaper.moveCamDistanceWidth}x${escaper.moveCamDistanceHeight} `
            )

            return true
        },
    })

    //-panCameraOnPortal(pcop) <boolean>
    registerCommand({
        name: 'panCameraOnPortal',
        alias: ['pcop'],
        group,
        argDescription: '<boolean>',
        description: 'Pan camera on portal',
        cb: ({ param1 }, escaper) => {
            if (!IsBoolString(param1)) {
                Text.mkP(escaper.getPlayer(), 'Invalid boolean')
                return true
            }

            escaper.panCameraOnPortal = S2B(param1)
            Text.mkP(escaper.getPlayer(), `Pan camera on portal set to: ${param1}`)

            return true
        },
    })

    //-showNames <boolean>
    registerCommand({
        name: 'showNames',
        alias: ['sn'],
        group,
        argDescription: '<boolean>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            if (!IsBoolString(param1)) {
                return true
            }

            if (S2B(param1)) {
                Text.mkP(escaper.getPlayer(), 'Showing player names')
            } else {
                Text.mkP(escaper.getPlayer(), 'Hiding player names')
            }

            escaper.setShowNames(S2B(param1))

            return true
        },
    })

    //-othersTransparency <number | off | reset> [all | unallied | allied | player]
    registerCommand({
        name: 'othersTransparency',
        alias: ['ot'],
        group,
        argDescription: '<number | off | reset> [all | unallied | allied | player]',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return true
            }

            if (param1 === 'off' || param1 === 'reset') param1 = '0'
            if (param2 === '') param2 = 'all'

            if (!(S2I(param1) >= 0 && S2I(param1) <= 100)) {
                return true
            }

            if (param2 === 'all') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    escaper.setOthersTransparency(esc, S2I(param1))
                }

                if (param1 === '0') {
                    Text.mkP(escaper.getPlayer(), `Showing other heroes as normal`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing other heroes with transparency: ${S2I(param1)}`)
                }

                return true
            } else if (param2 === 'allied') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    if (escaper.alliedState[esc.getId()]) {
                        escaper.setOthersTransparency(esc, S2I(param1))
                    }
                }

                if (param1 === '0') {
                    Text.mkP(escaper.getPlayer(), `Showing allied heroes as normal`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing allied heroes with transparency: ${S2I(param1)}`)
                }

                return true
            } else if (param2 === 'unallied') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    if (!escaper.alliedState[esc.getId()]) {
                        escaper.setOthersTransparency(esc, S2I(param1))
                    }
                }

                if (param1 === '0') {
                    Text.mkP(escaper.getPlayer(), `Showing unallied heroes as normal`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing unallied heroes with transparency: ${S2I(param1)}`)
                }

                return true
            } else if (isPlayerId(param2)) {
                const esc = getUdgEscapers().get(resolvePlayerId(param2))

                if (esc) {
                    escaper.setOthersTransparency(esc, S2I(param1))

                    if (param1 === '0') {
                        Text.mkP(escaper.getPlayer(), `Showing ${esc.getDisplayName()} hero as normal`)
                    } else {
                        Text.mkP(
                            escaper.getPlayer(),
                            `Showing ${esc.getDisplayName()} hero with transparency: ${S2I(param1)}`
                        )
                    }
                }

                return true
            }

            return true
        },
    })

    //-shadow <boolean | reset> [all | unallied | allied | player]
    registerCommand({
        name: 'shadow',
        alias: [],
        group,
        argDescription: '<boolean | reset> [all | unallied | allied | player | monsters]',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return true
            }

            if (param1 === 'reset') param1 = '0'

            const p1 = S2B(param1)

            if (!IsBoolString(param1)) {
                return true
            }

            if (param2 === 'all') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    escaper.setShadow(esc, S2B(param1))
                }

                if (p1) {
                    Text.mkP(escaper.getPlayer(), `Showing other heroes with shadow`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing other heroes without shadow`)
                }

                return true
            } else if (param2 === 'allied') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    if (escaper.alliedState[esc.getId()]) {
                        escaper.setShadow(esc, p1)
                    }
                }

                if (p1) {
                    Text.mkP(escaper.getPlayer(), `Showing allied heroes with shadow`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing allied heroes without shadow`)
                }

                return true
            } else if (param2 === 'unallied') {
                for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
                    if (!escaper.alliedState[esc.getId()]) {
                        escaper.setShadow(esc, p1)
                    }
                }

                if (p1) {
                    Text.mkP(escaper.getPlayer(), `Showing unallied heroes with shadow`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing unallied heroes without shadow`)
                }

                return true
            } else if (isPlayerId(param2)) {
                const esc = getUdgEscapers().get(resolvePlayerId(param2))

                if (esc) {
                    escaper.setShadow(esc, p1)

                    if (p1) {
                        Text.mkP(escaper.getPlayer(), `Showing ${esc.getDisplayName()} hero with shadow`)
                    } else {
                        Text.mkP(escaper.getPlayer(), `Showing ${esc.getDisplayName()} hero without shadow`)
                    }
                }

                return true
            } else if (param2 === 'monsters') {
                escaper.setMonsterShadow(p1)

                if (p1) {
                    Text.mkP(escaper.getPlayer(), `Showing monsters with shadow`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing monsters without shadow`)
                }

                for (const [_, target] of pairs(getUdgLevels().getCurrentLevel(escaper).monsters.getAll())) {
                    const shadow = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()))?.getMonsterShadow()
                    const monster = target.u

                    if (monster) {
                        if (shadow === false) {
                            // Force toggle it to update the shadow
                            const skinId = BlzGetUnitSkin(monster)
                            BlzSetUnitSkin(monster, skinId === FourCC('hpea') ? FourCC('hfoo') : FourCC('hpea'))
                            BlzSetUnitSkin(monster, skinId)
                        } else {
                            // Unfortunately we can't disable the skin, you'll have to recreate the unit
                        }
                    }
                }
            } else {
                escaper.setShadow(escaper, p1)

                if (p1) {
                    Text.mkP(escaper.getPlayer(), `Showing ${escaper.getDisplayName()} hero with shadow`)
                } else {
                    Text.mkP(escaper.getPlayer(), `Showing ${escaper.getDisplayName()} hero without shadow`)
                }
            }

            return true
        },
    })

    //-luckyLuke <boolean | number>
    registerCommand({
        name: 'luckyLuke',
        alias: [],
        group,
        argDescription: '<boolean | number>',
        description:
            'While your hero slides async, faintly shows its unit, which follows it where the other players see it: on gives it 70% transparency (instead of 100%), a number from 0 to 100 sets another transparency. Off by default',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }

            // a number is a transparency of its own, 0 and 1 included, which IsBoolString takes for off and on
            if (tostring(S2I(param1)) === param1) {
                const transparency = S2I(param1)

                if (transparency < 0 || transparency > 100) {
                    return true
                }

                escaper.setLuckyLukeTransparency(transparency)

                Text.mkP(
                    escaper.getPlayer(),
                    `Lucky Luke on: the unit of your hero sliding async is seen with transparency: ${transparency}`
                )

                return true
            }

            if (!IsBoolString(param1)) {
                return true
            }

            if (S2B(param1)) {
                escaper.setLuckyLukeTransparency(LUCKY_LUKE_DEFAULT_TRANSPARENCY)

                Text.mkP(
                    escaper.getPlayer(),
                    `Lucky Luke on: the unit of your hero sliding async is seen with transparency: ${LUCKY_LUKE_DEFAULT_TRANSPARENCY}`
                )
            } else {
                escaper.setLuckyLukeTransparency(undefined)

                Text.mkP(escaper.getPlayer(), `Lucky Luke off: the unit of your hero sliding async is not seen`)
            }

            return true
        },
    })

    //-myStartCommands(msc) [ list [player] | add <command> | del <commandNumber> | ec <commandNumber> | set <commandNumber> <command> | delall ]
    registerCommand({
        name: 'myStartCommands',
        alias: ['msc'],
        group,
        argDescription:
            '[ list [player] | add <command> | del <commandNumber> | ec <commandNumber> | set <commandNumber> <command> | delall ]',
        description: 'Run commands on start of the game',
        cb: ({ cmd, nbParam, param1, param2 }, escaper) => {
            if (!escaper.getStartCommandsHandle().isLoaded()) {
                Text.erP(escaper.getPlayer(), 'Start commands not yet loaded')
                return true
            }

            if (nbParam === 2 && param1 === 'list') {
                const resolvedPlayer = getUdgEscapers().get(resolvePlayerId(param2))

                if (!resolvedPlayer) {
                    return true
                }

                Text.P(escaper.getPlayer(), `${resolvedPlayer.getDisplayName()}'s start commands: `)

                let i = 0
                for (const startCmd of resolvedPlayer.getStartCommandsHandle().getStartCommands()) {
                    Text.P(escaper.getPlayer(), `${++i}: ${startCmd}`)
                }
            } else if (nbParam === 0 || (nbParam === 1 && param1 === 'list')) {
                Text.P(escaper.getPlayer(), 'My start commands: ')

                let i = 0
                for (const startCmd of escaper.getStartCommandsHandle().getStartCommands()) {
                    Text.P(escaper.getPlayer(), `${++i}: ${startCmd}`)
                }
            } else if (param1 === 'del' && nbParam === 2) {
                if (S2I(param2) === 0) {
                    Text.erP(escaper.getPlayer(), 'You must specify a command to delete')
                    return true
                }

                const deletedCmd = escaper.getStartCommandsHandle().removeStartCommand(S2I(param2) - 1)

                if (deletedCmd) {
                    Text.P(escaper.getPlayer(), `Deleted command: '${deletedCmd[0]}'`)
                }
            } else if (param1 === 'delall' && nbParam === 1) {
                escaper.getStartCommandsHandle().removeStartCommands()
                Text.P(escaper.getPlayer(), `Deleted all commands`)
            } else if (param1 === 'add') {
                const targetCmd = cmd.substring(cmd.indexOf(' add ') + 5)

                escaper.getStartCommandsHandle().addStartCommand(targetCmd)
                Text.P(escaper.getPlayer(), `Added command: '${targetCmd}'`)
            } else if (param1 === 'set') {
                if (nbParam < 3) {
                    return USAGE
                }

                if (S2I(param2) === 0) {
                    Text.erP(escaper.getPlayer(), 'You must specify a valid command number')
                    return true
                }

                const targetCmd = cmd.substring(cmd.indexOf(param2) + param2.length + 1)
                const commandIndex = S2I(param2) - 1

                if (escaper.getStartCommandsHandle().setStartCommand(commandIndex, targetCmd)) {
                    Text.P(escaper.getPlayer(), `Command ${param2} updated to: '${targetCmd}'`)
                } else {
                    Text.erP(escaper.getPlayer(), 'Invalid command number')
                }
            } else if (param1 === 'ec' && nbParam === 2) {
                if (S2I(param2) === 0) {
                    Text.erP(escaper.getPlayer(), 'You must specify a command to execute')
                    return true
                }

                const executingCommandNumber = S2I(param2) - 1

                if (!escaper.getStartCommandsHandle().executeStartCommand(executingCommandNumber)) {
                    Text.erP(escaper.getPlayer(), 'Wrong command number')
                }
            }

            return true
        },
    })

    //-userInterface(ui) [off|on|map]
    registerCommand({
        name: 'userInterface',
        alias: ['ui'],
        group,
        argDescription: 'off | on | map',
        description: 'Disable partly or totally the graphical user interface',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return USAGE
            }

            let enable = false
            let showMinimap = false

            if (param1 == 'map') {
                showMinimap = true
            } else if (IsBoolString(param1)) {
                enable = S2B(param1)
            } else {
                return USAGE
            }

            if (!escaper.enableInterface(enable, showMinimap)) {
                Text.erP(escaper.getPlayer(), 'nothing to change')
            }

            return true
        },
    })

    const setAlliedState = (escaper: Escaper, target: Escaper, state: boolean) => {
        if (escaper.getId() === target.getId()) {
            return
        }

        escaper.alliedState[target.getId()] = state

        Text.P(
            escaper.getPlayer(),
            `${udg_colorCode[escaper.getId()]}You|r ${state ? '' : 'un'}allied ${
                udg_colorCode[target.getId()]
            }${target.getDisplayName()}`
        )
        Text.P(
            target.getPlayer(),
            `${udg_colorCode[escaper.getId()]}${escaper.getDisplayName()}|r ${state ? '' : 'un'}allied ${
                udg_colorCode[target.getId()]
            }you`
        )
    }

    //-ally [player]
    registerCommand({
        name: 'ally',
        alias: [],
        group,
        argDescription: 'player',
        description: 'Ally people, lets you revive them',
        cb: ({ param1 }, escaper) => {
            resolvePlayerIds(param1, target => setAlliedState(escaper, target, true))
            return true
        },
    })

    //-unally [player]
    registerCommand({
        name: 'unally',
        alias: [],
        group,
        argDescription: 'player',
        description: 'Unally people, prevents you from reviving them',
        cb: ({ param1 }, escaper) => {
            resolvePlayerIds(param1, target => setAlliedState(escaper, target, false))
            return true
        },
    })

    //-autoTurn(at) async|sync|off   --> steers the hero towards the mouse while sliding
    registerCommand({
        name: 'autoTurn',
        alias: ['at'],
        group,
        argDescription: 'async | sync | off',
        description: 'Turns the hero towards the mouse while sliding: async is instant, sync goes through the network',
        cb: ({ param1 }, escaper) => {
            if (param1.length === 0) {
                Text.mkP(escaper.getPlayer(), `Auto turn is ${getAutoTurnMode(escaper.getId())}`)
                return true
            }

            if (AUTO_TURN_MODES.indexOf(param1 as AutoTurnMode) < 0) {
                Text.erP(escaper.getPlayer(), USAGE + '-autoTurn async|sync|off')
                return true
            }

            setAutoTurnMode(escaper.getId(), param1 as AutoTurnMode)
            updateAsyncNeeds(escaper)
            Text.mkP(escaper.getPlayer(), `Auto turn ${param1}`)

            return true
        },
    })

    //-testLeftClicks(tlc) <boolean>   --> compares the local and the network left click
    registerCommand({
        name: 'testLeftClicks',
        alias: ['tlc'],
        group,
        argDescription: '<boolean>',
        description: 'Left click moves an effect locally and logs how much earlier it is than the network click',
        cb: ({ param1 }, escaper) => {
            if (param1.length === 0) {
                param1 = B2S(!isTestingLeftClicks(escaper.getId()))
            }

            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), USAGE + '-testLeftClicks <boolean>')
                return true
            }

            setTestLeftClicks(escaper.getId(), S2B(param1))
            updateAsyncNeeds(escaper)

            // the catcher is what reads the local click, and it only listens on the machine of
            // the player testing: enabling it for everybody would steal their left clicks
            if (GetLocalPlayer() === escaper.getPlayer()) {
                setClickCatcherEnabled(S2B(param1))
            }

            Text.mkP(escaper.getPlayer(), `Left click test ${S2B(param1) ? 'on' : 'off'}`)

            return true
        },
    })

    //-hideChat(hc)
    registerCommand({
        name: 'hideChat',
        alias: ['hc', 'monk'],
        group,
        argDescription: 'on | off',
        description: 'Hides the chat',
        cb: ({ param1 }, escaper) => {
            if (param1.length === 0) param1 = 'true'

            if (IsBoolString(param1)) {
                const frame = Natives.UBlzGetOriginFrame(ORIGIN_FRAME_CHAT_MSG, 0)

                if (GetLocalPlayer() === escaper.getPlayer()) {
                    BlzFrameSetVisible(frame, !S2B(param1))
                }

                Text.mkP(escaper.getPlayer(), `Chat ${!S2B(param1) ? 'shown' : 'hidden'}`)
            }

            return true
        },
    })

    //-glow <boolean> [player]   --> Toggle your slider glow
    registerCommand({
        name: 'glow',
        alias: [],
        group,
        argDescription: '<boolean> [player]',
        description: 'Change your slider glow',
        cb: ({ param1, param2 }, escaper) => {
            if (param1.length === 0) {
                return true
            }

            if (param2.length === 0) {
                glowCb(escaper, S2B(param1))
                return true
            }

            if (!escaper.isMaximaxou()) {
                return true
            }

            resolvePlayerIds(param2, targetEscaper => glowCb(targetEscaper, S2B(param1)))
            return true
        },
    })

    //-progression(prog) [player]
    registerCommand({
        name: 'progression',
        alias: ['prog'],
        group,
        argDescription: '[player]',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            const targetEscaper = nbParam === 1 ? getUdgEscapers().get(resolvePlayerId(param1)) || escaper : escaper

            Text.P(
                escaper.getPlayer(),
                `Current progression: ${progressionUtils.getPlayerProgression(
                    targetEscaper
                )}%\nHighest progression: ${progressionUtils.getPlayerProgressionLvl(
                    targetEscaper
                )}%\nCurrent level: ${getUdgLevels().getCurrentLevel(targetEscaper).getId()}`
            )

            return true
        },
    })

    //-autoCircle(ac) [<boolean status>]   --> toggle auto circle for current player
    registerCommand({
        name: 'autoCircle',
        alias: [],
        group,
        argDescription: '[<boolean status>]',
        description: 'Toggle auto circle for current player',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            let b = true

            if (noParam) {
                // Toggle: if already on (has timer), turn off; otherwise turn on
                b = !escaper.tClickWhereYouAre
            } else if (nbParam === 1) {
                if (!IsBoolString(param1)) {
                    Text.erP(escaper.getPlayer(), 'param1 must be a boolean')
                    return true
                }
                b = S2B(param1)
            } else {
                Text.erP(escaper.getPlayer(), 'no more than one param allowed for this command')
                return true
            }

            escaper.enableClickWhereYouAre(b)
            if (b) {
                Text.P(escaper.getPlayer(), 'auto circle on')
            } else {
                Text.P(escaper.getPlayer(), 'auto circle off')
            }
            return true
        },
    })

    //-monsterDatabase(mdb) <search>   --> lookup monsters by id, name, or comment
    registerCommand({
        name: 'monsterDatabase',
        alias: ['mdb', 'monsterdb'],
        group,
        argDescription: '<search>',
        description: 'Lookup monsters by id, name, or comment',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return USAGE
            }

            const searchTerm = param1.toLowerCase()
            const results: string[] = []

            for (const [id, data] of Object.entries(creepData)) {
                if (
                    id.toLowerCase().includes(searchTerm) ||
                    data.name.toLowerCase().includes(searchTerm) ||
                    data.comment.toLowerCase().includes(searchTerm)
                ) {
                    results.push(
                        `${udg_colorCode[Constants.TEAL]}${id}|r - ${udg_colorCode[Constants.GREEN]}${data.name}|r - ${
                            udg_colorCode[Constants.GREY]
                        }${data.comment}|r`
                    )
                }
            }

            if (results.length === 0) {
                Text.P(escaper.getPlayer(), `No monsters found matching: "${param1}"`)
            } else {
                Text.P(
                    escaper.getPlayer(),
                    `Found ${results.length} monster(s):\n${results.slice(0, 20).join('\n')}${
                        results.length > 20 ? `\n...and ${results.length - 20} more` : ''
                    }`
                )
            }

            return true
        },
    })

    //-heroStopAction   --> use the basic Stop action from WC3 for your selected units
    registerCommand({
        name: 'heroStopAction',
        alias: [],
        group,
        argDescription: '',
        description: 'Use the basic Stop action from WC3 for your selected units',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                Text.erP(escaper.getPlayer(), 'no parameter allowed with command "heroStopAction"')
                return true
            }

            const group = Natives.UCreateGroup()
            GroupEnumUnitsSelected(group, escaper.getPlayer())
            ForGroup(group, () => {
                const unit = Natives.UGetEnumUnit()
                if (canPlayerControlUnit(escaper.getPlayer(), unit)) {
                    IssueImmediateOrder(unit, 'stop')
                }
            })
            DestroyGroup(group)

            return true
        },
    })

    // -grid <falsyBoolean>|1|2|3]
    registerCommand({
        name: 'grid',
        alias: [],
        group,
        argDescription: '[<falsyBoolean>|1|2|3]',
        description: 'Toggle grid. Best usage is without parameter to switch between all modes.',
        cb: ({ param1, noParam, nbParam }, escaper) => {
            if (GetLocalPlayer() === escaper.getPlayer()) {
                if (nbParam > 1) {
                    return USAGE
                } else if (noParam) {
                    DrawGrid()
                } else {
                    if (IsBoolString(param1) && !S2B(param1)) {
                        DrawGrid(0)
                    } else if (param1 === '1') {
                        DrawGrid(512)
                    } else if (param1 === '2') {
                        DrawGrid(128)
                    } else if (param1 === '3') {
                        DrawGrid(32)
                    } else {
                        return USAGE
                    }
                }
            }

            return true
        },
    })

    // -setGridOpacity
    registerCommand({
        name: 'setGridOpacity',
        alias: ['setgo'],
        group,
        argDescription: '<opacity>|(<opacityGrid1> <opacityGrid2> <opacityGrid3>)',
        description:
            'Set the grid opacity in percentage. You can choose values between 5, 10, 15, 25, 50, 75, and 100. Default opacities are 50%, 50%, 25%.',
        cb: ({ param1, param2, param3, nbParam }, escaper) => {
            if (GetLocalPlayer() === escaper.getPlayer()) {
                if (nbParam !== 1 && nbParam !== 3) {
                    return USAGE
                } else if (nbParam === 1) {
                    const opacity = S2I(param1)
                    if (!checkOpacityValue(opacity)) {
                        return USAGE
                    } else if (SetGridOpacity(opacity)) {
                        Text.mkP(escaper.getPlayer(), `Grid opacity set to ${opacity}%`)
                    } else {
                        Text.erP(escaper.getPlayer(), 'An error occurred while setting the grid opacity')
                    }
                } else {
                    const opacity1 = S2I(param1)
                    const opacity2 = S2I(param2)
                    const opacity3 = S2I(param3)

                    if (!checkOpacityValue(opacity1) || !checkOpacityValue(opacity2) || !checkOpacityValue(opacity3)) {
                        return USAGE
                    } else if (SetGridOpacityForAllGrids(opacity1, opacity2, opacity3)) {
                        Text.mkP(escaper.getPlayer(), `Grid opacities set to ${opacity1}%, ${opacity2}%, ${opacity3}%`)
                    } else {
                        Text.erP(escaper.getPlayer(), 'An error occurred while setting the grid opacities')
                    }
                }
            }

            return true
        },
    })

    // -debugCollisions
    registerCommand({
        name: 'debugCollisions',
        alias: ['debc'],
        group,
        argDescription: '<boolean>',
        description: 'Enable of debug collisions for yourself. Shows collisions circles around units.',
        cb: ({ param1, nbParam }, escaper) => {
            if (nbParam !== 1 || !IsBoolString(param1)) {
                return USAGE
            }

            escaper.setDisplayCollisionLandmarks(S2B(param1))
            Text.mkP(escaper.getPlayer(), `Debug collisions ${S2B(param1) ? 'enabled' : 'disabled'}`)

            return true
        },
    })

    // todo check if we could remove this
    registerCommand({
        name: 'slidingMode',
        alias: [],
        group,
        argDescription: '[normal|max]',
        description: 'Change your sliding mode',
        cb: ({ cmd, nbParam, param1 }, escaper) => {
            if (nbParam == 0) {
                Text.mkP(escaper.getPlayer(), 'your sliding mode is ' + escaper.slidingMode)
            }

            if (nbParam == 1) {
                if (param1 == 'max' || param1 == 'normal') {
                    escaper.slidingMode = param1
                    Text.mkP(escaper.getPlayer(), 'changed sliding mode')
                } else {
                    return USAGE
                }
            }

            return true
        },
    })
}
