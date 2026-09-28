import { Text } from 'core/01_libraries/Text'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import type { Monster } from '../Monster/Monster'
import { MONSTER_NEAR_DIFF_MAX } from '../Monster/MonsterArray'
import { ClearMob } from './ClearMob'

export class ClearMobArray extends BaseArray<ClearMob> {
    private level: Level

    constructor(level: Level) {
        super(true)
        this.level = level
    }

    new = (triggerMob: Monster, disableDuration: number, initialize: boolean): ClearMob => {
        const clearMob = new ClearMob(triggerMob, disableDuration)

        initialize && clearMob.initialize()
        clearMob.level = this.level

        const id = this._new(clearMob)
        clearMob.id = id

        return clearMob
    }

    newFromJson = (clearMobsJson: { [x: string]: any }[]) => {
        for (let cm of clearMobsJson) {
            const mt = this.level.monsters.get(cm.triggerMobId)

            if (!mt) {
                Text.erA(`Monster label "${cm.triggerMobId}" unknown`)
            } else {
                const clearMob = this.new(mt, cm.disableDuration, false)

                if (cm.clearMobSpecialEffect) {
                    clearMob.setClearMobSpecialEffect(cm.clearMobSpecialEffect)
                }

                if (cm.blockMobSpecialEffect) {
                    clearMob.setBlockMobSpecialEffect(cm.blockMobSpecialEffect)
                }

                for (const [_, blockMobId] of pairs(cm.blockMobsIds)) {
                    const mt = this.level.monsters.get(blockMobId)

                    if (!mt) {
                        Text.erA(`Monster label "${cm.blockMobsIds}" unknown`)
                    } else {
                        clearMob.addBlockMob(mt)
                    }
                }
            }
        }
    }

    removeClearMob = (clearMobArrayId: number) => {
        delete this.data[clearMobArrayId]
    }

    clearClearMob = (clearMobId: number): boolean => {
        if (this.data[clearMobId]) {
            this.data[clearMobId].destroy()
            delete this.data[clearMobId]
            return true
        } else {
            return false
        }
    }

    getClearMobNear(x: number, y: number) {
        let xMob: number
        let yMob: number
        let i = 0

        while (i <= this.lastInstanceId) {
            if (this.data[i]) {
                const unit = this.data[i].getTriggerMob().u

                if (unit) {
                    xMob = GetUnitX(unit)
                    yMob = GetUnitY(unit)
                    if (RAbsBJ(x - xMob) < MONSTER_NEAR_DIFF_MAX && RAbsBJ(y - yMob) < MONSTER_NEAR_DIFF_MAX) {
                        return this.data[i]
                    }
                }
            }
            i++
        }

        return null
    }

    initializeClearMobs = () => {
        for (const [_, clearMob] of pairs(this.data)) {
            clearMob.initialize()
        }
    }

    closeClearMobs = () => {
        for (const [_, clearMob] of pairs(this.data)) {
            clearMob.close()
        }
    }
}
