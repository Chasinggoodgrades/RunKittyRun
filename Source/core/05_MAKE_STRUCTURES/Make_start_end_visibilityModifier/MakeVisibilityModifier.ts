import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { VisibilityModifier } from '../../04_STRUCTURES/Level/VisibilityModifier'
import { Text } from '../../01_libraries/Text'
import { MakeVisibilityModifierAction } from '../MakeLastActions/MakeVisibilityModifierAction'

export class MakeVisibilityModifier extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit) {
        super(maker, 'visibilityModifierCreate', '', [''])
    }

    doActions = () => {
        if (super.doBaseActions()) {
            let newVisibilityModifier: VisibilityModifier | null

            if (this.isLastLocSavedUsed()) {
                newVisibilityModifier = this.escaper
                    .getMakingLevel()
                    .newVisibilityModifier(this.lastX, this.lastY, this.orderX, this.orderY)
                if (!newVisibilityModifier) {
                    Text.erP(this.makerOwner, "can't create visibility, full for this level")
                } else {
                    newVisibilityModifier.activate(true)
                    this.escaper.newAction(
                        new MakeVisibilityModifierAction(this.escaper.getMakingLevel(), newVisibilityModifier)
                    )
                    Text.mkP(
                        this.makerOwner,
                        'visibility rectangle made for level ' + I2S(this.escaper.getMakingLevel().getId())
                    )
                }
                this.unsaveLocDefinitely()
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
