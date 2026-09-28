import { MemoryHandler } from 'Utils/MemoryHandler'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { Text } from '../../01_libraries/Text'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'

export class MakeSetUnitMonsterType extends MakeOneByOneOrTwoClicks {
    private mt: MonsterType

    constructor(maker: unit, mode: string, mt: MonsterType) {
        super(maker, 'setUnitMonsterType', mode)
        this.mt = mt
    }

    getMonsterType = (): MonsterType => {
        return this.mt
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //modes : oneByOne, twoClics
            let nbMonstersFixed = 0

            if (this.getMode() == 'oneByOne') {
                let monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
                if (monster) {
                    if (monster.setMonsterType(this.getMonsterType())) {
                        nbMonstersFixed = 1
                    }
                }
            } else {
                //mode twoClics
                if (!this.isLastLocSavedUsed()) {
                    this.saveLoc(this.orderX, this.orderY)
                    return
                }

                const monsters = this.escaper
                    .getMakingLevel()
                    .monsters.getMonstersBetweenLocs(this.lastX, this.lastY, this.orderX, this.orderY)

                for (const monster of monsters) {
                    if (monster.setMonsterType(this.getMonsterType())) {
                        nbMonstersFixed++
                    }
                }

                MemoryHandler.destroyArray(monsters)
            }

            if (nbMonstersFixed <= 1) {
                Text.mkP(this.makerOwner, I2S(nbMonstersFixed) + ' monster fixed.')
            } else {
                Text.mkP(this.makerOwner, I2S(nbMonstersFixed) + ' monsters fixed.')
            }
            this.unsaveLocDefinitely()
        }
    }
}
