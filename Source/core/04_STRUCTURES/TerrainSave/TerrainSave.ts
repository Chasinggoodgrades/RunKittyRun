import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { getUdgTerrainSaves, getUdgTerrainTypes, globals } from '../../../../globals'
import { Ascii2String } from '../../01_libraries/Ascii'
import { ChangeTerrainType } from '../../07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { TerrainTypeMax } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_max'
import type { Level } from '../Level/Level'
import { HorizontalRectangleRegion } from '../Region/HorizontalRectangleRegion'
import type { TerrainType } from '../TerrainType/TerrainType'
import type {
    TerrainSaveEvent,
    TerrainSaveEventAction,
    TerrainSaveEventCondition,
    TerrainSaveEventOnLvlEnd,
    TerrainSaveEventPeriodicInterval,
} from './TerrainSaveEvent'
import { TerrainSaveEventArray } from './TerrainSaveEventArray'

type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

export class TerrainSave {
    private label: string
    private level: Level | null
    private zone: HorizontalRectangleRegion | null

    private capturedTerrain: TerrainType[] = []
    private originX = 0
    private originY = 0
    private width = 0
    private height = 0

    private previousTerrain: TerrainType[] | null = null
    private applied = false

    private events: TerrainSaveEventArray = new TerrainSaveEventArray()

    constructor(label: string, level: Level | null, zone: HorizontalRectangleRegion | null) {
        this.label = label
        this.level = level
        this.zone = zone
    }

    getLabel = (): string => this.label
    // false if newLabel is already used at this TerrainSave's own (label, level) scope by a different save.
    setLabel = (newLabel: string): boolean => {
        if (!getUdgTerrainSaves().canAssignLevel(newLabel, this.level, this)) {
            return false
        }

        this.label = newLabel
        return true
    }

    getLevel = (): Level | null => this.level
    setLevel = (newLevel: Level | null): boolean => {
        if (!getUdgTerrainSaves().canAssignLevel(this.label, newLevel, this)) {
            return false
        }

        this.level = newLevel
        return true
    }

    getZone = (): HorizontalRectangleRegion | null => this.zone

    // Only swaps the reference - does not destroy the old zone. Callers that redraw a zone (updateTerrainSave)
    // need to keep the old one alive until captureTerrain() over the new one succeeds, so they can revert
    // (setZone back to it) without a dangling reference if the capture fails.
    setZone = (newZone: HorizontalRectangleRegion | null) => {
        this.zone = newZone
    }

    isWholeMap = (): boolean => this.zone === null

    isApplied = (): boolean => this.applied

    getEvents = (): TerrainSaveEventArray => this.events

    addEvent = (
        condition: TerrainSaveEventCondition,
        action: TerrainSaveEventAction,
        delay?: number,
        periodicInterval?: TerrainSaveEventPeriodicInterval,
        duration?: number,
        onLvlEnd?: TerrainSaveEventOnLvlEnd
    ): TerrainSaveEvent => this.events.new(this, condition, action, delay, periodicInterval, duration, onLvlEnd)

    removeEvent = (eventId: number): boolean => this.events.destroyOne(eventId)

    private getBounds(): Bounds {
        if (this.zone) {
            // The zone's own minX/maxX/minY/maxY are true tile edges (see MakeTerrainSaveZoneBase), so
            // they always exactly edge the tiles they cover - but the capture loop below (like every other
            // tile-grid sample point in this codebase, e.g. MAP_MIN_X/MAP_MAX_X below) expects tile
            // *centers*. Shift each edge inward by half a tile to get back to that convention.
            const half = Constants.LARGEUR_CASE / 2
            return {
                minX: this.zone.getMinX() + half,
                maxX: this.zone.getMaxX() - half,
                minY: this.zone.getMinY() + half,
                maxY: this.zone.getMaxY() - half,
            }
        }

        return {
            minX: globals.MAP_MIN_X,
            maxX: globals.MAP_MAX_X,
            minY: globals.MAP_MIN_Y,
            maxY: globals.MAP_MAX_Y,
        }
    }

    // Walks the already-captured (originX, originY, width, height) grid - not the live zone/whole-map bounds,
    // so it stays valid for apply()/unapply() even if the zone was destroyed/changed since capture.
    private forEachTile(cb: (x: number, y: number, index: number) => void) {
        let index = 0
        for (let row = 0; row < this.height; row++) {
            const y = this.originY + row * Constants.LARGEUR_CASE
            for (let col = 0; col < this.width; col++) {
                const x = this.originX + col * Constants.LARGEUR_CASE
                cb(x, y, index)
                index++
            }
        }
    }

