import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { MakeTerrainHeightAction } from '../MakeLastActions/MakeTerrainHeightAction'

export class MakeTerrainHeight extends Make {
    private radius: number
    private height: number

    constructor(maker: unit, radius: number, height: number) {
        super(maker, 'terrainHeight', false)

        this.radius = radius
        this.height = height
    }

    getRadius = (): number => {
        return this.radius
    }

    getHeight = (): number => {
        return this.height
    }

    doActions = () => {
        if (super.doBaseActions()) {
            this.escaper.newAction(
                new MakeTerrainHeightAction(this.getRadius(), this.getHeight(), this.orderX, this.orderY)
            )
        }
    }
}
