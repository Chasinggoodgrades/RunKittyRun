import { Text } from 'core/01_libraries/Text'
import { PortalMob } from 'core/04_STRUCTURES/Monster_properties/PortalMob'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'
import { PORTAL_MOB_MAX_FREEZE_DURATION } from '../../04_STRUCTURES/Monster_properties/PortalMob'

export class MakePortalMob extends Make {
    private freezeDuration: number
    private portalMob?: PortalMob
    private triggerMob?: Monster
    private targetMob: Monster | null = null
    private portalEffect: string | null
    private portalEffectDuration: number | null = null

    constructor(maker: unit, freezeDuration: number, portalEffect: string | null, portalEffectDuration: number | null) {
        super(maker, 'createPortalMob')

        if (freezeDuration !== 0 && (freezeDuration > PORTAL_MOB_MAX_FREEZE_DURATION || freezeDuration < 0)) {
            throw 'PortalMob : wrong duration'
        }

        this.freezeDuration = freezeDuration
        this.portalEffect = portalEffect
        this.portalEffectDuration = portalEffectDuration
    }

    private createPortalMob = () => {
        if (this.triggerMob) {
            this.portalMob = this.escaper
                .getMakingLevel()
                .portalMobs.new(this.triggerMob, this.freezeDuration, this.portalEffect, this.portalEffectDuration)
        }
    }

    setTargetMob = (monster: Monster): boolean => {
        this.portalMob?.setTargetMob(monster)
        this.targetMob = monster
        return true
    }

    private cancelOneTargetMob = () => {
        if (this.portalMob && this.portalMob.setTriggerMob(null)) {
            return true
        }

        return false
    }

    private redoOneTargetMob = () => {
        if (this.portalMob && !this.portalMob.getTriggerMob()) {
            this.portalMob.setTriggerMob(this.targetMob)

            return true
        }

        return false
    }

    clickMade = (monster: Monster) => {
        if (!this.portalMob) {
            //creation of the portalMob
            this.triggerMob = monster
            this.createPortalMob()
            Text.mkP(this.makerOwner, 'trigger mob added for a new portal mob')
        } else {
            //vérification que le portal mob existe toujours
            if (!this.portalMob.getTriggerMob()) {
                Text.erP(this.makerOwner, 'the portal mob you are working on has been removed')
                this.escaper.destroyMake()
                return
            }
            if (this.portalMob.getTargetMob() === monster) {
                Text.erP(this.makerOwner, 'this monster is already a target mob of this portal mob')
                return
            } else {
                this.setTargetMob(monster)
                Text.mkP(this.makerOwner, 'target mob added')
                this.escaper.destroyMake()
            }
        }
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //recherche du monstre cliqué
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)

            //application du clic
            if (!monster) {
                Text.erP(this.makerOwner, 'no monster clicked for your making level')
            } else {
                this.clickMade(monster)
            }
        }
    }

    cancelLastAction = () => {
        if (this.portalMob) {
            if (this.cancelOneTargetMob()) {
                Text.mkP(this.makerOwner, 'last target mob removed')
            } else {
                this.portalMob.destroy()
                delete this.portalMob
                Text.mkP(this.makerOwner, 'portal mob removed')
            }

            return true
        } else {
            return false
        }
    }

    redoLastAction = () => {
        if (!this.portalMob) {
            if (this.triggerMob) {
                this.createPortalMob()
                Text.mkP(this.makerOwner, 'trigger mob added for a new portal mob')
                return true
            } else {
                return false
            }
        } else if (this.redoOneTargetMob()) {
            Text.mkP(this.makerOwner, 'target mob added')
            return true
        } else {
            return false
        }
    }
}
