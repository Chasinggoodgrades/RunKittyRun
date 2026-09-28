import { BaseArray } from '../BaseArray'
import type { TerrainSave } from './TerrainSave'
import {
    TerrainSaveEvent,
    TerrainSaveEventAction,
    TerrainSaveEventCondition,
    TerrainSaveEventOnLvlEnd,
    TerrainSaveEventPeriodicInterval,
} from './TerrainSaveEvent'

// One instance per TerrainSave (owned, not a global collection). manageIds=false since each TerrainSaveEvent
// already owns a globally-unique id (TerrainSaveEvent.getNextId()), same mode as MonsterSpawnArray.
export class TerrainSaveEventArray extends BaseArray<TerrainSaveEvent> {
    constructor() {
        super(false)
    }

    new = (
        terrainSave: TerrainSave,
        condition: TerrainSaveEventCondition,
        action: TerrainSaveEventAction,
        delay?: number,
        periodicInterval?: TerrainSaveEventPeriodicInterval,
        duration?: number,
        onLvlEnd?: TerrainSaveEventOnLvlEnd,
        enabled = true
    ): TerrainSaveEvent => {
        const event = new TerrainSaveEvent(
            terrainSave,
            condition,
            action,
            delay,
            periodicInterval,
            duration,
            onLvlEnd,
            enabled
        )
        this._new(event)
        event.register()

        return event
    }

    newFromJson = (terrainSave: TerrainSave, eventsJson: { [x: string]: any }[]) => {
        for (const eventJson of eventsJson) {
            this.new(
                terrainSave,
                eventJson.condition,
                eventJson.action,
                eventJson.delay,
                eventJson.periodicInterval,
                eventJson.duration,
                eventJson.onLvlEnd,
                eventJson.enabled
            )
        }
    }

    // Used by changeEventTerrainSave to move an event to a different TerrainSave without destroying it (i.e.
    // without unregistering its hooks/timer) - unlike destroyOne(id), which is for actually deleting an event.
    removeWithoutDestroy = (eventId: number): TerrainSaveEvent | null => {
        const event = this.data[eventId]
        if (!event) {
            return null
        }

        delete this.data[eventId]
        return event
    }

    adopt = (event: TerrainSaveEvent) => {
        this.data[event.getId()] = event
    }
}
