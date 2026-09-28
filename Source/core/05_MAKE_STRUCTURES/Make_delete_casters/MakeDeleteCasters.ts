import { MemoryHandler } from 'Utils/MemoryHandler'
import { Caster } from 'core/04_STRUCTURES/Caster/Caster'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import { MakeDeleteMonstersAction } from '../MakeLastActions/MakeDeleteMonstersAction'

export class MakeDeleteCasters extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit, mode: string) {
        super(maker, 'deleteCasters', mode)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //modes : oneByOne, twoClics
            let caster: Caster | null
            let suppressedCasters: Caster[] = []
            let nbCastersRemoved = 0

            if (this.getMode() == 'oneByOne') {
                //mode oneClick
                const monster = this.escaper
                    .getMakingLevel()
                    .monsters.getMonsterNear(this.orderX, this.orderY, 'Caster')
                caster = monster instanceof Caster ? monster : null
                if (caster && caster.u) {
                    caster.delete()
                    arrayPush(suppressedCasters, caster)
                    nbCastersRemoved = 1
                }
            } else {
                //mode twoClics
                if (!this.isLastLocSavedUsed()) {
                    this.saveLoc(this.orderX, this.orderY)
                    return
                }

                const casters = this.escaper
                    .getMakingLevel()
                    .monsters.getMonstersBetweenLocs(this.lastX, this.lastY, this.orderX, this.orderY, 'Caster')

                for (const caster of casters) {
                    caster.delete()
                    caster instanceof Caster && arrayPush(suppressedCasters, caster)
                    nbCastersRemoved++
                }

                MemoryHandler.destroyArray(casters)
            }

            if (nbCastersRemoved <= 1) {
                Text.mkP(this.makerOwner, I2S(nbCastersRemoved) + ' caster removed.')
            } else {
                Text.mkP(this.makerOwner, I2S(nbCastersRemoved) + ' casters removed.')
            }

            if (nbCastersRemoved > 0) {
                this.escaper.newAction(new MakeDeleteMonstersAction(this.escaper.getMakingLevel(), suppressedCasters))
            }
            this.unsaveLocDefinitely()
        }
    }
}
