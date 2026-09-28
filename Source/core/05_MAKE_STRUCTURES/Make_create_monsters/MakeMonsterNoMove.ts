import { MonsterNoMove } from '../../04_STRUCTURES/Monster/MonsterNoMove'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'
import { Make } from '../Make/Make'
import { MakeDeleteMonstersAction } from '../MakeLastActions/MakeDeleteMonstersAction'
import { MakeMonsterAction } from '../MakeLastActions/MakeMonsterAction'

export class MakeMonsterNoMove extends Make {
    private mt: MonsterType
    private facingAngle: number

    constructor(maker: unit, mt: MonsterType, facingAngle: number) {
        super(maker, 'monsterCreateNoMove')

        this.mt = mt
        this.facingAngle = facingAngle
    }

    getMonsterType = (): MonsterType => {
        return this.mt
    }

    getFacingAngle = (): number => {
        return this.facingAngle
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.getMonsterType().getCreateTerrainLabel()) {
                const targetMob = this.escaper
                    .getMakingLevel()
                    .monsters.getMonsterNoMoveNearTile(this.orderX, this.orderY)

                if (targetMob) {
                    if (targetMob.getMonsterType()?.getCreateTerrainLabel()) {
                        targetMob.delete()
                        targetMob.removeUnit() // delete checks if unit exists, mct units dont have a unit
                        this.escaper.newAction(new MakeDeleteMonstersAction(this.escaper.getMakingLevel(), [targetMob]))
                    }
                }
            }

            const monster = new MonsterNoMove(this.getMonsterType(), this.orderX, this.orderY, this.getFacingAngle())
            this.escaper.getMakingLevel().monsters.new(monster, true)
            this.escaper.newAction(new MakeMonsterAction(this.escaper.getMakingLevel(), monster))
        }
    }

    cancelLastAction = (): boolean => {
        //implement cancel/redo
        return false
    }

    redoLastAction = (): boolean => {
        return false
    }
}
