import { getUdgLevels } from '../../../../globals'
import { Text } from '../../01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'

export class MakeStart extends MakeOneByOneOrTwoClicks {
    private forNextB: boolean //à true si on veut créer le start du niveau suivant
    private facing?: number

    constructor(maker: unit, forNext: boolean, facing?: number) {
        super(maker, 'startCreate', '', [''])
        this.forNextB = forNext
        this.facing = facing
    }

    forNext = (): boolean => {
        return this.forNextB
    }

    doActions = () => {
        if (super.doBaseActions()) {
            let level: Level | null

            if (this.isLastLocSavedUsed()) {
                level = this.escaper.getMakingLevel()
                if (this.forNext()) {
                    if (!getUdgLevels().get(level.getId() + 1)) {
                        getUdgLevels().new()
                    }

                    level = getUdgLevels().get(level.getId() + 1)
                    if (!level) {
                        Text.erP(this.escaper.getPlayer(), "erreur d'origine inconnue")
                        this.escaper.destroyMake()
                        return
                    }
                }

                level.newStart(this.lastX, this.lastY, this.orderX, this.orderY, this.facing)
                Text.mkP(this.makerOwner, 'start made for level ' + I2S(level.getId()))

                this.escaper.destroyMake()
            } else {
                this.saveLoc(this.orderX, this.orderY)
            }
        }
    }
}
