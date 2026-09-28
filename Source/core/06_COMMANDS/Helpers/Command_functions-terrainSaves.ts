import { udg_monsters } from '../../../../globals'
import { createTimer } from '../../../Utils/mapUtils'
import { Constants } from '../../01_libraries/Constants'
import { EstChiffre } from '../../01_libraries/Functions_on_numbers'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import type { TerrainSave } from '../../04_STRUCTURES/TerrainSave/TerrainSave'
import type {
    TerrainSaveEvent,
    TerrainSaveEventCondition,
    TerrainSaveEventPeriodicInterval,
} from '../../04_STRUCTURES/TerrainSave/TerrainSaveEvent'

// For -saveTerrain
export const isNewTerrainSaveLabelValid = (label: string): boolean => {
    if (label.length === 0) {
        return false
    }

    const firstChar = SubString(label, 0, 1) ?? ''
    return !EstChiffre(firstChar) && firstChar !== '-'
}

// Global first, then by level id ascending, then alphabetically by label - used by displayTerrainSave's list view
export const compareTerrainSavesForDisplay = (a: TerrainSave, b: TerrainSave): number => {
    const levelA = a.getLevel()
    const levelB = b.getLevel()

    if (levelA === null && levelB !== null) {
        return -1
    }
    if (levelA !== null && levelB === null) {
        return 1
    }
    if (levelA !== null && levelB !== null && levelA.id !== levelB.id) {
        return levelA.id - levelB.id
    }

    const labelA = a.getLabel()
    const labelB = b.getLabel()
    return labelA < labelB ? -1 : labelA > labelB ? 1 : 0
}

export const formatTerrainSaveSummaryLine = (terrainSave: TerrainSave): string => {
    const level = terrainSave.getLevel()
    const levelText = level === null ? 'global' : `level ${level.id}`
    const zoneText = terrainSave.isWholeMap() ? 'whole map' : 'zone'
    const levelPrefix = level !== null ? udg_colorCode[Constants.PINK] + `${level.id}-` : ''

    return (
        levelPrefix +
        udg_colorCode[Constants.RED] +
        terrainSave.getLabel() +
        udg_colorCode[Constants.GREY] +
        ` (${levelText}, ${zoneText})|r`
    )
}

export const displayTerrainSaveDetail = (terrainSave: TerrainSave, p: player) => {
    const level = terrainSave.getLevel()
    const levelText = level === null ? 'global' : `level ${level.id}`
    const grey = udg_colorCode[Constants.GREY]
    const makeColor = Text.MAKE_TEXT_COLORCODE

    let text = udg_colorCode[Constants.RED] + terrainSave.getLabel() + grey + ` (${levelText})|r\n`

    const zone = terrainSave.getZone()
    text += `${grey}    surface: |r${makeColor}${zone === null ? 'whole map' : `${zone.getSurface()} tiles (${zone.getSurfacePercent()}%)`}|r\n`

    text += `${grey}    applied: |r${makeColor}${terrainSave.isApplied() ? 'yes' : 'no'}|r\n`
    text += `${grey}    events: |r${makeColor}${terrainSave.getEvents().count()}|r`

    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, text)

    if (zone !== null) {
        SetCameraPositionForPlayer(p, zone.getCenterX(), zone.getCenterY())
        zone.debugRects(true, true)
        createTimer(Constants.TERRAIN_DATA_DISPLAY_TIME, false, () => zone.debugRects(false))
    }
}

export const formatTerrainSaveEventConditionText = (condition: TerrainSaveEventCondition): string => {
    switch (condition.kind) {
        case 'levelStart':
        case 'levelEnd':
            return `${condition.kind} (level ${condition.levelNum})`
        case 'monsterTouch': {
            let text = 'monsterTouch'
            const monster = udg_monsters[condition.monsterId]
            if (monster?.getMonsterType()) {
                text += ` (${monster.getMonsterType()?.getLabel()})`
            } else if (!monster) {
                text += udg_colorCode[Constants.ORANGE] + ' [target monster no longer exists]|r'
            }
            return text
        }
    }
}

// For createTerrainSaveEvent/editTerrainSaveEvent's period=/period field. Either a plain "<seconds>", or
// "<time1>-<time2>" for an asymmetric toggle (see TerrainSaveEventPeriodicInterval) - null on invalid input.
export const parsePeriodicIntervalValue = (value: string): TerrainSaveEventPeriodicInterval | null => {
    const dashIndex = value.indexOf('-')
    if (dashIndex === -1) {
        const seconds = S2R(value)
        return seconds > 0 ? seconds : null
    }

    const time1 = S2R(value.substring(0, dashIndex))
    const time2 = S2R(value.substring(dashIndex + 1))
    if (time1 <= 0 || time2 <= 0) {
        return null
    }
    return { time1, time2 }
}

