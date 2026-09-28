import { createTimer } from 'Utils/mapUtils'
import { udg_monsters } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'

const PERIOD = 0.1

export const monstersClickable = Natives.UCreateGroup()

const forEachClickableMonster = () => {
    const monsterUnit = Natives.UGetEnumUnit()
    const currentLife = GetUnitState(monsterUnit, UNIT_STATE_LIFE)
    const monster = udg_monsters[GetUnitUserData(monsterUnit)]

    if (!!monster) {
        const previousLife = I2R(monster.getLife())
        let diffLife = RMaxBJ(currentLife, previousLife) - RMinBJ(currentLife, previousLife)
        if (diffLife < 100) {
            SetUnitLifeBJ(monsterUnit, previousLife - 0.9)
        } else {
            while (!(diffLife <= 0)) {
                monster.setLife(R2I(previousLife) - 10000)
                diffLife = diffLife - 10000
            }
        }
    }
}

export const init_TrigMonstersClickableSetLife = () => {
    createTimer(PERIOD, true, () => {
        ForGroup(monstersClickable, forEachClickableMonster)
    })
}
