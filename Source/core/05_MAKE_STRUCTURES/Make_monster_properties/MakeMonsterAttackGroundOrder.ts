import { Text } from 'core/01_libraries/Text'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'

export class MakeMonsterAttackGroundOrder extends Make {
    private _lastTargetMob: Monster | null = null
    private targetMob: Monster | null = null
    private targetX: number | null = null
    private targetY: number | null = null
    private delay: number

    constructor(maker: unit, delay: number = 0) {
        super(maker, 'setMonsterAttackGroundOrder')
        this.delay = delay
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (!this.targetMob) {
                const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)

                if (!monster) {
                    Text.erP(this.makerOwner, 'no monster clicked for your making level')
                } else {
                    this.targetMob = monster
                    Text.mkP(this.makerOwner, 'click on the ground')
                }
            } else {
                this.targetX = this.orderX
                this.targetY = this.orderY

                this.targetMob.setAttackGroundPos(this.targetX, this.targetY, this.delay)

                Text.mkP(this.makerOwner, 'done')
                this.escaper.destroyMake()
                this.escaper.makeSetMonsterAttackGroundOrder(this.delay)
            }
        }
    }

    cancelLastAction = () => {
        if (this.targetMob) {
            if (this.targetMob.hasAttackGroundPos()) {
                this.targetMob.setAttackGroundPos(undefined, undefined, 0)
                Text.mkP(this.makerOwner, 'click on the ground')
            } else {
                this._lastTargetMob = this.targetMob
                this.targetMob = null
                Text.mkP(this.makerOwner, 'click on a monster to apply')
            }

            return true
        } else {
            return false
        }
    }

    redoLastAction = () => {
        if (!this.targetMob) {
            this.targetMob = this._lastTargetMob
            this._lastTargetMob = null
            Text.mkP(this.makerOwner, 'click on the ground')
            return true
        } else if (!this.targetMob.hasAttackGroundPos() && this.targetX && this.targetY) {
            this.targetMob.setAttackGroundPos(this.targetX, this.targetY, this.delay)
            Text.mkP(this.makerOwner, 'done')
            return true
        } else {
            return false
        }
    }
}
