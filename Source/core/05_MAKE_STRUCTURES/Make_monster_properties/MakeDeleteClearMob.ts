import { Text } from '../../01_libraries/Text'
import { ClearMob } from '../../04_STRUCTURES/Monster_properties/ClearMob'
import { Make } from '../Make/Make'

export class MakeDeleteClearMob extends Make {
    constructor(maker: unit) {
        super(maker, 'deleteClearMob')
    }

    clickMade = (clearMob: ClearMob) => {
        clearMob.destroy()
        Text.mkP(this.makerOwner, 'clear mob removed')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //recherche du monsterOrCaster cliqué
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
            const clearMob = monster?.getClearMob()
            if (clearMob) {
                this.clickMade(clearMob)
            } else {
                Text.erP(this.makerOwner, 'no clear mob clicked for your making level')
            }
        }
    }
}
