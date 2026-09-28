import { Text } from 'core/01_libraries/Text'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import type { Monster } from '../Monster/Monster'
import { MONSTER_NEAR_DIFF_MAX } from '../Monster/MonsterArray'
import { PortalMob } from './PortalMob'

export class PortalMobArray extends BaseArray<PortalMob> {
    private level: Level

    constructor(level: Level) {
        super(true)
        this.level = level
    }

    new = (
        triggerMob: Monster,
        freezeDuration: number,
        portalEffect: string | null,
        portalEffectDuration: number | null
    ) => {
        const portalMob = new PortalMob(triggerMob, freezeDuration, portalEffect, portalEffectDuration)

        portalMob.initialize()
        portalMob.level = this.level

        const id = this._new(portalMob)
        portalMob.id = id

        return portalMob
    }

    newFromJson = (portalMobsJson: { [x: string]: any }[]) => {
        for (let v of portalMobsJson) {
            const mt = this.level.monsters.get(v.triggerMobId)

            if (!mt) {
                Text.erA(`Monster label "${v.triggerMobId}" unknown`)
            } else {
                const portalMob = this.new(mt, v.freezeDuration, v.portalEffect, v.portalEffectDuration)
                portalMob.setTargetMob(this.level.monsters.get(v.targetMobId))
            }
        }
    }

    removePortalMob = (portalMobArrayId: number) => {
        delete this.data[portalMobArrayId]
    }

    portalPortalMob = (portalMobId: number): boolean => {
        if (this.data[portalMobId]) {
            this.data[portalMobId].destroy()
            delete this.data[portalMobId]
            return true
        } else {
            return false
        }
    }

    getPortalMobNear(x: number, y: number) {
        let xMob: number
        let yMob: number
        let i = 0

        while (i <= this.lastInstanceId) {
            if (this.data[i]) {
                const unit = this.data[i].getTriggerMob()?.u

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

    initializePortalMobs = () => {
        for (const [_, portalMob] of pairs(this.data)) {
            portalMob.initialize()
        }
    }

    closePortalMobs = () => {
        for (const [_, portalMob] of pairs(this.data)) {
            portalMob.close()
        }
    }
}
