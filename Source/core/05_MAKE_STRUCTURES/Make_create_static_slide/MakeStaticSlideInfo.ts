import { convertAngleToDirection } from 'core/01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import { Make } from '../Make/Make'

export class MakeStaticSlideInfo extends Make {
    constructor(maker: unit) {
        super(maker, 'StaticSlideInfo')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const staticSlide = this.escaper
                .getMakingLevel()
                .staticSlides.getStaticSlideFromPoint(this.orderX, this.orderY)

            if (staticSlide) {
                Text.mkP(
                    this.makerOwner,
                    `ID: ${staticSlide.id} Speed: ${staticSlide.getSpeed()} Angle: ${convertAngleToDirection(
                        staticSlide.getAngle()
                    )}`
                )
            } else {
                Text.erP(this.makerOwner, 'no static slide clicked for your making level')
            }
        }
    }
}
