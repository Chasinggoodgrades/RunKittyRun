import {
    getUdgLevels,
    getUdgMonsterTypes,
    getUdgTerrainTypes,
    globals,
    setHeroBaseCollisionSize,
} from '../../../../globals'
import { ServiceManager } from '../../../Services'
import {
    convertAngleToDirection,
    convertTextToAngle,
    IsBoolString,
    S2B,
    tileset2tilesetString,
} from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { Text } from '../../01_libraries/Text'
import { IsHeroCollisionSizeValid } from '../../04_STRUCTURES/Escaper/Escaper'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MonsterMultiplePatrols } from '../../04_STRUCTURES/Monster/MonsterMultiplePatrols'
import { MonsterNoMove } from '../../04_STRUCTURES/Monster/MonsterNoMove'
import { MonsterSimplePatrol } from '../../04_STRUCTURES/Monster/MonsterSimplePatrol'
import { PORTAL_MOB_MAX_FREEZE_DURATION } from '../../04_STRUCTURES/Monster_properties/PortalMob'
import { CmdParam, USAGE } from '../Helpers/Command_functions'
import { adaptMonstersImmolation, snapPatrolsToSlideOffsetMap, snapPointToSlide } from '../Helpers/commands-helpers'

export const initExecuteCommandMake = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'make'

    //-createRegion(crr) <regionLabel>
    registerCommand({
        name: 'createRegion',
        alias: ['crr'],
        group,
        argDescription: '<regionLabel>',
        description: 'Create a region',
        cb: ({ param1 }, escaper) => {
            if (param1.length === 0) {
                Text.erP(escaper.getPlayer(), 'regionLabel required')
                return true
            }

            if (escaper.getMakingLevel().monsterSpawns.getByLabel(param1)) {
                Text.erP(escaper.getPlayer(), 'a region with label "' + param1 + '" already exists for this level')
                return true
            }

            escaper.makeCreateRegion(param1)
            Text.mkP(escaper.getPlayer(), 'region making on')
            return true
        },
    })

    //-moveRegionPoint(mrp)
    registerCommand({
        name: 'moveRegionPoint',
        alias: ['mrp'],
        group,
        argDescription: '',
        description: 'Move a region point',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeMoveRegionPoint()
            Text.mkP(escaper.getPlayer(), 'region point moving on')
            return true
        },
    })

    //-displayRegions(drs) [<regionLabel>] [page]
    registerCommand({
        name: 'displayRegions',
        alias: ['drs'],
        group,
        argDescription: '[<regionLabel>] [page]',
        description: 'Displays the regions for this level',
        cb: ({ cmd }, escaper) => {
            escaper.getMakingLevel().regions.displayPaginatedForPlayer(escaper.getPlayer(), cmd)
            return true
        },
    })

    //-getRegionAtPoint(getr|getrap)
    registerCommand({
        name: 'getRegionAtPoint',
        alias: ['getr', 'getrap'],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeGetRegionAtPoint()
            Text.mkP(escaper.getPlayer(), 'Getting region at point enabled')
            return true
        },
    })

    //-deleteRegion(delr) <regionLabel>
    registerCommand({
        name: 'deleteRegion',
        alias: ['delr'],
        group,
        argDescription: '<regionLabel>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (escaper.getMakingLevel().regions.clearRegion(param1)) {
                Text.mkP(escaper.getPlayer(), 'region deleted')
            } else {
                Text.erP(escaper.getPlayer(), 'unknown region for this level')
            }
            return true
        },
    })

    //-setRegionFlag(setrf) <regionLabel> <flag> <boolean>
    registerCommand({
        name: 'setRegionFlag',
        alias: ['setrf'],
        group,
        argDescription: '<regionLabel> <flag> <boolean>',
        description: '',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (!(nbParam === 3)) {
                return true
            }

            const targetRegion = getUdgLevels().getCurrentLevel(escaper).regions.getByLabel(param1)

            if (!targetRegion) {
                Text.erP(escaper.getPlayer(), 'unknown region')
                return true
            }

            if (!IsBoolString(param3)) {
                Text.erP(escaper.getPlayer(), "wrong \"flag boolean\" value ; should be 'true', 'false', '0' or '1'")
                return true
            }

            targetRegion.setFlag(param2, S2B(param3))
            Text.mkP(escaper.getPlayer(), `Region: ${targetRegion.getLabel()}, flag: ${param2}, value: ${param3}`)

            return true
        },
    })

    //-createKey(crk)   --> create meteors used to kill clickable monsters
    registerCommand({
        name: 'createKey',
        alias: ['crk'],
        group,
        argDescription: '',
        description: 'Create meteors used to kill clickable monsters',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeCreateMeteor()
                Text.mkP(escaper.getPlayer(), 'meteor making on')
            }
            return true
        },
    })

    //-deleteKeysBetweenPoints(delkbp)   --> delete meteors in a rectangle formed with two clicks
    registerCommand({
        name: 'deleteKeysBetweenPoints',
        alias: ['delkbp'],
        group,
        argDescription: '',
        description: 'Delete meteors in a rectangle formed with two clicks',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeDeleteMeteors('twoClics')
                Text.mkP(escaper.getPlayer(), 'meteors deleting on')
            }
            return true
        },
    })

    //-deleteKey(delk)   --> delete the meteors clicked by the player
    registerCommand({
        name: 'deleteKey',
        alias: ['delk'],
        group,
        argDescription: '',
        description: 'Delete the meteors clicked by the player',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeDeleteMeteors('oneByOne')
                Text.mkP(escaper.getPlayer(), 'meteors deleting on')
            }
            return true
        },
    })

    //-createStart(crs) [next(n)]   --> create the start (a rectangle formed with two clicks) of the current level or the next one if specified
    registerCommand({
        name: 'createStart',
        alias: ['crs'],
        group,
        argDescription: '[current(c)|next(n)] [facing]',
        description:
            'create the start (a rectangle formed with two clicks) of the current level or the next one if specified',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            let forNext = false
            let facing = param2 !== '' ? convertTextToAngle(param2) : undefined

            //checkParam1
            if (nbParam === 1 || nbParam === 2) {
                if (!(param1 === 'next' || param1 === 'n' || param1 === 'current' || param1 === 'c')) {
                    Text.erP(escaper.getPlayer(), 'param1 should be "next" or "n" or "current" or "c"')
                    return true
                }

                if (param1 === 'next' || param1 === 'n') {
                    forNext = true
                }
            } else {
                forNext = false
            }
            escaper.makeCreateStart(forNext, facing) //b signifie si le "Start" est créé pour le niveau suivant (sinon pour le niveau en cours de mapping pour l'escaper)
            Text.mkP(escaper.getPlayer(), 'start making on')
            return true
        },
    })

    //-createEnd(cre)   --> create the end (a rectangle formed with two clicks) of the current level
    registerCommand({
        name: 'createEnd',
        alias: ['cre'],
        group,
        argDescription: '',
        description: 'Create the end (a rectangle formed with two clicks) of the current level',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeCreateEnd()
            Text.mkP(escaper.getPlayer(), 'end making on')
            return true
        },
    })

    //-createTpForEnd(cre)   --> create the (facultative) TP for end (a rectangle formed with two clicks) of the current level
    registerCommand({
        name: 'createTpForEnd',
        alias: ['crtpfe'],
        group,
        argDescription: '',
        description:
            'Create the (facultative) TP for end (a rectangle formed with two clicks) of the current level => the hero will teleported to center of end rect',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeCreateTpForEnd()
            Text.mkP(escaper.getPlayer(), 'TP for end making on')
            return true
        },
    })

    //-getMakingLevel(getmkl)   --> displays the id of the level the player is creating (the first one is id 0)
    registerCommand({
        name: 'getMakingLevel',
        alias: ['getmkl'],
        group,
        argDescription: '',
        description: 'Displays the id of the level the player is creating (the first one is id 0)',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }

            let str = ''

            if (getUdgLevels().getCurrentLevel() == escaper.getMakingLevel()) {
                str = ' (same as current level)'
            } else {
                str = ''
            }
            Text.P(
                escaper.getPlayer(),
                'the level you are making is number ' + I2S(escaper.getMakingLevel().getId()) + str
            )
            return true
        },
    })

    //-setMakingLevel(setmkl) <levelId> | current(c)   --> sets the level the players chose to continue creating
    registerCommand({
        name: 'setMakingLevel',
        alias: ['setmkl'],
        group,
        argDescription: '<levelId> | current(c)',
        description: 'Sets the level the players chose to continue creating',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (IsPositiveInteger(param1)) {
                const n = S2I(param1)
                if (getUdgLevels().getLastLevelId() < n) {
                    if (n - getUdgLevels().getLastLevelId() == 1) {
                        if (!!getUdgLevels().new()) {
                            Text.mkP(escaper.getPlayer(), 'level number ' + I2S(n) + ' created')
                        } else {
                            Text.erP(escaper.getPlayer(), 'nombre maximum de niveaux atteint')
                            return true
                        }
                    } else {
                        Text.erP(escaper.getPlayer(), "this level doesn't exist")
                        return true
                    }
                }

                const level = getUdgLevels().get(n)
                if (level && escaper.setMakingLevel(level)) {
                    Text.mkP(escaper.getPlayer(), 'you are now making level ' + I2S(n))
                } else {
                    Text.erP(escaper.getPlayer(), 'you are already making this level')
                }
            } else {
                if (param1 === 'current' || param1 === 'c') {
                    if (escaper.setMakingLevel(null)) {
                        Text.mkP(
                            escaper.getPlayer(),
                            'you are now making current level (which is at the moment number ' +
                                I2S(getUdgLevels().getCurrentLevel().getId()) +
                                ')'
                        )
                    } else {
                        Text.erP(escaper.getPlayer(), 'you are already making current level')
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'param1 should be a level id or "current"')
                }
            }
            return true
        },
    })

    //-newLevel(newl)   --> creates a new level after the last one
    registerCommand({
        name: 'newLevel',
        alias: ['newl'],
        group,
        argDescription: '',
        description: 'Creates a new level after the last one',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                if (!!getUdgLevels().new()) {
                    Text.mkP(escaper.getPlayer(), 'level number ' + I2S(getUdgLevels().getLastLevelId()) + ' created')
                } else {
                    Text.erP(escaper.getPlayer(), 'nombre maximum de niveaux atteint')
                }
            }
            return true
        },
    })

    //-copyLevel
    registerCommand({
        name: 'copyLevel',
        alias: [],
        group,
        argDescription: '',
        description: 'Creates a new level after the last one by copying the current make level',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                const currentLevel = escaper.getMakingLevel()

                getUdgLevels().newFromJson([currentLevel.toJson()], true, true)

                Text.mkP(
                    escaper.getPlayer(),
                    `Copied level: ${currentLevel.getId()} to ${getUdgLevels().getLastLevelId()}`
                )
            }
            return true
        },
    })

    //-copyLevelPatrol <targetLvl>
    registerCommand({
        name: 'copyLevelPatrol',
        alias: ['clp'],
        group,
        argDescription: '<targetLvl>',
        description: '',
        cb: ({ param1 }, escaper) => {
            const targetLevel = getUdgLevels().get(S2I(param1))

            if (!targetLevel || param1 === '') {
                Text.erP(escaper.getPlayer(), 'Target level does not exist')
                return true
            }

            escaper.makeCopyLevelPatrol(targetLevel, 'oneByOne')
            Text.mkP(escaper.getPlayer(), `Click on a monster to copy to level: ${targetLevel.getId()}`)
            return true
        },
    })

    //-copyLevelPatrolBetweenPoints <targetLvl>
    registerCommand({
        name: 'copyLevelPatrolBetweenPoints',
        alias: ['clpbp'],
        group,
        argDescription: '<targetLvl>',
        description: '',
        cb: ({ param1 }, escaper) => {
            const targetLevel = getUdgLevels().get(S2I(param1))

            if (!targetLevel || param1 === '') {
                Text.erP(escaper.getPlayer(), 'Target level does not exist')
                return true
            }

            escaper.makeCopyLevelPatrol(targetLevel, 'all')
            Text.mkP(escaper.getPlayer(), `Click on a region to copy to level: ${targetLevel.getId()}`)
            return true
        },
    })

    //-setLivesEarned(setle) <livesNumber> [<levelID>]   --> the number of lives earned at the specified level
    registerCommand({
        name: 'setLivesEarned',
        alias: ['setle'],
        group,
        argDescription: '<livesNumber> [<levelID>]',
        description: 'The number of lives earned at the specified level',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam >= 1 && nbParam <= 2)) {
                return true
            }
            //check param1
            if (!IsPositiveInteger(param1)) {
                Text.erP(escaper.getPlayer(), 'the number of lives must be a positive integer')
                return true
            }

            let level: Level | null = null

            //check param2
            if (nbParam === 2) {
                if (!IsPositiveInteger(param2)) {
                    Text.erP(escaper.getPlayer(), 'the level number must be a positive integer')
                    return true
                }
                level = getUdgLevels().get(S2I(param2))
                if (!level) {
                    Text.erP(escaper.getPlayer(), 'level number ' + param2 + " doesn't exist")
                    return true
                }
            } else {
                level = escaper.getMakingLevel()
            }
            level.setNbLivesEarned(S2I(param1))
            if (level.getId() > 0) {
                Text.mkP(
                    escaper.getPlayer(),
                    'the number of lives earned at level ' + I2S(level.getId()) + ' is now ' + param1
                )
            } else {
                Text.mkP(escaper.getPlayer(), 'the number of lives at the beginning of the game is now ' + param1)
            }
            return true
        },
    })

    //-createVisibility(crv)   --> create visibility rectangles for the current level
    registerCommand({
        name: 'createVisibility',
        alias: ['crv'],
        group,
        argDescription: '',
        description: 'Create visibility rectangles for the current level',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeCreateVisibilityModifier()
                Text.mkP(escaper.getPlayer(), 'visibility making on')
            }
            return true
        },
    })

    //-setLevelResetVisibilities(setlrv) <boolean> [<levelId>]   --> set whether visibilities are reset when re-entering the level
    registerCommand({
        name: 'setLevelResetVisibilities',
        alias: ['setlrv'],
        group,
        argDescription: '<boolean> [<levelId>]',
        description:
            'Set whether visibilities are reset when re-entering the level (applies a total black mask on the map when true)',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam > 2 || !IsBoolString(param1)) {
                return USAGE
            }

            const levelNum = nbParam == 2 ? S2I(param2) : escaper.getMakingLevel().getId()
            const level = getUdgLevels().get(levelNum)
            if (!level) {
                Text.erP(escaper.getPlayer(), `Level number ${param2} doesn't exist`)
                return true
            }

            const doReset = S2B(param1)

            if (level.getResetVisiblitiesAtStart() === doReset) {
                Text.erP(
                    escaper.getPlayer(),
                    `Level ${levelNum} already has reset visibilities at start set to ${param1}`
                )
                return true
            }

            level.setResetVisiblitiesAtStart(doReset)
            Text.mkP(
                escaper.getPlayer(),
                `Level ${levelNum} will ${doReset ? '' : 'no longer '}reset visibilities at start`
            )

            return true
        },
    })

    //-removeVisibilities(remv) [<levelId>]   --> remove all visibility rectangles made for the current level
    registerCommand({
        name: 'removeVisibilities',
        alias: ['remv'],
        group,
        argDescription: '[<levelId>]',
        description: 'Remove all visibility rectangles made for the current level',
        cb: ({ noParam, nbParam, param1, param2 }, escaper) => {
            if (!(noParam || nbParam === 1)) {
                return true
            }

            let level: Level | null = null

            //check param1
            if (nbParam === 1) {
                if (!IsPositiveInteger(param1)) {
                    Text.erP(escaper.getPlayer(), 'the level number must be a positive integer')
                    return true
                }
                level = getUdgLevels().get(S2I(param2))
                if (!level) {
                    Text.erP(escaper.getPlayer(), 'level number ' + param1 + " doesn't exist")
                    return true
                }
            } else {
                level = escaper.getMakingLevel()
            }
            level.removeVisibilities()
            Text.mkP(escaper.getPlayer(), 'visibilities removed for level ' + I2S(level.getId()))
            return true
        },
    })

    //-setStartMessage(setsm) [<message>]   --> sets the start message of the current level (spaces allowed)
    registerCommand({
        name: 'setStartMessage',
        alias: ['setsm'],
        group,
        argDescription: '[<message>]',
        description: 'Sets the start message of the current level (spaces allowed)',
        cb: ({ cmd }, escaper) => {
            escaper.getMakingLevel().setStartMessage(CmdParam(cmd, 0))
            Text.mkP(
                escaper.getPlayer(),
                'start message for level ' + I2S(escaper.getMakingLevel().getId()) + ' changed'
            )
            return true
        },
    })

    //-getStartMessage(getsm)   --> displays the start message of the current level
    registerCommand({
        name: 'getStartMessage',
        alias: ['getsm'],
        group,
        argDescription: '',
        description: 'Displays the start message of the current level',
        cb: ({}, escaper) => {
            const str = escaper.getMakingLevel().getStartMessage()
            if (str === '' || str === null) {
                Text.mkP(
                    escaper.getPlayer(),
                    'start message for level ' + I2S(escaper.getMakingLevel().getId()) + ' is not defined'
                )
            } else {
                Text.mkP(
                    escaper.getPlayer(),
                    'start message for level ' + I2S(escaper.getMakingLevel().getId()) + ' is "' + str + '"'
                )
            }
            return true
        },
    })

    //-cancel(z)   --> cancel the last action made on the map
    registerCommand({
        name: 'cancel',
        alias: ['z'],
        group,
        argDescription: '',
        description: 'Cancel the last action made on the map',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                if (!escaper.cancelLastAction()) {
                    Text.erP(escaper.getPlayer(), 'nothing to cancel')
                }
            }
            return true
        },
    })

    //-redo(y)   --> redo the last action cancelled
    registerCommand({
        name: 'redo',
        alias: ['y'],
        group,
        argDescription: '',
        description: 'Redo the last action cancelled',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                if (!escaper.redoLastAction()) {
                    Text.erP(escaper.getPlayer(), 'nothing to redo')
                }
            }
            return true
        },
    })

    //-nbLevels(nbl)   --> display the number of levels that are currently in the map
    registerCommand({
        name: 'nbLevels',
        alias: ['nbl'],
        group,
        argDescription: '',
        description: 'Display the number of levels that are currently in the map',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                const n = getUdgLevels().count()

                if (n > 1) {
                    Text.P(escaper.getPlayer(), 'there are currently ' + I2S(n) + ' levels in the map')
                } else {
                    Text.P(escaper.getPlayer(), 'there is currently ' + I2S(n) + ' level in the map')
                }
            }
            return true
        },
    })

    //-createStaticSlide(crss) <angle> <speed>
    registerCommand({
        name: 'createStaticSlide',
        alias: ['crss'],
        group,
        argDescription: '<angle> <speed>',
        description: '',
        cb: ({ param1, param2 }, escaper) => {
            const angle = convertTextToAngle(param1)

            if (!angle) {
                Text.erP(escaper.getPlayer(), 'Angle must be > 0 and <= 360')
                return true
            }

            if (!(S2I(param2) > 0 && S2I(param2) <= 1000)) {
                Text.erP(escaper.getPlayer(), 'Speed must be > 0 and <= 1000')
                return true
            }

            Text.mkP(escaper.getPlayer(), 'Static slide creation on. Click for regions')

            escaper.makeCreateStaticSlide(angle, S2I(param2))

            return true
        },
    })

    //-deleteStaticSlide
    registerCommand({
        name: 'deleteStaticSlide',
        alias: ['delss'],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeDeleteStaticSlide()
            Text.mkP(escaper.getPlayer(), 'static slide deletion on')
            return true
        },
    })

    //-getStaticSlideInfo
    registerCommand({
        name: 'getStaticSlideInfo',
        alias: ['gssi', 'getssi'],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeStaticSlideInfo()
            Text.mkP(escaper.getPlayer(), 'Click on a static slide')
            return true
        },
    })

    //-setStaticSlideSpeed(setsss) <speed>
    registerCommand({
        name: 'setStaticSlideSpeed',
        alias: ['setsss'],
        group,
        argDescription: '<speed>',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (!(S2I(param1) > 0 && S2I(param1) <= 1000)) {
                Text.erP(escaper.getPlayer(), 'Speed must be > 0 and <= 1000')
                return true
            }

            escaper.makeSetStaticSlideSpeed(S2R(param1))
            Text.mkP(escaper.getPlayer(), 'Click on the staticSlide to apply')
            return true
        },
    })

    //-setStaticSlideAngle(setssa) <angle>
    registerCommand({
        name: 'setStaticSlideAngle',
        alias: ['setssa'],
        group,
        argDescription: '<angle>',
        description: '',
        cb: ({ param1 }, escaper) => {
            const angle = convertTextToAngle(param1)

            if (!angle) {
                Text.erP(escaper.getPlayer(), 'Angle must be > 0 and <= 360')
                return true
            }

            escaper.makeSetStaticSlideAngle(angle)
            Text.mkP(escaper.getPlayer(), 'Click on the staticSlide to apply')
            return true
        },
    })

    //-setStaticSlideCanTurnAngle(setsscta) <angle>
    registerCommand({
        name: 'setStaticSlideCanTurnAngle',
        alias: ['setsscta'],
        group,
        argDescription: '<angle>',
        description: '',
        cb: ({ param1 }, escaper) => {
            escaper.makeSetStaticSlideCanTurnAngle(convertTextToAngle(param1))
            Text.mkP(escaper.getPlayer(), 'Click on the staticSlide to apply')
            return true
        },
    })

    //-debugRegions <active>
    registerCommand({
        name: 'debugRegions',
        alias: ['dr'],
        group,
        argDescription: '<active> [monsters]',
        description: '',
        cb: ({ param1, param2 }, escaper) => {
            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'the property "active" must be a boolean (true or false)')
                return true
            }

            if (param2.length > 0 && !IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), 'the property "monsters" must be a boolean (true or false)')
                return true
            }

            const mode =
                param2.length > 0 ? (S2B(param1) && S2B(param2) ? 'on_monsters' : 'off') : S2B(param1) ? 'on' : 'off'

            // Kept for every level, so that the next one to start draws its lines too: until now it
            // was set on the level being made only, which lost it when it ended.
            Level.debugRegionsMode = mode

            escaper.getMakingLevel().setDebugRegionsVisible(mode)

            for (const [_, level] of pairs(getUdgLevels().getAll())) {
                if (level.isActivated() && level !== escaper.getMakingLevel()) {
                    level.setDebugRegionsVisible(mode)
                }
            }

            Text.mkP(escaper.getPlayer(), `debugRegions ${S2B(param1) ? 'on' : 'off'}`)
            return true
        },
    })

    //-createPortalMob(crpm) <freezeDuration> [<portalEffect> [<portalEffectDuration>]]
    registerCommand({
        name: 'createPortalMob',
        alias: ['crpm'],
        group,
        argDescription: '<freezeDuration> [<portalEffect> [<portalEffectDuration>]]',
        description: 'Create a portal mob',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2 || nbParam === 3)) {
                return true
            }
            const x = S2R(param1)
            if (x !== 0 && (x > PORTAL_MOB_MAX_FREEZE_DURATION || x < 0)) {
                Text.erP(
                    escaper.getPlayer(),
                    'the disable duration must be a real between ' +
                        R2S(0) +
                        ' and ' +
                        R2S(PORTAL_MOB_MAX_FREEZE_DURATION)
                )
                return true
            }

            if (param3 !== '') {
                if (!(S2R(param3) > 0)) {
                    Text.erP(escaper.getPlayer(), 'the portal effect duration must be > 0')
                    return true
                }
            }

            escaper.makeCreatePortalMobs(x, param2, param3 === '' ? null : S2R(param3))
            Text.mkP(escaper.getPlayer(), 'portal mob making on')
            return true
        },
    })

    //-deletePortalMob(delpm)
    registerCommand({
        name: 'deletePortalMob',
        alias: ['delpm'],
        group,
        argDescription: '',
        description: 'Delete the portal mob',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeDeletePortalMobs()
            Text.mkP(escaper.getPlayer(), 'portal mobs deleting on')
            return true
        },
    })

    //-setPortalMobFreezeDuration(spmfd) <freezeDuration>
    registerCommand({
        name: 'setPortalMobFreezeDuration',
        alias: ['setpmfd'],
        group,
        argDescription: '<freezeDuration>',
        description: 'Set the freeze duration of the portal mob',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            const x = S2R(param1)
            if (x !== 0 && (x > PORTAL_MOB_MAX_FREEZE_DURATION || x < 0)) {
                Text.erP(
                    escaper.getPlayer(),
                    'the disable duration must be a real between ' +
                        R2S(0) +
                        ' and ' +
                        R2S(PORTAL_MOB_MAX_FREEZE_DURATION)
                )
                return true
            }
            escaper.makeSetPortalMobFreezeDuration(x)
            Text.mkP(escaper.getPlayer(), 'portal mob freeze duration setting on')
            return true
        },
    })

    //-setPortalMobEffect(spme) <portalEffect>
    registerCommand({
        name: 'setPortalMobEffect',
        alias: ['setpme'],
        group,
        argDescription: '<portalEffect>',
        description: 'Set the portal effect of the portal mob',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }

            escaper.makeSetPortalMobPortalEffect(param1)
            Text.mkP(escaper.getPlayer(), 'portal mob portal effect setting on')
            return true
        },
    })

    //-setPortalMobEffectDuration(spmed) <portalEffectDuration>
    registerCommand({
        name: 'setPortalMobEffectDuration',
        alias: ['setpmed'],
        group,
        argDescription: '<portalEffectDuration>',
        description: 'Set the portal effect duration of the portal mob',
        cb: ({ param1 }, escaper) => {
            if (param1 !== '') {
                if (!(S2R(param1) > 0)) {
                    Text.erP(escaper.getPlayer(), 'the portal effect duration must be > 0')
                    return true
                }
            }

            escaper.makeSetPortalMobPortalEffectDuration(param1 === '' ? null : S2R(param1))
            Text.mkP(escaper.getPlayer(), 'portal mob portal effect duration setting on')
            return true
        },
    })

    //-getTerrainCliffClass(gettcc) <terrainLabel>
    registerCommand({
        name: 'getTerrainCliffClass',
        alias: ['gettcc'],
        group,
        argDescription: '<terrainLabel>',
        description: 'Get the cliff class of the terrain',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }

            //checkParam 1
            const terrainType = getUdgTerrainTypes().getByLabel(param1)

            if (!terrainType) {
                return true
            }

            //apply command
            terrainType &&
                Text.mkP(escaper.getPlayer(), 'cliff class for that terrain is ' + I2S(terrainType.getCliffClassId()))

            return true
        },
    })

    //-getMainTileset
    registerCommand({
        name: 'getMainTileset',
        alias: [],
        group,
        argDescription: '',
        description: 'Get the main tileset',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            if (getUdgTerrainTypes().getMainTileset() == 'auto') {
                Text.mkP(escaper.getPlayer(), 'main tile: auto')
            } else {
                Text.mkP(
                    escaper.getPlayer(),
                    'main tile: ' +
                        getUdgTerrainTypes().getMainTileset() +
                        ' = ' +
                        tileset2tilesetString(getUdgTerrainTypes().getMainTileset())
                )
            }
            return true
        },
    })

    // -setHeroCollisionSize <value>
    registerCommand({
        name: 'setHeroBaseCollisionSize',
        alias: ['sethbcs'],
        group,
        argDescription: '<value>',
        description:
            'Sets the base hero collision size. Persistent between "smiced" games. Value between 0 and 200, by steps of 5.',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return USAGE
            }

            const value = S2I(param1)
            if (!IsHeroCollisionSizeValid(value)) {
                return USAGE
            }

            setHeroBaseCollisionSize(value)

            Text.mkP(escaper.getPlayer(), 'Hero base collision size set to ' + I2S(value))

            return true
        },
    })

    // -getHeroCollisionSize
    registerCommand({
        name: 'getHeroBaseCollisionSize',
        alias: ['gethbcs'],
        group,
        argDescription: '',
        description: 'Displays the base hero collision size.',
        cb: ({ nbParam }, escaper) => {
            if (nbParam !== 0) {
                return USAGE
            }

            Text.mkP(escaper.getPlayer(), 'Hero base collision size currently is ' + globals.heroBaseCollisionSize)

            return true
        },
    })

    // -patchImmo [<heroBaseCollisionSize>]
    registerCommand({
        name: 'patchImmo',
        alias: [],
        group,
        argDescription: '[<heroBaseCollisionSize>]',
        description:
            'Change the hero base collision size to the given value (between 0 and 200, by steps of 5, default 25) and change all monsters immolation to keep the same gameplay.',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam > 1) {
                return USAGE
            }

            let newHeroBaseCollisionSize = Constants.RECOMMANDED_HERO_BASE_COLLISION_SIZE
            if (nbParam === 1) {
                newHeroBaseCollisionSize = S2I(param1)
                if (!IsHeroCollisionSizeValid(newHeroBaseCollisionSize)) {
                    return USAGE
                }
            }

            if (newHeroBaseCollisionSize === globals.heroBaseCollisionSize) {
                Text.erP(
                    escaper.getPlayer(),
                    `The hero base collision size is already set to ${newHeroBaseCollisionSize}.`
                )
                return true
            }

            const delta = globals.heroBaseCollisionSize - newHeroBaseCollisionSize
            adaptMonstersImmolation(delta)
            setHeroBaseCollisionSize(newHeroBaseCollisionSize)

            Text.mkP(
                escaper.getPlayer(),
                `Hero base collision size set to ${newHeroBaseCollisionSize} and all monsters immolation radius adapted accordingly.`
            )
            return true
        },
    })

    // -setClickGrid <value>
    registerCommand({
        name: 'setClickGrid',
        alias: ['setcg', 'snapClicks'],
        group,
        argDescription: '<value>',
        description: 'Snap clicks to nearest <value>',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1) {
                escaper.roundToGrid = S2I(param1) > 1 && S2I(param1) <= 128 ? S2I(param1) : null

                if (escaper.roundToGrid) {
                    Text.mkP(escaper.getPlayer(), `Now snapping clicks to: '${escaper.roundToGrid}'`)
                } else {
                    Text.erP(escaper.getPlayer(), `Disabled snapping clicks`)
                }
            }

            return true
        },
    })

    // -snapPatrolsToGrid <value>
    registerCommand({
        name: 'snapPatrolsToGrid',
        alias: ['sptg'],
        group,
        argDescription: '<value>',
        description: 'Snap all patrols to nearest <value>',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1) {
                const roundToGrid = S2I(param1) > 1 && S2I(param1) <= 128 ? S2I(param1) : null

                // todo should turn this into a ctrl+z able action
                if (roundToGrid) {
                    for (const [_, level] of pairs(getUdgLevels().getAll())) {
                        for (const [_, monster] of pairs(level.monsters.getAll())) {
                            if (monster instanceof MonsterSimplePatrol) {
                                monster.x1 = Math.round(monster.x1 / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                monster.y1 = Math.round(monster.y1 / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                monster.x2 = Math.round(monster.x2 / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                monster.y2 = Math.round(monster.y2 / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                            } else if (monster instanceof MonsterNoMove) {
                                monster.x = Math.round(monster.x / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                monster.y = Math.round(monster.y / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                            } else if (monster instanceof MonsterMultiplePatrols) {
                                for (let i = 0; i < monster.x.length; i++) {
                                    monster.x[i] =
                                        Math.round(monster.x[i] / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                    monster.y[i] =
                                        Math.round(monster.y[i] / roundToGrid) * roundToGrid + GetRandomInt(-4, 4)
                                }
                            }
                        }
                    }
                }

                getUdgLevels().reloadAllLevels()

                Text.mkP(escaper.getPlayer(), `Snapped all monsters to: '${roundToGrid}'`)
            }

            return true
        },
    })

    // -snapPatrolsToSlideOffset [<mt> <angle> <offset>]
    registerCommand({
        name: 'snapPatrolsToSlideOffset',
        alias: ['sptso'],
        group,
        argDescription: '[<mt> <angle> <offset>]',
        description: '',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam === 0) {
                for (const [mt, item] of pairs(snapPatrolsToSlideOffsetMap)) {
                    Text.mkP(escaper.getPlayer(), `${mt}: ${convertAngleToDirection(item.angle)} ${item.offset}`)
                }

                return true
            } else {
                const mt = param1
                const angle = convertTextToAngle(param2)
                const offset = S2I(param3)

                if (!getUdgMonsterTypes().getByLabel(mt) && mt !== 'all') {
                    Text.erP(escaper.getPlayer(), `Invalid monster type`)
                    return true
                }

                if (!angle) {
                    snapPatrolsToSlideOffsetMap[mt] = null
                    Text.P(escaper.getPlayer(), `Disabled offset for ${mt}`)
                    return true
                }

                if (param3 === '' || offset < -256 || offset > 256) {
                    Text.erP(escaper.getPlayer(), `Offset must be between -256 and 256`)
                    return true
                }

                snapPatrolsToSlideOffsetMap[mt] = { angle, offset }

                Text.mkP(
                    escaper.getPlayer(),
                    `Set angle to ${convertAngleToDirection(angle)} and offset to ${offset} for ${mt}`
                )
                return true
            }
        },
    })

    // -snapPatrolsToSlide <value> [boolean fixStartOnSlidePatrols]
    registerCommand({
        name: 'snapPatrolsToSlide',
        alias: ['spts'],
        group,
        argDescription: '<value> [boolean fixStartOnSlidePatrols]',
        description: 'Snap all patrols to nearest slide terrain with an offset of <value>',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam === 1 || nbParam === 2) {
                const snapToSlide = S2I(param1)

                if (snapToSlide > 256) {
                    Text.erP(escaper.getPlayer(), `Snap to slide value must be between -256 and 256`)
                    return true
                }

                const fixStartOnSlidePatrols = S2B(param2)

                // todo should turn this into a ctrl+z able action
                if (!!snapToSlide) {
                    const currentVtoto = globals.USE_VTOTO_SLIDE_LOGIC
                    globals.USE_VTOTO_SLIDE_LOGIC = true

                    for (const [_, level] of pairs(getUdgLevels().getAll())) {
                        for (const [_, monster] of pairs(level.monsters.getAll())) {
                            if (!monster.mt) {
                                continue
                            }

                            if (monster instanceof MonsterSimplePatrol) {
                                const p1 = snapPointToSlide(
                                    `${monster.id}_1`,
                                    monster.x1,
                                    monster.y1,
                                    monster.x2,
                                    monster.y2,
                                    snapToSlide,
                                    fixStartOnSlidePatrols,
                                    monster.mt
                                )

                                const p2 = snapPointToSlide(
                                    `${monster.id}_2`,
                                    monster.x2,
                                    monster.y2,
                                    monster.x1,
                                    monster.y1,
                                    snapToSlide,
                                    fixStartOnSlidePatrols,
                                    monster.mt
                                )

                                monster.x1 = p1.x
                                monster.y1 = p1.y
                                monster.x2 = p2.x
                                monster.y2 = p2.y

                                p1.__destroy()
                                p2.__destroy()
                            } else if (monster instanceof MonsterMultiplePatrols) {
                                for (let i = 0; i < monster.x.length; i++) {
                                    const nx = i + 1 > monster.x.length - 1 ? 0 : i + 1
                                    const ny = i + 1 > monster.y.length - 1 ? 0 : i + 1

                                    const p1 = snapPointToSlide(
                                        `${monster.id}_${i}`,
                                        monster.x[i],
                                        monster.y[i],
                                        monster.x[nx],
                                        monster.y[ny],
                                        snapToSlide,
                                        fixStartOnSlidePatrols,
                                        monster.mt
                                    )

                                    monster.setLocAt(i, p1.x, p1.y)
                                    p1.__destroy()
                                }
                            }
                        }
                    }

                    globals.USE_VTOTO_SLIDE_LOGIC = currentVtoto
                }

                getUdgLevels().reloadAllLevels()

                Text.mkP(escaper.getPlayer(), `Snapped all monsters to: '${snapToSlide}'`)
            }

            return true
        },
    })
}
