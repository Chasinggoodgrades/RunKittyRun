import { TerrainType } from '../../04_STRUCTURES/TerrainType/TerrainType'
import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { MakeAction } from '../MakeLastActions/MakeAction'
import { Text } from '../../01_libraries/Text'
import { MakeTerrainCreateAction } from '../MakeLastActions/MakeTerrainCreateAction'

export class MakeTerrainCreate extends MakeOneByOneOrTwoClicks {
    private terrainType: TerrainType

    constructor(maker: unit, terrainType: TerrainType) {
        super(maker, 'terrainCreate', '', [''], false)
        this.terrainType = terrainType
    }

    getTerrainType = (): TerrainType => {
        return this.terrainType
    }

    doActions = () => {
        if (super.doBaseActions()) {
            let action: MakeAction

            if (this.isLastLocSavedUsed()) {
                try {
                    action = new MakeTerrainCreateAction(
                        this.getTerrainType(),
                        this.lastX,
                        this.lastY,
                        this.orderX,
                        this.orderY
                    )
                    this.escaper.newAction(action)
                    this.unsaveLocDefinitely()
                } catch (error) {
                    if (typeof error == 'string') {
                        Text.erP(this.escaper.getPlayer(), error)
                    }
                }
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
