import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'

export class MakeGetRegion extends Make {
    constructor(maker: unit) {
        super(maker, 'getRegion', false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const regions = this.escaper.getMakingLevel().regions.getRegionsAt(this.orderX, this.orderY)

            for (const r of regions) {
                r.displayForPlayer(this.escaper.getPlayer())
            }

            regions.__destroy()
        }
    }
}
