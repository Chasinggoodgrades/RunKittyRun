import { EffectUtils } from 'Utils/EffectUtils'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Level } from '../Level/Level'
import { Monster } from '../Monster/Monster'
import { MonsterArray } from '../Monster/MonsterArray'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const CLEAR_MOB_MAX_DURATION = 300
export const FRONT_MONTANT_DURATION = 0.03

const TRIGGER_MOB = 0
const TIMER_ACTIVATED = 1
const TIMER_FRONT_MONTANT = 2

let udp_currentTimer: timer
const TRIGGER_MOB_PERMANENT_EFFECT = 'Abilities\\Spells\\Orc\\StasisTrap\\StasisTotemTarget.mdl'

const ClearMobTimerExpires = () => {
    const clearMob = ClearMob.anyTimerActivatedId2ClearMob.get(GetHandleId(Natives.UGetExpiredTimer()))

    if (clearMob) {
        clearMob.initialize() //réinitialise la couleur du trigger mob
        udp_currentTimer = Natives.UGetExpiredTimer()
        clearMob.getBlockMobs().forAll(TemporarilyEnableMonster)
    }
}

const ClearMobFrontMontantTimerExpires = () => {
    const clearMob = ClearMob.anyTimerFrontMontantId2ClearMob.get(GetHandleId(Natives.UGetExpiredTimer()))

    if (clearMob) {
        if (clearMob.isBeingActivated()) {
            clearMob.getTriggerMob().setVertexColor(70, 100, 70)
        }
    }
}

const KillMonster = (monster: Monster) => {
    monster.killUnit()
}

const TemporarilyDisableMonster = (monster: Monster) => {
    monster.temporarilyDisable(udp_currentTimer)
}

const TemporarilyEnableMonster = (monster: Monster) => {
    monster.temporarilyEnable(udp_currentTimer)
}

export class ClearMob {
    static anyTimerFrontMontantId2ClearMob = new Map<number, ClearMob>()
    static anyTimerActivatedId2ClearMob = new Map<number, ClearMob>()
    static anyTriggerMob2ClearMob = new Map<Monster, ClearMob>()

    level?: Level
    private triggerMob: Monster
    private blockMobs: MonsterArray
    private disableDuration: number //0 = permanent
    private timerActivated: timer
    private timerFrontMontant: timer //le trigger mob reste en vert pêtant le temps du "front montant"
    enabled: boolean
    private triggerMobPermanentEffect?: effect
    private clearMobSpecialEffect?: string
    private blockMobSpecialEffect?: string

    id: number = -1

    constructor(triggerMob: Monster, disableDuration: number) {
        if (
            disableDuration !== 0 &&
            (disableDuration > CLEAR_MOB_MAX_DURATION || disableDuration < FRONT_MONTANT_DURATION)
        ) {
            throw this.constructor.name + ' : wrong disable duration'
        }

        this.triggerMob = triggerMob
        triggerMob.setClearMob(this)

        this.disableDuration = disableDuration
        this.timerActivated = CreateTimer()
        this.timerFrontMontant = CreateTimer()

        this.enabled = true

        ClearMob.anyTriggerMob2ClearMob.set(triggerMob, this)
        ClearMob.anyTimerActivatedId2ClearMob.set(GetHandleId(this.timerActivated), this)
        ClearMob.anyTimerFrontMontantId2ClearMob.set(GetHandleId(this.timerFrontMontant), this)

        this.blockMobs = new MonsterArray()
    }

    getDisableDuration = (): number => {
        return this.disableDuration
    }

    setDisableDuration = (disableDuration: number): boolean => {
        if (
            disableDuration !== 0 &&
            (disableDuration > CLEAR_MOB_MAX_DURATION || disableDuration < FRONT_MONTANT_DURATION)
        ) {
            return false
        }
        this.disableDuration = disableDuration
        return true
    }

    getTriggerMob = (): Monster => {
        return this.triggerMob
    }

    setTriggerMob = (newTriggerMob: Monster): boolean => {
        if (!newTriggerMob || this.triggerMob === newTriggerMob) {
            return false
        }

        if (!!this.triggerMob) {
            this.triggerMob.removeClearMob()
        }

        ClearMob.anyTriggerMob2ClearMob.delete(this.triggerMob)
        ClearMob.anyTriggerMob2ClearMob.set(newTriggerMob, this)
        this.triggerMob = newTriggerMob
        newTriggerMob.setClearMob(this)

        return true
    }

    getBlockMobs = () => {
        return this.blockMobs
    }

    getClearMobSpecialEffect = () => {
        return this.clearMobSpecialEffect
    }

    setClearMobSpecialEffect = (effectPath: string | undefined) => {
        this.clearMobSpecialEffect = effectPath
    }

    getBlockMobSpecialEffect = () => {
        return this.blockMobSpecialEffect
    }

    setBlockMobSpecialEffect = (effectPath: string | undefined) => {
        this.blockMobSpecialEffect = effectPath
    }