    captureTerrain = () => {
        const bounds = this.getBounds()

        const newOriginX = bounds.minX
        const newOriginY = bounds.minY
        const newWidth = Math.floor((bounds.maxX - bounds.minX) / Constants.LARGEUR_CASE) + 1
        const newHeight = Math.floor((bounds.maxY - bounds.minY) / Constants.LARGEUR_CASE) + 1

        const newCapturedTerrain: TerrainType[] = []

        let index = 0
        for (let row = 0; row < newHeight; row++) {
            const y = newOriginY + row * Constants.LARGEUR_CASE
            for (let col = 0; col < newWidth; col++) {
                const x = newOriginX + col * Constants.LARGEUR_CASE

                const terrainType = getUdgTerrainTypes().getTerrainType(x, y)
                if (terrainType === null) {
                    throw `TerrainSave: captureTerrain: no TerrainType found at (${x}, ${y})`
                }

                newCapturedTerrain[index] = terrainType
                index++
            }
        }

        this.originX = newOriginX
        this.originY = newOriginY
        this.width = newWidth
        this.height = newHeight
        this.capturedTerrain = newCapturedTerrain
    }

    apply = (): boolean => {
        if (!this.applied) {
            const newPreviousTerrain: TerrainType[] = []
            this.forEachTile((x, y, index) => {
                const terrainType = getUdgTerrainTypes().getTerrainType(x, y)
                if (terrainType !== null) {
                    newPreviousTerrain[index] = terrainType
                }
            })
            this.previousTerrain = newPreviousTerrain
        }

        this.forEachTile((x, y, index) => {
            const terrainType = this.capturedTerrain[index]
            if (terrainType !== undefined) {
                ChangeTerrainType(x, y, terrainType.getTerrainTypeId())
            }
        })

        this.applied = true
        return true
    }

    unapply = (): boolean => {
        if (!this.applied || !this.previousTerrain) {
            return false
        }

        const previousTerrain = this.previousTerrain
        this.forEachTile((x, y, index) => {
            const terrainType = previousTerrain[index]
            if (terrainType !== undefined) {
                ChangeTerrainType(x, y, terrainType.getTerrainTypeId())
            }
        })

        this.applied = false
        this.previousTerrain = null
        return true
    }

    // Used by TerrainSaveArray.newFromJson to restore a saved grid without reading live terrain.
    // terrainTypeIds are ASCII-string encoded (e.g. "Nsnw"), matching TerrainType.toJson()'s own convention -
    // going through TerrainTypeMax's tables here (like TerrainTypeArray.newFromJson does), not a raw numeric
    // id, since raw ids aren't guaranteed stable across a terrain-type catalog reload (see toJson() below).
    loadCapturedTerrainFromJson = (
        originX: number,
        originY: number,
        width: number,
        height: number,
        terrainTypeIds: string[]
    ) => {
        const newCapturedTerrain: TerrainType[] = []

        for (let i = 0; i < terrainTypeIds.length; i++) {
            const terrainTypeId = TerrainTypeMax.TerrainTypeAsciiString2TerrainTypeId(terrainTypeIds[i])
            const terrainType = getUdgTerrainTypes().getByTerrainTypeId(terrainTypeId)
            if (terrainType === null) {
                throw `TerrainSave: loadCapturedTerrainFromJson: unknown terrainTypeId "${terrainTypeIds[i]}"`
            }
            newCapturedTerrain[i] = terrainType
        }

        this.originX = originX
        this.originY = originY
        this.width = width
        this.height = height
        this.capturedTerrain = newCapturedTerrain
    }

    // Used by TerrainSaveArray.newFromJson - registers each reconstructed event (re-hooks level conditions).
    loadEventsFromJson = (eventsJson: { [x: string]: any }[]) => {
        this.events.newFromJson(this, eventsJson)
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output.label = this.label
        output.level = this.level ? this.level.id : null
        output.zone = this.zone ? this.zone.toJson() : null

        output.originX = this.originX
        output.originY = this.originY
        output.width = this.width
        output.height = this.height

        const terrainTypeIds: string[] = []
        for (let i = 0; i < this.capturedTerrain.length; i++) {
            terrainTypeIds[i] = Ascii2String(this.capturedTerrain[i].getTerrainTypeId())
        }
        output.capturedTerrain = terrainTypeIds
        output.events = this.events.toJson()

        return output
    }

    destroy = () => {
        this.zone?.destroy()
        this.events.destroy()
    }
}
