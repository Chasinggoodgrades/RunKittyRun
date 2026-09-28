import { Region } from 'core/04_STRUCTURES/Region/Region'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { Text } from '../../01_libraries/Text'

export class MakeRegion extends MakeOneByOneOrTwoClicks {
    label: string

    constructor(maker: unit, label: string) {
        super(maker, 'regionCreate', '', [''])

        this.label = label
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.isLastLocSavedUsed()) {
                const level = this.escaper.getMakingLevel()

                const r = new Region(this.label, this.lastX, this.lastY, this.orderX, this.orderY)
                level.regions.new(r)

                Text.mkP(this.makerOwner, 'region "' + this.label + '" created')
                this.escaper.destroyMake()
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