    initialize = () => {
        this.triggerMob.setBaseColor('blue')
        this.triggerMob.setVertexColor(30, 60, 100)
        if (!this.triggerMobPermanentEffect && this.triggerMob.u) {
            this.triggerMobPermanentEffect = EffectUtils.addSpecialEffectTarget(
                TRIGGER_MOB_PERMANENT_EFFECT,
                this.triggerMob.u,
                'origin'
            )
        }
        this.enabled = true
    }

    close = () => {
        if (this.triggerMobPermanentEffect) {
            EffectUtils.destroyEffect(this.triggerMobPermanentEffect)
            delete this.triggerMobPermanentEffect
        }
    }

    redoTriggerMobPermanentEffect = () => {
        if (this.triggerMobPermanentEffect) {
            EffectUtils.destroyEffect(this.triggerMobPermanentEffect)
            delete this.triggerMobPermanentEffect
        }

        if (this.triggerMob.u) {
            this.triggerMobPermanentEffect = EffectUtils.addSpecialEffectTarget(
                TRIGGER_MOB_PERMANENT_EFFECT,
                this.triggerMob.u,
                'origin'
            )
        }
    }

    addBlockMob = (monster: Monster): boolean => {
        if (this.blockMobs.containsMonster(monster)) {
            return false
        }

        this.blockMobs.new(monster, false)
        return true
    }

    removeLastBlockMob = (): boolean => {
        this.blockMobs.getLast()?.temporarilyEnable(this.timerActivated)
        return this.blockMobs.removeLast(false)
    }

    removeAllBlockMobs = () => {
        udp_currentTimer = this.timerActivated

        this.blockMobs.forAll(TemporarilyEnableMonster)
        this.blockMobs.removeAllWithoutDestroy()
    }

    destroy = () => {
        ClearMob.anyTriggerMob2ClearMob.delete(this.triggerMob)
        ClearMob.anyTimerActivatedId2ClearMob.delete(GetHandleId(this.timerActivated))
        ClearMob.anyTimerFrontMontantId2ClearMob.delete(GetHandleId(this.timerFrontMontant))

        this.close()
        this.triggerMob.reinitColor()
        this.triggerMob.removeClearMob()

        this.removeAllBlockMobs()

        DestroyTimer(this.timerActivated)
        DestroyTimer(this.timerFrontMontant)

        this.level && this.level.clearMobs.removeClearMob(this.id)
    }

    isBeingActivated = (): boolean => {
        return TimerGetRemaining(this.timerActivated) > 0
    }

    activate = () => {
        if (!this.enabled) {
            return
        }

        // Play special effect on clear mob location if configured
        if (!this.isBeingActivated() && this.clearMobSpecialEffect && this.triggerMob.u) {
            const x = GetUnitX(this.triggerMob.u)
            const y = GetUnitY(this.triggerMob.u)
            const eff = EffectUtils.addSpecialEffect(this.clearMobSpecialEffect, x, y)
            EffectUtils.destroyEffect(eff)
        }

        if (this.disableDuration === 0) {
            this.blockMobs.forAll(KillMonster)
            this.enabled = false
        } else {
            const alreadyActivated = this.isBeingActivated()

            udp_currentTimer = this.timerActivated
            TimerStart(this.timerActivated, this.disableDuration, false, ClearMobTimerExpires)

            // Play special effect on block mobs if configured
            if (!alreadyActivated && this.blockMobSpecialEffect) {
                this.blockMobs.forAll((monster: Monster) => {
                    if (monster.u) {
                        const x = GetUnitX(monster.u)
                        const y = GetUnitY(monster.u)
                        const eff = EffectUtils.addSpecialEffect(this.blockMobSpecialEffect!, x, y)
                        EffectUtils.destroyEffect(eff)
                    }
                    TemporarilyDisableMonster(monster)
                })
            } else {
                this.blockMobs.forAll(TemporarilyDisableMonster)
            }

            TimerStart(this.timerFrontMontant, FRONT_MONTANT_DURATION, false, ClearMobFrontMontantTimerExpires)
        }
        //dans tous les cas le trigger mob "s'active"
        this.triggerMob.setBaseColor('green')
        this.triggerMob.setVertexColor(40, 100, 40)
    }

    toJson = () => {
        const blockMobIds: number[] = []

        for (const [_, monster] of pairs(this.blockMobs.getAll())) {
            if (!monster.isDeleted()) {
                arrayPush(blockMobIds, monster.id)
            }
        }

        const output = MemoryHandler.getEmptyObject<any>()

        output['id'] = this.id
        output['triggerMobId'] = this.triggerMob.id
        output['disableDuration'] = this.disableDuration
        output['blockMobsIds'] = blockMobIds

        if (this.clearMobSpecialEffect) {
            output['clearMobSpecialEffect'] = this.clearMobSpecialEffect
        }

        if (this.blockMobSpecialEffect) {
            output['blockMobSpecialEffect'] = this.blockMobSpecialEffect
        }

        return output
    }
}
