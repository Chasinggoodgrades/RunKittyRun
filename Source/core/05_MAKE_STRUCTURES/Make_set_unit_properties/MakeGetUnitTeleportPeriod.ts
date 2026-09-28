import { Text } from '../../01_libraries/Text'
import { Make } from '../Make/Make'
import { MonsterTeleport } from '../../04_STRUCTURES/Monster/MonsterTeleport'

export class MakeGetUnitTeleportPeriod extends Make {
    constructor(maker: unit) {
        super(maker, 'getUnitTeleportPeriod')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
            if (monster instanceof MonsterTeleport) {
                Text.mkP(this.makerOwner, 'period : ' + R2S(monster.getPeriod()) + ' s')
            }
        }
    }
}
