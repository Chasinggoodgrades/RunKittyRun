import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { getUdgTerrainTypes } from '../../../../globals'
import { ExchangeTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Exchange_terrains'

export class MakeExchangeTerrains extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit) {
        super(maker, 'exchangeTerrains', '', [''], false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.isLastLocSavedUsed()) {
                const terrainTypeA = getUdgTerrainTypes().getTerrainType(this.lastX, this.lastY)
                const terrainTypeB = getUdgTerrainTypes().getTerrainType(this.orderX, this.orderY)
                terrainTypeA && terrainTypeB && ExchangeTerrains(terrainTypeA.label, terrainTypeB.label)
                this.unsaveLocDefinitely()
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
