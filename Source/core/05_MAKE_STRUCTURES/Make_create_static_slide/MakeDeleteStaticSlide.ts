import { StaticSlide } from 'core/04_STRUCTURES/Level/StaticSlide'
import { Text } from '../../01_libraries/Text'
import { Make } from '../Make/Make'

export class MakeDeleteStaticSlide extends Make {
    constructor(maker: unit) {
        super(maker, 'deleteStaticSlide')
    }

    clickMade = (staticSlide: StaticSlide) => {
        staticSlide.destroy()
        Text.mkP(this.makerOwner, 'static slide removed')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const staticSlide = this.escaper
                .getMakingLevel()
                .staticSlides.getStaticSlideFromPoint(this.orderX, this.orderY)

            if (staticSlide) {
                this.clickMade(staticSlide)
            } else {
                Text.erP(this.makerOwner, 'no static slide clicked for your making level')
            }
        }
    }
}
