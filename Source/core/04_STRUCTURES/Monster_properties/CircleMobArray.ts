import { Text } from 'core/01_libraries/Text'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import type { Monster } from '../Monster/Monster'
import { MONSTER_NEAR_DIFF_MAX } from '../Monster/MonsterArray'
import { CircleMob } from './CircleMob'

export class CircleMobArray extends BaseArray<CircleMob> {
    private level: Level

    constructor(level: Level) {
        super(true)
        this.level = level
    }

    new = (
        triggerMob: Monster,
        rotationSpeed: number | null,
        direction: 'cw' | 'ccw' | null,
        facing: 'cw' | 'ccw' | 'in' | 'out' | null,
        radius: number
    ): CircleMob => {
        if (triggerMob.getCircleMob()) {
            throw 'Monster is already a circle'
        }

        const circleMob = new CircleMob(triggerMob, rotationSpeed, direction, facing, radius)

        circleMob.level = this.level

        const id = this._new(circleMob)
        circleMob.id = id

        return circleMob
    }

    newFromJson = (circleMobsJson: { [x: string]: any }[]) => {
        for (let cm of circleMobsJson) {
            const mainMob = this.level.monsters.get(cm.mainMobId)

            if (!mainMob) {
                Text.erA(`Monster id "${cm.mainMobId}" unknown`)
            } else {
                const circleMob = this.new(mainMob, cm.rotationSpeed, cm.direction, cm.facing, cm.radius)

                circleMob.setInitialAngle(cm.initialAngle)
                circleMob.setShape(cm.shape)

                for (const [_, blockMobId] of pairs(cm.blockMobsIds)) {
                    const mob = this.level.monsters.get(blockMobId)

                    if (!mob) {
                        Text.erA(`Monster id "${blockMobId}" unknown`)
                    } else {
                        circleMob.addBlockMob(mob)
                    }
                }
            }
        }
    }

    removeCircleMob = (circleMobArrayId: number) => {
        delete this.data[circleMobArrayId]
    }

    circleCircleMob = (circleMobId: number): boolean => {
        if (this.data[circleMobId]) {
            this.data[circleMobId].destroy()
            delete this.data[circleMobId]
            return true
        } else {
            return false
        }
    }

    getCircleMobNear(x: number, y: number) {
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

    activate = (activ: boolean) => {
        for (const [_, circleMob] of pairs(this.data)) {
            circleMob.activate(activ)
        }
    }

    closeCircleMobs = () => {
        for (const [_, circleMob] of pairs(this.data)) {
            circleMob.close()
        }
    }
}
