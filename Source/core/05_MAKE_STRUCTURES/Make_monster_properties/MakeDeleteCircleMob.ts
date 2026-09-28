import { CircleMob } from 'core/04_STRUCTURES/Monster_properties/CircleMob'
import { Text } from '../../01_libraries/Text'
import { Make } from '../Make/Make'

export class MakeDeleteCircleMob extends Make {
    constructor(maker: unit) {
        super(maker, 'deleteCircleMob')
    }

    clickMade = (circleMob: CircleMob) => {
        circleMob.destroy()
        Text.mkP(this.makerOwner, 'circle mob removed')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
            const circleMob = monster?.getCircleMobs()

            if (circleMob) {
                this.clickMade(circleMob)
            } else {
                Text.erP(this.makerOwner, 'no circle mob clicked for your making level')
            }
        }
    }
}
