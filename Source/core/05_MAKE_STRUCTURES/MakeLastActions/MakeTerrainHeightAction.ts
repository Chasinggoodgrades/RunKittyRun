import { Text } from '../../01_libraries/Text'
import { MakeAction } from './MakeAction'

export class MakeTerrainHeightAction extends MakeAction {
    private radius: number
    private height: number
    private x: number
    private y: number
    private terrainDeform?: terraindeformation

    constructor(radius: number, height: number, x: number, y: number) {
        super()

        this.radius = radius
        this.height = height
        this.x = x
        this.y = y
        this.apply()
        this.isActionMadeB = true
    }

    apply = () => {
        this.terrainDeform = TerrainDeformCrater(this.x, this.y, this.radius, -this.height, 0, true)
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }

        this.terrainDeform && TerrainDeformStop(this.terrainDeform, 0)
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain height cancelled')

        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }

        this.apply()
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain height redone')

        return true
    }

    destroy = () => {
        //nothing needed
    }
}
