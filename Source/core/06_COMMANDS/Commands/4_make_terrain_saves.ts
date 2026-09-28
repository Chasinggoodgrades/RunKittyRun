import { getUdgLevels, getUdgTerrainSaves } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { errorHandler } from '../../../Utils/mapUtils'
import { Constants } from '../../01_libraries/Constants'
import { IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { Text } from '../../01_libraries/Text'
import type { Level } from '../../04_STRUCTURES/Level/Level'
import type { TerrainSave } from '../../04_STRUCTURES/TerrainSave/TerrainSave'
import type {
    TerrainSaveEvent,
    TerrainSaveEventAction,
    TerrainSaveEventCondition,
    TerrainSaveEventOnLvlEnd,
    TerrainSaveEventPeriodicInterval,
} from '../../04_STRUCTURES/TerrainSave/TerrainSaveEvent'
import { parseKeyValueParam, USAGE } from '../Helpers/Command_functions'
import {
    compareTerrainSaveEventsForDisplay,
    compareTerrainSavesForDisplay,
    displayTerrainSaveDetail,
    displayTerrainSaveEventDetail,
    formatTerrainSaveEventSummaryLine,
    formatTerrainSaveSummaryLine,
    isNewTerrainSaveLabelValid,
    parsePeriodicIntervalValue,
} from '../Helpers/Command_functions-terrainSaves'
import { handlePagination } from '../Helpers/Pagination'

export const initExecuteCommandMake_terrain_saves = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'make'

    //-saveTerrain(st) <label> [all|rect] [global|g]
    registerCommand({
        name: 'saveTerrain',
        alias: ['st'],
        group,
        argDescription: '<label> [all|rect] [global|g]',
        description:
            'Saves the whole terrain or a clicked zone into a name, associated to the current level unless "global"/"g" is passed',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam < 1 || nbParam > 3) {
                return USAGE
            }

            const label = param1
            if (!isNewTerrainSaveLabelValid(label)) {
                Text.erP(escaper.getPlayer(), 'terrain save label cannot start with a digit or with "-"')
                return true
            }

            if (nbParam >= 2 && param2 !== 'all' && param2 !== 'rect') {
                return USAGE
            }

            let level: Level | null = escaper.getMakingLevel()
            if (nbParam === 3) {
                if (param3 !== 'global' && param3 !== 'g') {
                    return USAGE
                }
                level = null
            }

            if (param2 === 'rect') {
                if (!getUdgTerrainSaves().canAssignLevel(label, level)) {
                    Text.erP(
                        escaper.getPlayer(),
                        `terrain save label "${label}" already used for this level/global scope`
                    )
                    return true
                }

                const make = escaper.makeSaveTerrainZone(label, level)
                if (make) {
                    Text.mkP(escaper.getPlayer(), make.getMakingMessage())
                } else {
                    Text.erP(escaper.getPlayer(), 'failed to initiate the creation of the terrain save')
                }
                return true
            }

            let terrainSave: TerrainSave | undefined = undefined

            errorHandler(
                () => {
                    terrainSave = getUdgTerrainSaves().new(label, level, null)
                    terrainSave.captureTerrain()
                },
                e => {
                    if (terrainSave !== undefined) {
                        getUdgTerrainSaves().remove(terrainSave)
                        terrainSave = undefined
                    }
                    Text.erP(escaper.getPlayer(), typeof e === 'string' ? e : 'failed to create terrain save')
                }
            )()

            if (terrainSave !== undefined) {
                Text.mkP(escaper.getPlayer(), `terrain save "${label}" created`)
            }
            return true
        },
    })

    //-loadTerrain(lt) <label>
    registerCommand({
        name: 'loadTerrain',
        alias: ['lt'],
        group,
        argDescription: '<label>',
        description: 'Applies the terrain save <label>',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            terrainSave.apply()
            Text.mkP(escaper.getPlayer(), 'terrain loaded')
            return true
        },
    })

    //-unloadTerrain(ult) <label>
    registerCommand({
        name: 'unloadTerrain',
        alias: ['ult'],
        group,
        argDescription: '<label>',
        description: 'Unapplies the terrain save <label>, restoring the terrain from before it was applied',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            if (terrainSave.unapply()) {
                Text.mkP(escaper.getPlayer(), 'terrain unloaded')
            } else {
                Text.erP(escaper.getPlayer(), 'this terrain save is not currently applied')
            }
            return true
        },
    })

    //-displayTerrainSave(dts) [<label>|<levelNum>|global|g|current|c] [page]
    registerCommand({
        name: 'displayTerrainSave',
        alias: ['dts'],
        group,
        argDescription: '[<label>|<levelNum>|global|g|current|c] [page]',
        description:
            'Displays terrain saves - a label shows details, otherwise lists them (defaults to every terrain save), filterable and paginated',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam > 2) {
                return USAGE
            }

            const currentLevel = escaper.getMakingLevel()

            const isSelector =
                nbParam === 0 ||
                param1 === 'global' ||
                param1 === 'g' ||
                param1 === 'current' ||
                param1 === 'c' ||
                IsPositiveInteger(param1)

            if (!isSelector) {
                if (nbParam > 1) {
                    return USAGE
                }

                const terrainSave = getUdgTerrainSaves().resolveLabel(param1, currentLevel)
                if (terrainSave === null) {
                    Text.erP(
                        escaper.getPlayer(),
                        "this terrain save doesn't exist, or at least not on your current level"
                    )
                    return true
                }

                displayTerrainSaveDetail(terrainSave, escaper.getPlayer())
                return true
            }

            let filterLevel: Level | null | 'all' = 'all'
            if (nbParam >= 1 && param1 !== '') {
                if (param1 === 'global' || param1 === 'g') {
                    filterLevel = null
                } else if (param1 === 'current' || param1 === 'c') {
                    filterLevel = currentLevel
                } else {
                    const level = getUdgLevels().get(S2I(param1))
                    if (level === null) {
                        Text.erP(escaper.getPlayer(), 'unknown level')
                        return true
                    }
                    filterLevel = level
                }
            }

            if (nbParam === 2 && !IsPositiveInteger(param2)) {
                return USAGE
            }
            const pageNum = nbParam === 2 ? S2I(param2) : 1

            const matchingTerrainSaves: TerrainSave[] = []
            if (filterLevel === 'all') {
                getUdgTerrainSaves().forAll(ts => {
                    matchingTerrainSaves.push(ts)
                })
            } else {
                getUdgTerrainSaves().forAll(ts => {
                    if (ts.getLevel() === filterLevel) {
                        matchingTerrainSaves.push(ts)
                    }
                })
            }
            matchingTerrainSaves.sort((a, b) => compareTerrainSavesForDisplay(a, b))

            const lines = matchingTerrainSaves.map(ts => formatTerrainSaveSummaryLine(ts))

            const pag = handlePagination(lines, pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(escaper.getPlayer(), 'no terrain save found')
            } else {
                Text.P_timed(
                    escaper.getPlayer(),
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Terrain Saves (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(escaper.getPlayer(), Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
            return true
        },
    })

    //-updateTerrainSave(uts) <label> [all|rect]
    registerCommand({
        name: 'updateTerrainSave',
        alias: ['uts'],
        group,
        argDescription: '<label> [all|rect]',
        description:
            'Re-captures the terrain data for <label>. With "rect", redraws the zone first; otherwise re-captures in place',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return USAGE
            }

            if (nbParam === 2 && param2 !== 'all' && param2 !== 'rect') {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            if (param2 === 'rect') {
                const make = escaper.makeUpdateTerrainSaveZone(terrainSave)
                if (make) {
                    Text.mkP(escaper.getPlayer(), make.getMakingMessage())
                } else {
                    Text.erP(escaper.getPlayer(), 'failed to initiate the update of the terrain save')
                }
                return true
            }

            terrainSave.captureTerrain()
            Text.mkP(escaper.getPlayer(), `terrain save "${terrainSave.getLabel()}" updated`)
            return true
        },
    })

    //-deleteTerrainSave(delts) <label>
    registerCommand({
        name: 'deleteTerrainSave',
        alias: ['delts'],
        group,
        argDescription: '<label>',
        description: 'Deletes a terrain save and its associated events',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            getUdgTerrainSaves().remove(terrainSave)
            Text.mkP(escaper.getPlayer(), 'terrain save deleted')
            return true
        },
    })

    //-setTerrainSaveLevel(settsl) <label> <levelNum>|global|g|current|c
    registerCommand({
        name: 'setTerrainSaveLevel',
        alias: ['settsl'],
        group,
        argDescription: '<label> <levelNum>|global|g|current|c',
        description: 'Moves a terrain save to another level, or to/from global',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            let newLevel: Level | null
            if (param2 === 'global' || param2 === 'g') {
                newLevel = null
            } else if (param2 === 'current' || param2 === 'c') {
                newLevel = escaper.getMakingLevel()
            } else if (IsPositiveInteger(param2)) {
                const level = getUdgLevels().get(S2I(param2))
                if (level === null) {
                    Text.erP(escaper.getPlayer(), 'unknown level')
                    return true
                }
                newLevel = level
            } else {
                return USAGE
            }

            if (terrainSave.setLevel(newLevel)) {
                if (newLevel === null) {
                    Text.mkP(escaper.getPlayer(), 'terrain save scope changed to global')
                } else {
                    Text.mkP(escaper.getPlayer(), 'terrain save scope changed to level ' + newLevel.id)
                }
            } else {
                Text.erP(escaper.getPlayer(), 'this label is already used for this level/global scope')
            }
            return true
        },
    })

    //-renameTerrainSave(rents) <label> <newLabel>
    registerCommand({
        name: 'renameTerrainSave',
        alias: ['rents'],
        group,
        argDescription: '<label> <newLabel>',
        description: 'Renames a terrain save',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            const newLabel = param2
            if (!isNewTerrainSaveLabelValid(newLabel)) {
                Text.erP(escaper.getPlayer(), 'terrain save label cannot start with a digit or with "-"')
                return true
            }

            if (terrainSave.setLabel(newLabel)) {
                Text.mkP(escaper.getPlayer(), `terrain save renamed to "${newLabel}"`)
            } else {
                Text.erP(escaper.getPlayer(), 'this label is already used for this level/global scope')
            }
            return true
        },
    })

    //-createTerrainSaveEvent(crtse) <terrainSaveLabel> apply|a|unapply|u lvlStart|lvlEnd|mob [delay=<seconds>] [period=<seconds>|<time1>-<time2>] [duration=<seconds>] [onLvlEnd=apply|unapply|stop]
    registerCommand({
        name: 'createTerrainSaveEvent',
        alias: ['crtse'],
        group,
        argDescription:
            '<terrainSaveLabel> apply|a|unapply|u lvlStart|lvlEnd|mob [delay=<seconds>] [period=<seconds>|<time1>-<time2>] [duration=<seconds>] [onLvlEnd=apply|unapply|stop]',
        description:
            'Creates an event that automatically applies/unapplies a terrain save. For lvlStart/lvlEnd, the level used is the terrain save\'s own level if it has one, or your current level. For "mob", click on a monster to target it. Period toggles apply/unapply repeatedly: <time1>-<time2> toggles asymmetrically (period=N means "N/2-N/2"). Duration auto-reverts the action that many seconds after it fires. onLvlEnd runs when the level ends: "apply/unapply" forces that action, "stop" just cancels the event leaving the terrain as is.',
        cb: ({ nbParam, param1, param2, param3, param4, param5, param6, param7 }, escaper) => {
            if (nbParam < 3 || nbParam > 7) {
                return USAGE
            }

            const terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
            if (terrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            let action: TerrainSaveEventAction
            if (param2 === 'apply' || param2 === 'a') {
                action = 'apply'
            } else if (param2 === 'unapply' || param2 === 'u') {
                action = 'unapply'
            } else {
                return USAGE
            }

            let kind: 'levelStart' | 'levelEnd' | 'monsterTouch'
            if (param3.toLowerCase() === 'lvlstart') {
                kind = 'levelStart'
            } else if (param3.toLowerCase() === 'lvlend') {
                kind = 'levelEnd'
            } else if (param3.toLowerCase() === 'mob') {
                kind = 'monsterTouch'
            } else {
                return USAGE
            }

            let delay: number | undefined
            let periodic: TerrainSaveEventPeriodicInterval | undefined
            let duration: number | undefined
            let onLvlEnd: TerrainSaveEventOnLvlEnd | undefined
            for (const rawParam of [param4, param5, param6, param7]) {
                if (rawParam === '') {
                    continue
                }

                const parsed = parseKeyValueParam(rawParam)
                if (parsed === null) {
                    return USAGE
                }

                if (parsed.key.toLowerCase() === 'onlvlend') {
                    const value = parsed.value.toLowerCase()
                    if (value !== 'apply' && value !== 'unapply' && value !== 'stop') {
                        return USAGE
                    }
                    if (terrainSave.getLevel() === null && kind !== 'levelStart' && kind !== 'levelEnd') {
                        Text.erP(
                            escaper.getPlayer(),
                            'onLvlEnd requires the terrain save to be level-scoped or the event to trigger on some level start or end'
                        )
                        return true
                    }
                    onLvlEnd = value
                    continue
                }

                if (parsed.key === 'period') {
                    const parsedPeriod = parsePeriodicIntervalValue(parsed.value)
                    if (parsedPeriod === null) {
                        return USAGE
                    }
                    periodic = parsedPeriod
                    continue
                }

                const value = S2R(parsed.value)
                if (value <= 0) {
                    return USAGE
                }

                if (parsed.key === 'delay') {
                    delay = value
                } else if (parsed.key === 'duration') {
                    duration = value
                } else {
                    return USAGE
                }
            }

            if (kind === 'monsterTouch') {
                const make = escaper.makeSelectMonsterForEvent(monsterId => {
                    const condition: TerrainSaveEventCondition = { kind, monsterId }
                    const event = terrainSave.addEvent(condition, action, delay, periodic, duration, onLvlEnd)
                    Text.mkP(escaper.getPlayer(), `terrain save event #${event.getId()} created`)
                })

                if (make) {
                    Text.mkP(escaper.getPlayer(), make.getMakingMessage())
                } else {
                    Text.erP(escaper.getPlayer(), 'failed to initiate the creation of the terrain save event')
                }
                return true
            }

            const levelNum = terrainSave.getLevel()?.id ?? escaper.getMakingLevel().id
            const condition: TerrainSaveEventCondition = { kind, levelNum }

            const event = terrainSave.addEvent(condition, action, delay, periodic, duration, onLvlEnd)
            Text.mkP(escaper.getPlayer(), `terrain save event #${event.getId()} created`)
            return true
        },
    })

    //-removeTerrainSaveEvent(remtse) <eventId>
    registerCommand({
        name: 'removeTerrainSaveEvent',
        alias: ['remtse'],
        group,
        argDescription: '<eventId>',
        description: 'Removes a terrain save event',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1 || !IsPositiveInteger(param1)) {
                return USAGE
            }

            const event = getUdgTerrainSaves().findEventById(S2I(param1))
            if (event === null) {
                Text.erP(escaper.getPlayer(), "this terrain save event doesn't exist")
                return true
            }

            event.terrainSave.removeEvent(event.getId())
            Text.mkP(escaper.getPlayer(), 'terrain save event deleted')
            return true
        },
    })

    //-changeEventTerrainSave(cets) <eventId> <newTerrainSaveLabel>
    registerCommand({
        name: 'changeEventTerrainSave',
        alias: ['cets'],
        group,
        argDescription: '<eventId> <newTerrainSaveLabel>',
        description: 'Moves a terrain save event to a different terrain save',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2 || !IsPositiveInteger(param1)) {
                return USAGE
            }

            const event = getUdgTerrainSaves().findEventById(S2I(param1))
            if (event === null) {
                Text.erP(escaper.getPlayer(), "this terrain save event doesn't exist")
                return true
            }

            const newTerrainSave = getUdgTerrainSaves().resolveLabel(param2, escaper.getMakingLevel())
            if (newTerrainSave === null) {
                Text.erP(escaper.getPlayer(), "this terrain save doesn't exist, or at least not on your current level")
                return true
            }

            const oldTerrainSave = event.terrainSave
            oldTerrainSave.getEvents().removeWithoutDestroy(event.getId())
            event.terrainSave = newTerrainSave
            newTerrainSave.getEvents().adopt(event)

            Text.mkP(
                escaper.getPlayer(),
                `terrain save event #${event.getId()} moved to "${newTerrainSave.getLabel()}"`
            )
            return true
        },
    })

    //-editTerrainSaveEvent(etse) <eventId> action|delay|period|duration|onLvlEnd|lvl|mob|enable|disable [<value>]
    registerCommand({
        name: 'editTerrainSaveEvent',
        alias: ['etse'],
        group,
        argDescription: '<eventId> action|delay|period|duration|onLvlEnd|lvl|mob|enable|disable [<value>]',
        description:
            'Edits a terrain save event. action: apply|a|unapply|u. delay/duration: <seconds>|none. period: <seconds>|<time1>-<time2>|none (see createTerrainSaveEvent for the asymmetric <time1>-<time2> semantics). onLvlEnd: apply|unapply|stop|none (requires the terrain save to be level-scoped or the event to trigger on some level start or end; stop just cancels any running delay/period timer). lvl (levelStart/levelEnd events only): <levelNum>|current|c. mob (monsterTouch events only): click on a hand-placed monster to retarget, no value typed. enable/disable: no value typed - disable freezes the event (cancels any running delay/period/duration timer without applying/unapplying), enable just resumes listening for the next trigger',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam < 2 || nbParam > 3 || !IsPositiveInteger(param1)) {
                return USAGE
            }

            const event = getUdgTerrainSaves().findEventById(S2I(param1))
            if (event === null) {
                Text.erP(escaper.getPlayer(), "this terrain save event doesn't exist")
                return true
            }

            const field = param2

            if (field === 'enable') {
                event.enable()
                Text.mkP(escaper.getPlayer(), `terrain save event #${event.getId()} enabled`)
                return true
            }

            if (field === 'disable') {
                event.disable()
                Text.mkP(escaper.getPlayer(), `terrain save event #${event.getId()} disabled`)
                return true
            }

            if (field === 'mob') {
                if (event.condition.kind !== 'monsterTouch') {
                    Text.erP(escaper.getPlayer(), 'the "target" field only applies to monsterTouch events')
                    return true
                }

                const make = escaper.makeSelectMonsterForEvent(monsterId => {
                    event.condition = { kind: 'monsterTouch', monsterId }
                    Text.mkP(escaper.getPlayer(), `terrain save event #${event.getId()} retargeted`)
                })

                if (make) {
                    Text.mkP(escaper.getPlayer(), make.getMakingMessage())
                } else {
                    Text.erP(escaper.getPlayer(), 'failed to initiate the retargeting of the terrain save event')
                }
                return true
            }

            if (nbParam !== 3) {
                return USAGE
            }

            if (field === 'action') {
                if (param3 === 'apply' || param3 === 'a') {
                    event.action = 'apply'
                } else if (param3 === 'unapply' || param3 === 'u') {
                    event.action = 'unapply'
                } else {
                    return USAGE
                }
            } else if (field === 'delay' || field === 'duration') {
                let value: number | undefined
                if (param3 !== 'none') {
                    value = S2R(param3)
                    if (value <= 0) {
                        return USAGE
                    }
                }

                event.unregister()
                if (field === 'delay') {
                    event.delay = value
                } else {
                    event.duration = value
                }
                event.register()
            } else if (field === 'period') {
                let value: TerrainSaveEventPeriodicInterval | undefined
                if (param3 !== 'none') {
                    const parsedPeriod = parsePeriodicIntervalValue(param3)
                    if (parsedPeriod === null) {
                        return USAGE
                    }
                    value = parsedPeriod
                }

                event.unregister()
                event.periodicInterval = value
                event.register()
            } else if (field.toLowerCase() === 'onlvlend') {
                let value: TerrainSaveEventOnLvlEnd | undefined
                if (param3 !== 'none') {
                    const lower = param3.toLowerCase()
                    if (lower !== 'apply' && lower !== 'unapply' && lower !== 'stop') {
                        return USAGE
                    }
                    if (
                        event.terrainSave.getLevel() === null &&
                        event.condition.kind !== 'levelStart' &&
                        event.condition.kind !== 'levelEnd'
                    ) {
                        Text.erP(
                            escaper.getPlayer(),
                            'onLvlEnd requires the terrain save to be level-scoped or the event to trigger on some level start or end'
                        )
                        return true
                    }
                    value = lower
                }

                event.unregister()
                event.onLvlEnd = value
                event.register()
            } else if (field === 'lvl') {
                if (event.condition.kind !== 'levelStart' && event.condition.kind !== 'levelEnd') {
                    Text.erP(escaper.getPlayer(), 'the "lvl" field only applies to levelStart/levelEnd events')
                    return true
                }

                let levelNum: number
                if (param3 === 'current' || param3 === 'c') {
                    levelNum = escaper.getMakingLevel().id
                } else if (IsPositiveInteger(param3) && getUdgLevels().get(S2I(param3)) !== null) {
                    levelNum = S2I(param3)
                } else {
                    Text.erP(escaper.getPlayer(), 'unknown level')
                    return true
                }

                event.unregister()
                event.condition = { kind: event.condition.kind, levelNum }
                event.register()
            } else {
                return USAGE
            }

            Text.mkP(escaper.getPlayer(), `terrain save event ${event.getId()} updated`)
            return true
        },
    })

    //-displayTerrainSaveEvent(dtse) [<terrainSaveLabel>|current|c|lvl<number>|<eventId>] [page]
    registerCommand({
        name: 'displayTerrainSaveEvent',
        alias: ['dtse'],
        group,
        argDescription: '[<terrainSaveLabel>|current|c|lvl<number>|<eventId>] [page]',
        description:
            "Displays terrain save events - an eventId shows details, a label lists that terrainSave's events, lvl<number> lists every event at that level, current/c is shorthand for your current making level, no param lists every event",
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam > 2) {
                return USAGE
            }

            if (nbParam >= 1 && IsPositiveInteger(param1)) {
                if (nbParam > 1) {
                    return USAGE
                }

                const event = getUdgTerrainSaves().findEventById(S2I(param1))
                if (event === null) {
                    Text.erP(escaper.getPlayer(), "this terrain save event doesn't exist")
                    return true
                }

                displayTerrainSaveEventDetail(event, escaper.getPlayer())
                return true
            }

            let terrainSave: TerrainSave | null = null
            let filterLevel: Level | null = null
            if (nbParam >= 1 && param1 !== '') {
                if (param1 === 'current' || param1 === 'c') {
                    filterLevel = escaper.getMakingLevel()
                } else if (param1.toLowerCase().startsWith('lvl') && IsPositiveInteger(param1.substring(3))) {
                    filterLevel = getUdgLevels().get(S2I(param1.substring(3)))
                    if (filterLevel === null) {
                        Text.erP(escaper.getPlayer(), 'unknown level')
                        return true
                    }
                } else {
                    terrainSave = getUdgTerrainSaves().resolveLabel(param1, escaper.getMakingLevel())
                    if (terrainSave === null) {
                        Text.erP(
                            escaper.getPlayer(),
                            "this terrain save doesn't exist, or at least not on your current level"
                        )
                        return true
                    }
                }
            }

            if (nbParam === 2 && !IsPositiveInteger(param2)) {
                return USAGE
            }
            const pageNum = nbParam === 2 ? S2I(param2) : 1

            const matchingEvents: TerrainSaveEvent[] = []
            const withOwnerLabel = terrainSave === null
            if (terrainSave !== null) {
                terrainSave.getEvents().forAll(event => {
                    matchingEvents.push(event)
                })
            } else if (filterLevel !== null) {
                getUdgTerrainSaves().forAll(ts => {
                    if (ts.getLevel() === filterLevel) {
                        ts.getEvents().forAll(event => {
                            matchingEvents.push(event)
                        })
                    }
                })
            } else {
                getUdgTerrainSaves().forAll(ts => {
                    ts.getEvents().forAll(event => {
                        matchingEvents.push(event)
                    })
                })
            }
            matchingEvents.sort((a, b) => compareTerrainSaveEventsForDisplay(a, b))

            const lines = matchingEvents.map(event => formatTerrainSaveEventSummaryLine(event, withOwnerLabel))

            const pag = handlePagination(lines, pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(escaper.getPlayer(), 'no terrain save event found')
            } else {
                Text.P_timed(
                    escaper.getPlayer(),
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Terrain Save Events (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(escaper.getPlayer(), Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
            return true
        },
    })
}
