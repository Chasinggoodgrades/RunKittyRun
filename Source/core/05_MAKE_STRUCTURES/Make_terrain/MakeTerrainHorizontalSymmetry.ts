import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { MakeTerrainHorizontalSymmetryAction } from '../MakeLastActions/MakeTerrainHorizontalSymmetryAction'
import { Text } from '../../01_libraries/Text'

export class MakeTerrainHorizontalSymmetry extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit) {
        super(maker, 'terrainHorizontalSymmetry', '', [''], false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.isLastLocSavedUsed()) {
                try {
                    const action = new MakeTerrainHorizontalSymmetryAction(
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
