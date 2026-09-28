import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { Text } from '../../01_libraries/Text'
import { MakeTerrainVerticalSymmetryAction } from '../MakeLastActions/MakeTerrainVerticalSymmetryAction'

export class MakeTerrainVerticalSymmetry extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit) {
        super(maker, 'terrainVerticalSymmetry', '', [''], false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.isLastLocSavedUsed()) {
                try {
                    const action = new MakeTerrainVerticalSymmetryAction(
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
