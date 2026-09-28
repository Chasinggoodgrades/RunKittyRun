import { EstChiffre } from 'core/01_libraries/Functions_on_numbers'
import { errorHandler } from 'Utils/mapUtils'
import { getUdgLevels } from '../../../../globals'
import { Text } from '../../01_libraries/Text'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import { HorizontalRectangleRegion } from '../Region/HorizontalRectangleRegion'
import { TerrainSave } from './TerrainSave'
import type { TerrainSaveEvent } from './TerrainSaveEvent'

export class TerrainSaveArray extends BaseArray<TerrainSave> {
    constructor() {
        super(true)
    }

    getByLabelAndLevel = (label: string, level: Level | null): TerrainSave | null => {
        for (const [_, terrainSave] of pairs(this.data)) {
            if (terrainSave.getLabel() === label && terrainSave.getLevel() === level) {
                return terrainSave
            }
        }

        return null
    }

    existsAnywhereByLabel = (label: string, excluding: TerrainSave | null = null): boolean => {
        for (const [_, terrainSave] of pairs(this.data)) {
            if (terrainSave !== excluding && terrainSave.getLabel() === label) {
                return true
            }
        }

        return false
    }

    // Whether `label` could be (re)assigned to `targetLevel` (null = global) without violating:
    //  - the (label, level) uniqueness rule
    //  - the "a label can't be both global and level-scoped at once" exclusivity rule
    // `excluding` should be the TerrainSave being created/moved itself, so it doesn't conflict with its own current entry.
    canAssignLevel = (label: string, targetLevel: Level | null, excluding: TerrainSave | null = null): boolean => {
        if (targetLevel === null) {
            return !this.existsAnywhereByLabel(label, excluding)
        }

        const existingGlobal = this.getByLabelAndLevel(label, null)
        if (existingGlobal !== null && existingGlobal !== excluding) {
            return false
        }

        const existingAtLevel = this.getByLabelAndLevel(label, targetLevel)
        if (existingAtLevel !== null && existingAtLevel !== excluding) {
            return false
        }

        return true
    }

    // Parses an optional "x-" level-number prefix (x = digits) the same way `IsInteger`/`EstChiffre`
    // scan strings elsewhere in this codebase (0-indexed `SubString`, not the 1-indexed `SubStringBJ`).
    resolveLabel = (rawLabel: string, currentLevel: Level | null): TerrainSave | null => {
        const length = StringLength(rawLabel)
        let i = 0
        while (i < length && EstChiffre(SubString(rawLabel, i, i + 1) ?? '')) {
            i++
        }

        if (i > 0 && i < length && SubString(rawLabel, i, i + 1) === '-') {
            const levelNum = S2I(SubString(rawLabel, 0, i) ?? '')
            const label = SubString(rawLabel, i + 1, length) ?? ''
            const level = getUdgLevels().get(levelNum)
            return level !== null ? this.getByLabelAndLevel(label, level) : null
        }

        return this.getByLabelAndLevel(rawLabel, null) ?? this.getByLabelAndLevel(rawLabel, currentLevel)
    }

    // Global scan across every owned TerrainSaveEventArray - events are id-addressed independently of which
    // TerrainSave owns them (removeTerrainSaveEvent/changeEventTerrainSave/editTerrainSaveEvent/displayTerrainSaveEvent).
    findEventById = (eventId: number): TerrainSaveEvent | null => {
        for (const [_, terrainSave] of pairs(this.data)) {
            const event = terrainSave.getEvents().get(eventId)
            if (event !== null) {
                return event
            }
        }

        return null
    }

    // Global scan for every monsterTouch event targeting a given monster - used by onEscaperTouchingMonster.
    // A linear scan is fine here: total terrain saves/events on a map is small, unlike per-frame hot loops.
    findMonsterTouchEventsByMonsterId = (monsterId: number): TerrainSaveEvent[] => {
        const result: TerrainSaveEvent[] = []

        for (const [_, terrainSave] of pairs(this.data)) {
            terrainSave.getEvents().forAll(event => {
                if (event.condition.kind === 'monsterTouch' && event.condition.monsterId === monsterId) {
                    result.push(event)
                }
            })
        }

        return result
    }

    // Removes a TerrainSave by object reference (BaseArray only exposes destroyOne(id), and this array
    // doesn't track ids on the instances themselves - manageIds=true just uses an internal counter as key).
    remove = (terrainSave: TerrainSave): boolean => {
        for (const [id, ts] of pairs(this.data)) {
            if (ts === terrainSave) {
                ts.destroy()
                delete this.data[id]
                return true
            }
        }

        return false
    }

    new = (label: string, level: Level | null, zone: HorizontalRectangleRegion | null): TerrainSave => {
        if (!this.canAssignLevel(label, level)) {
            throw `TerrainSave: label "${label}" already used for this level/global scope`
        }

        const terrainSave = new TerrainSave(label, level, zone)
        this._new(terrainSave)

        return terrainSave
    }

    newFromJson = (terrainSavesJson: { [x: string]: any }[]) => {
        for (const terrainSaveJson of terrainSavesJson) {
            let terrainSave: TerrainSave | undefined = undefined

            errorHandler(
                () => {
                    const level = terrainSaveJson.level !== null ? getUdgLevels().get(terrainSaveJson.level) : null

                    let zone: HorizontalRectangleRegion | null = null
                    if (terrainSaveJson.zone !== null && terrainSaveJson.zone !== undefined) {
                        const z = terrainSaveJson.zone
                        zone = new HorizontalRectangleRegion(z.x1, z.y1, z.x2, z.y2, z.direction)
                    }

                    terrainSave = this.new(terrainSaveJson.label, level, zone)

                    terrainSave.loadCapturedTerrainFromJson(
                        terrainSaveJson.originX,
                        terrainSaveJson.originY,
                        terrainSaveJson.width,
                        terrainSaveJson.height,
                        terrainSaveJson.capturedTerrain
                    )

                    if (terrainSaveJson.events) {
                        terrainSave.loadEventsFromJson(terrainSaveJson.events)
                    }
                },
                e => {
                    // roll back a partially-created entry so we don't leave a TerrainSave with no captured data
                    if (terrainSave !== undefined) {
                        this.remove(terrainSave)
                        terrainSave = undefined
                    }
                    Text.erA(
                        `TerrainSave "${terrainSaveJson.label}" failed to load: ${typeof e === 'string' ? e : e?.message}`
                    )
                }
            )()
        }
    }
}
