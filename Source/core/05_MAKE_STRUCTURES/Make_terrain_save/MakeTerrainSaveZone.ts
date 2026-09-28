import { getUdgTerrainSaves } from '../../../../globals'
import { errorHandler } from '../../../Utils/mapUtils'
import { Text } from '../../01_libraries/Text'
import type { Level } from '../../04_STRUCTURES/Level/Level'
import { HorizontalRectangleRegion } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import type { TerrainSave } from '../../04_STRUCTURES/TerrainSave/TerrainSave'
import { MakeTerrainSaveZoneBase } from './MakeTerrainSaveZoneBase'

export class MakeTerrainSaveZone extends MakeTerrainSaveZoneBase {
    label: string
    level: Level | null

    constructor(maker: unit, label: string, level: Level | null) {
        super(maker)

        this.label = label
        this.level = level
    }

    protected onZoneDrawn(zone: HorizontalRectangleRegion) {
        let terrainSave: TerrainSave | undefined = undefined

        errorHandler(
            () => {
                terrainSave = getUdgTerrainSaves().new(this.label, this.level, zone)
                terrainSave.captureTerrain()
            },
            e => {
                if (terrainSave !== undefined) {
                    getUdgTerrainSaves().remove(terrainSave)
                    terrainSave = undefined
                } else {
                    zone.destroy()
                }
                Text.erP(this.makerOwner, typeof e === 'string' ? e : 'failed to create terrain save')
            }
        )()

        if (terrainSave === undefined) {
            this.escaper.destroyMake()
            return
        }

        Text.mkP(this.makerOwner, `terrain save "${this.label}" created`)
        this.escaper.destroyMake()
    }
}
