import { errorHandler } from '../../../Utils/mapUtils'
import { Text } from '../../01_libraries/Text'
import { HorizontalRectangleRegion } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import type { TerrainSave } from '../../04_STRUCTURES/TerrainSave/TerrainSave'
import { MakeTerrainSaveZoneBase } from './MakeTerrainSaveZoneBase'

export class MakeUpdateTerrainSaveZone extends MakeTerrainSaveZoneBase {
    terrainSave: TerrainSave

    constructor(maker: unit, terrainSave: TerrainSave) {
        super(maker)

        this.terrainSave = terrainSave
    }

    protected onZoneDrawn(zone: HorizontalRectangleRegion) {
        const oldZone = this.terrainSave.getZone()
        this.terrainSave.setZone(zone)

        let updated = true

        errorHandler(
            () => {
                this.terrainSave.captureTerrain()
            },
            e => {
                // revert - keep the terrain save consistent with its old, still-valid zone/capture
                updated = false
                this.terrainSave.setZone(oldZone)
                zone.destroy()
                Text.erP(this.makerOwner, typeof e === 'string' ? e : 'failed to update terrain save')
            }
        )()

        if (!updated) {
            this.escaper.destroyMake()
            return
        }

        oldZone?.destroy()

        Text.mkP(this.makerOwner, `terrain save "${this.terrainSave.getLabel()}" zone updated`)
        this.escaper.destroyMake()
    }
}
