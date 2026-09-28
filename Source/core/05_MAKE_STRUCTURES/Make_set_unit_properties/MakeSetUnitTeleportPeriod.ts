import { MemoryHandler } from 'Utils/MemoryHandler'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { Text } from '../../01_libraries/Text'
import {
    MONSTER_TELEPORT_PERIOD_MAX,
    MONSTER_TELEPORT_PERIOD_MIN,
    MonsterTeleport,
} from '../../04_STRUCTURES/Monster/MonsterTeleport'

export class MakeSetUnitTeleportPeriod extends MakeOneByOneOrTwoClicks {
    private period: number

    constructor(maker: unit, mode: string, period: number) {
        super(maker, 'setUnitTeleportPeriod', mode)

        if (period < MONSTER_TELEPORT_PERIOD_MIN || period > MONSTER_TELEPORT_PERIOD_MAX) {
            throw this.constructor.name + ' : wrong period "' + period + '"'
        }

        this.period = period
    }

    getPeriod = (): number => {
        return this.period
    }

    doActions = () => {
        if (super.doBaseActions()) {
            let nbMonstersFixed = 0

            if (this.getMode() == 'oneByOne') {
                const monsterTP = this.escaper
                    .getMakingLevel()
                    .monsters.getMonsterNear(this.orderX, this.orderY, 'MonsterTeleport')

                if (monsterTP instanceof MonsterTeleport) {
                    monsterTP.setPeriod(this.getPeriod())
                    nbMonstersFixed = 1
                }
            } else {
                //mode twoClics
                if (!this.isLastLocSavedUsed()) {
                    this.saveLoc(this.orderX, this.orderY)
                    return
                }

                const monstersTP = this.escaper
                    .getMakingLevel()
                    .monsters.getMonstersBetweenLocs(
                        this.lastX,
                        this.lastY,
                        this.orderX,
                        this.orderY,
                        'MonsterTeleport'
                    )

                for (const monsterTP of monstersTP) {
                    if (monsterTP instanceof MonsterTeleport) monsterTP.setPeriod(this.getPeriod())
                    nbMonstersFixed++
                }

                MemoryHandler.destroyArray(monstersTP)
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
