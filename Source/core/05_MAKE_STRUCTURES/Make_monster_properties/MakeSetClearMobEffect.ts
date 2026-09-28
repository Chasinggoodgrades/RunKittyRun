import { Text } from 'core/01_libraries/Text'
import { ClearMob } from 'core/04_STRUCTURES/Monster_properties/ClearMob'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'

export class MakeSetClearMobEffect extends Make {
    private effectPath: string

    constructor(maker: unit, effectPath: string) {
        super(maker, 'setClearMobEffect')
        this.effectPath = effectPath
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const level = this.escaper.getMakingLevel()
            const monster = level.monsters.getMonsterNear(this.orderX, this.orderY)

            if (!monster) {
                Text.erP(this.makerOwner, 'no monster clicked')
                return
            }

            const clearMob = ClearMob.anyTriggerMob2ClearMob.get(monster)
            if (!clearMob) {
                Text.erP(this.makerOwner, 'this monster is not a trigger mob of a clear mob')
                return
            }

            clearMob.setClearMobSpecialEffect(this.effectPath)
            Text.mkP(this.makerOwner, 'clear mob effect set to: ' + this.effectPath)
            this.escaper.destroyMake()
        }
    }

    cancelLastAction = () => {
        return false
    }

    redoLastAction = () => {
        return false
    }
}