const formatPeriodicIntervalValue = (periodicInterval: TerrainSaveEventPeriodicInterval): string =>
    typeof periodicInterval === 'number'
        ? `${periodicInterval}s`
        : `${periodicInterval.time1}s-${periodicInterval.time2}s`

const formatTerrainSaveEventTimingText = (event: TerrainSaveEvent): string => {
    let text = ''
    if (event.delay !== undefined) {
        text += `, delay ${event.delay}s`
    }
    if (event.periodicInterval !== undefined) {
        text += `, period ${formatPeriodicIntervalValue(event.periodicInterval)}`
    }
    if (event.duration !== undefined) {
        text += `, duration ${event.duration}s`
    }
    if (event.onLvlEnd !== undefined) {
        text += `, onLvlEnd ${event.onLvlEnd}`
    }
    return text
}

// Grouped by owning TerrainSave (same order as displayTerrainSave's list), then by event id descending
// (newest first) within each TerrainSave - used by displayTerrainSaveEvent's list view
export const compareTerrainSaveEventsForDisplay = (a: TerrainSaveEvent, b: TerrainSaveEvent): number => {
    const terrainSaveComparison = compareTerrainSavesForDisplay(a.terrainSave, b.terrainSave)
    if (terrainSaveComparison !== 0) {
        return terrainSaveComparison
    }

    return b.getId() - a.getId()
}

// withOwnerLabel: the "all events in the game" list prefixes each line with its owning TerrainSave's label;
// a per-TerrainSave list doesn't need to repeat it.
export const formatTerrainSaveEventSummaryLine = (event: TerrainSaveEvent, withOwnerLabel: boolean): string => {
    let text = event.isEnabled() ? '' : udg_colorCode[Constants.RED] + 'dis|r '
    text += udg_colorCode[Constants.GREY] + `#${event.getId()}|r `

    if (withOwnerLabel) {
        const level = event.terrainSave.getLevel()
        if (level !== null) {
            text += udg_colorCode[Constants.PINK] + `${level.id}-`
        }
        text += udg_colorCode[Constants.RED] + event.terrainSave.getLabel() + udg_colorCode[Constants.GREY] + ' - |r'
    }

    text += `${event.action} on ${formatTerrainSaveEventConditionText(event.condition)}${formatTerrainSaveEventTimingText(event)}`

    return text
}

export const displayTerrainSaveEventDetail = (event: TerrainSaveEvent, p: player) => {
    const level = event.terrainSave.getLevel()
    const levelPrefix = level !== null ? udg_colorCode[Constants.PINK] + `${level.id}-` : ''
    const grey = udg_colorCode[Constants.GREY]

    const makeColor = Text.MAKE_TEXT_COLORCODE

    const disabledPrefix = event.isEnabled() ? '' : udg_colorCode[Constants.RED] + 'dis|r '
    let text = `${disabledPrefix}Event #${makeColor}${event.getId()}|r\n`
    text += `${grey}    terrain save: |r${levelPrefix}${udg_colorCode[Constants.RED]}${event.terrainSave.getLabel()}|r\n`
    text += `${grey}    condition: |r${makeColor}${formatTerrainSaveEventConditionText(event.condition)}|r\n`
    text += `${grey}    action: |r${makeColor}${event.action}|r\n`
    text += `${grey}    delay: |r${makeColor}${event.delay !== undefined ? event.delay + 's' : 'none'}|r\n`
    text += `${grey}    period: |r${makeColor}${event.periodicInterval !== undefined ? formatPeriodicIntervalValue(event.periodicInterval) : 'none'}|r\n`
    text += `${grey}    duration: |r${makeColor}${event.duration !== undefined ? event.duration + 's' : 'none'}|r\n`
    text += `${grey}    onLvlEnd: |r${makeColor}${event.onLvlEnd ?? 'none'}|r`

    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, text)

    if (event.condition.kind === 'monsterTouch') {
        const monster = udg_monsters[event.condition.monsterId]
        if (monster?.u) {
            SetCameraPositionForPlayer(p, GetUnitX(monster.u), GetUnitY(monster.u))
        }
    }
}
