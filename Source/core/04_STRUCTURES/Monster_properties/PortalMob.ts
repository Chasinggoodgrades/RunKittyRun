import { animUtils } from 'Utils/AnimUtils'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { createTimer } from 'Utils/mapUtils'
import { StopUnit } from 'core/01_libraries/Basic_functions'
import { Timer } from 'w3ts'
import { globals } from '../../../../globals'
import { Escaper } from '../Escaper/Escaper'
import { Level } from '../Level/Level'
import { Monster } from '../Monster/Monster'

export const PORTAL_MOB_MAX_FREEZE_DURATION = 10

export class PortalMob {
    level?: Level
    private triggerMob: Monster | null
    private targetMob: Monster | null
    private freezeDuration: number
    private portalEffect: string | null
    private portalEffectDuration: number

    id: number = -1

    private timers = MemoryHandler.getEmptyArray<Timer>()

    constructor(
        triggerMob: Monster,
        freezeDuration: number,
        portalEffect: string | null,
        portalEffectDuration: number | null
    ) {
        if (freezeDuration < 0 || freezeDuration > PORTAL_MOB_MAX_FREEZE_DURATION) {
            throw this.constructor.name + ' : invalid freeze duration'
        }

        this.triggerMob = triggerMob
        this.targetMob = null

        triggerMob.setPortalMob(this)

        this.freezeDuration = freezeDuration
        this.portalEffect = portalEffect
        this.portalEffectDuration = portalEffectDuration || freezeDuration || 1
    }

    getTriggerMob = () => this.triggerMob

    getTargetMob = () => this.targetMob

    initialize = () => {}

    close = () => {}

    redoTriggerMobPermanentEffect = () => {}

    setTriggerMob = (monster: Monster | null): boolean => {
        if (this.triggerMob) {
            return false
        }

        this.triggerMob = monster
        this.triggerMob?.setPortalMob(this)

        return true
    }

    setTargetMob = (monster: Monster | null): boolean => {
        if (this.targetMob) {
            return false
        }

        this.targetMob = monster
        this.targetMob?.setPortalMob(this)

        return true
    }

    getFreezeDuration = () => this.freezeDuration

    setFreezeDuration = (freezeDuration: number) => {
        if (freezeDuration < 0 || freezeDuration > PORTAL_MOB_MAX_FREEZE_DURATION) {
            throw this.constructor.name + ' : invalid freeze duration'
        }

        this.freezeDuration = freezeDuration
    }

    getPortalEffect = () => this.portalEffect

    setPortalEffect = (portalEffect: string | null) => {
        this.portalEffect = portalEffect
    }

    getPortalEffectDuration = () => this.portalEffectDuration

    setPortalEffectDuration = (portalEffectDuration: number | null) => {
        this.portalEffectDuration = portalEffectDuration || this.freezeDuration || 1
    }

    destroy = () => {
        this.triggerMob?.removePortalMob()
        this.targetMob?.removePortalMob()

        this.level && this.level.portalMobs.removePortalMob(this.id)

        this.timers.forEach(t => t.destroy())
        MemoryHandler.destroyArray(this.timers)
    }

    activate = (monster: Monster, escaper: Escaper, hero: unit) => {
        if (!this.targetMob || escaper.isPortalCooldown()) {
            return
        }

        const targetMob = this.triggerMob === monster ? this.targetMob : this.triggerMob

        if (!targetMob?.u) {
            return
        }

        StopUnit(hero)
        escaper.moveHero(GetUnitX(targetMob.u), GetUnitY(targetMob.u))

        SetUnitFlyHeight(hero, GetUnitFlyHeight(targetMob.u), 0)

        escaper.setLastZ(BlzGetUnitZ(hero))
        escaper.setOldDiffZ(0)
        escaper.setSpeedZ(0)

        escaper.enablePortalCooldown()
        this.portalEffect && escaper.createPortalEffect(this.portalEffect)

        if (this.freezeDuration > 0) {
            animUtils.setAnimation(hero, globals.animOnRevive || 'channel')
            escaper.absoluteSlideSpeed(0)
            escaper.setCanClick(false)

            this.timers.push(
                createTimer(this.freezeDuration, false, () => {
                    escaper.stopAbsoluteSlideSpeed()
                    escaper.setCanClick(true)
                    SetUnitAnimation(hero, 'stand')

                    escaper.disablePortalCooldown(0.5)
                })
            )
        } else {
            escaper.disablePortalCooldown(0.5)
        }

        this.portalEffect &&
            this.timers.push(
                createTimer(this.portalEffectDuration, false, () => {
                    escaper.destroyPortalEffect()
                })
            )

        // Move cam
        if (escaper.panCameraOnPortal) {
            escaper.moveCameraToHeroIfNecessary()

            // TODO; SECONDARYHERO?
        }
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['id'] = this.id
        output['triggerMobId'] = this.triggerMob?.id
        output['targetMobId'] = this.targetMob?.id
        output['freezeDuration'] = this.freezeDuration
        output['portalEffect'] = this.portalEffect
        output['portalEffectDuration'] = this.portalEffectDuration

        return output
    }
}
