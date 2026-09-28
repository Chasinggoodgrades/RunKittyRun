import { Text } from '../../01_libraries/Text'
import { PortalMob } from '../../04_STRUCTURES/Monster_properties/PortalMob'
import { Make } from '../Make/Make'

export class MakeDeletePortalMob extends Make {
    constructor(maker: unit) {
        super(maker, 'deletePortalMob')
    }

    clickMade = (portalMob: PortalMob) => {
        portalMob.destroy()
        Text.mkP(this.makerOwner, 'portal mob removed')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //recherche du portalMob cliqué
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
            const portalMob = monster?.getPortalMob()
            if (portalMob) {
                this.clickMade(portalMob)
            } else {
                Text.erP(this.makerOwner, 'no portal mob clicked for your making level')
            }
        }
    }
}
