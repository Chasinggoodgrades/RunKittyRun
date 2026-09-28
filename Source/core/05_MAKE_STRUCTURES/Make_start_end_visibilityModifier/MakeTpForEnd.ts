import { Text } from '../../01_libraries/Text'
import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'

export class MakeTpForEnd extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit) {
        super(maker, 'TPforEndCreate', '', [''])
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.isLastLocSavedUsed()) {
                this.escaper.getMakingLevel().newTpForEnd(this.lastX, this.lastY, this.orderX, this.orderY)
                Text.mkP(this.makerOwner, 'TP for end made for level ' + I2S(this.escaper.getMakingLevel().getId()))
                this.escaper.destroyMake()
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
