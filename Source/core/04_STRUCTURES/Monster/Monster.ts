import { Constants } from 'core/01_libraries/Constants'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { Timer } from 'w3ts'
import { getUdgEscapers, udg_monsters } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { GetUnitZEx } from '../../../Utils/LocationUtils'
import { createTimer } from '../../../Utils/mapUtils'
import { ColorString2Id } from '../../01_libraries/Init_colorCodes'
import { IsColorString } from '../../06_COMMANDS/Helpers/Command_functions'
import { hooks } from '../../API/GeneralHooks'
import { CombineHooks } from '../../API/MecHookArray'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Escaper } from '../Escaper/Escaper'
import { Level } from '../Level/Level'
import { CircleMob } from '../Monster_properties/CircleMob'
import { ClearMob } from '../Monster_properties/ClearMob'
import { PortalMob } from '../Monster_properties/PortalMob'
import type { ContactAreaBuilder } from './ContactChunks'
import { forgetMonsterInChunks, registerMonsterInChunks, unregisterMonsterFromChunks } from './ContactChunks'
import { isImmolationSystemEnabled } from './Immolation_system'
import { MonsterType } from './MonsterType'
import { monstersClickable } from './trig_Monsters_clickable_set_life'

/** Some circle mob shapes reach well past their radius, so the circle is taken generously */
const CIRCLE_MOB_REACH_FACTOR = 5

const LIVES_EARNED_SOUND_PATH = 'Sound/Interface/SecretFound.wav'
const LIVES_EARNED_SOUND_DURATION = 2525

export abstract class Monster {
    public static forceUnitTypeIdForNextMonster = 0

    public static forceXforNextMonster = 0
    public static forceYforNextMonster = 0
    public static forceX1forNextMonster = 0
    public static forceY1forNextMonster = 0
    public static forceX2forNextMonster = 0
    public static forceY2forNextMonster = 0

    public static DISABLE_TRANSPARENCY = 80

    public static lastInstanceId = -1

    id: number
    u?: unit
    mt?: MonsterType
    level?: Level
    life: number
    createUnitFunc?: (this: void) => unit | undefined

    //color
    private baseColorId: number
    private vcRed: number
    private vcGreen: number
    private vcBlue: number
    private vcTransparency: number

    //disabling
    protected disablingTimer?: timer
    private isDisabledB = false
    private deleted = false

    //clear mob that this mob is trigger mob
    protected clearMob?: ClearMob
    protected portalMob?: PortalMob
    protected circleMob?: CircleMob
    protected circleMobParent?: CircleMob
    private jumpPad?: number
    private jumpPadEffect?: string

    private attackGroundX: number | undefined = undefined
    private attackGroundY: number | undefined = undefined
    private attackGroundDelay: number = 0
    private monsterSkin: number | undefined = undefined

    private lifeBonusEscapersWhoJustReached: Set<Escaper> = new Set()
    private lifeBonusLivesEarned = false

    private collisionLandmarkEffect?: effect

    constructor(monsterType?: MonsterType, forceId: number | null = null) {
        this.mt = monsterType

        if (forceId !== null) {
            this.id = forceId

            if (Monster.lastInstanceId < forceId) {
                Monster.lastInstanceId = forceId
            }
        } else {
            this.id = ++Monster.lastInstanceId
        }

        udg_monsters[this.id] = this

        this.life = 0

        //color
        this.baseColorId = -1
        this.vcRed = 100
        this.vcGreen = 100
        this.vcBlue = 100
        this.vcTransparency = 0
    }

    getId = () => {
        return this.id
    }

    setClearMob = (clearMob: ClearMob) => {
        this.clearMob = clearMob
    }

    getClearMob = () => {
        return this.clearMob
    }

    removeClearMob = () => {
        delete this.clearMob
    }

    setPortalMob = (portalMob: PortalMob) => {
        this.portalMob = portalMob
    }

    getPortalMob = () => {
        return this.portalMob
    }

    removePortalMob() {
        delete this.portalMob
    }

    setCircleMob(circleMob: CircleMob) {
        this.circleMob = circleMob
    }

    getCircleMob = () => {
        return this.circleMob
    }

    removeCircleMob() {
        delete this.circleMob
    }

    setCircleMobParent(circleMobParent: CircleMob) {
        this.circleMobParent = circleMobParent
    }

    getCircleMobParent = () => {
        return this.circleMobParent
    }

    removeCircleMobParent() {
        delete this.circleMobParent
    }

    getCircleMobs() {
        return this.circleMob || this.circleMobParent
    }

    getJumpPad = () => this.jumpPad
    setJumpPad = (jumpPad: number | undefined) => {
        this.jumpPad = jumpPad
    }

    getJumpPadEffect = () => this.jumpPadEffect
    setJumpPadEffect = (jumpPadEffect: string | undefined) => {
        this.jumpPadEffect = jumpPadEffect
    }

    getMonsterSkin = () => this.monsterSkin
    setMonsterSkin = (monsterSkin: number | undefined) => {
        this.monsterSkin = monsterSkin

        if (this.u) {
            if (monsterSkin) {
                BlzSetUnitSkin(this.u, monsterSkin)
            } else {
                this.removeUnit()
                this.createUnit()
            }
        }
    }

    removeUnit() {
        if (this.u) {
            unregisterMonsterFromChunks(this)
            GroupRemoveUnit(monstersClickable, this.u)
            RemoveUnit(this.u)
            this.refreshCollisionLandmark()
            delete this.u
            delete this.disablingTimer
        }
    }

    killUnit() {
        if (this.u && IsUnitAliveBJ(this.u)) {
            KillUnit(this.u)
            this.refreshCollisionLandmark()
        }
    }

    createUnit(createUnitFunc?: () => unit | undefined) {
        if (this.isDeleted()) return

        if (createUnitFunc) {
            this.createUnitFunc = createUnitFunc
        }

        if (!this.createUnitFunc) {
            return
        }

        //hook onBeforeCreateMonsterUnit
        const hookArray = CombineHooks(
            this.level?.monsters.hooks_onBeforeCreateMonsterUnit,
            hooks.hooks_onBeforeCreateMonsterUnit
        )
        if (!!hookArray) {
            let forceUnitTypeId = 0
            let forceX = 0
            let forceY = 0
            let forceX1 = 0
            let forceY1 = 0
            let forceX2 = 0
            let forceY2 = 0
            let quit = false
            for (const hook of hookArray) {
                const output = hook.execute(this)
                if (output === false) {
                    quit = true
                } else if (output) {
                    output.unitTypeId && (forceUnitTypeId = output.unitTypeId)
                    output.x && (forceX = output.x)
                    output.y && (forceY = output.y)
                    output.x1 && (forceX1 = output.x1)
                    output.y1 && (forceY1 = output.y1)
                    output.x2 && (forceX2 = output.x2)
                    output.y2 && (forceY2 = output.y2)
                }
            }

            if (quit) {
                MemoryHandler.destroyArray(hookArray)
                return
            }

            forceUnitTypeId > 0 && (Monster.forceUnitTypeIdForNextMonster = forceUnitTypeId)
            forceX != 0 && (Monster.forceXforNextMonster = forceX)
            forceY != 0 && (Monster.forceYforNextMonster = forceY)
            forceX1 != 0 && (Monster.forceX1forNextMonster = forceX1)
            forceY1 != 0 && (Monster.forceY1forNextMonster = forceY1)
            forceX2 != 0 && (Monster.forceX2forNextMonster = forceX2)
            forceY2 != 0 && (Monster.forceY2forNextMonster = forceY2)
        }
        MemoryHandler.destroyArray(hookArray)

        let previouslyEnabled = !!this.u
        let isMonsterAlive = this.u && IsUnitAliveBJ(this.u)
        if (previouslyEnabled) {
            this.removeUnit()
        }
        this.u = this.createUnitFunc()

        this.u && SetUnitUserData(this.u, this.id)

        if (this.monsterSkin !== undefined) {
            this.setMonsterSkin(this.monsterSkin)
        }

        if (this.mt && this.mt.isClickable()) {
            this.life = this.mt.getMaxLife()
            this.u && GroupAddUnit(monstersClickable, this.u)
        }

        if (previouslyEnabled) {
            if (this.disablingTimer && TimerGetRemaining(this.disablingTimer) > 0) {
                this.temporarilyDisable(this.disablingTimer)
            }
            if (!isMonsterAlive) {
                this.killUnit()
            }
            if (this.baseColorId !== -1) {
                if (this.baseColorId === 0) {
                    this.u && SetUnitColor(this.u, PLAYER_COLOR_RED)
                } else {
                    this.u && SetUnitColor(this.u, Natives.UConvertPlayerColor(this.baseColorId))
                }
            }
            this.u && SetUnitVertexColorBJ(this.u, this.vcRed, this.vcGreen, this.vcBlue, this.vcTransparency)
        }

        if (this.clearMob) {
            this.clearMob.redoTriggerMobPermanentEffect()
        }

        //hook onAfterCreateMonsterUnit
        const hookArray2 = CombineHooks(
            this.level?.monsters.hooks_onAfterCreateMonsterUnit,
            hooks.hooks_onAfterCreateMonsterUnit
        )
        if (!!hookArray2) {
            for (const hook of hookArray2) {
                hook.execute(this)
            }
        }
        MemoryHandler.destroyArray(hookArray2)

        this.doAttackGroundPos()
        this.isDisabledB = false
        this.lifeBonusLivesEarned = false

        this.refreshCollisionLandmark()
        registerMonsterInChunks(this)
    }

    /**
     * Tells the contact chunks every place this monster's unit can be found during its life, so
     * that a hero standing far from all of them never has to hear about it.
     *
     * A circle mob is answered for here: whatever it is otherwise, it is carried around its
     * trigger mob and can be anywhere in the circle.
     */
    describeContactArea(area: ContactAreaBuilder) {
        // Where it stands right now, whatever its kind says below. A map can put a monster
        // somewhere else than where its level had it - the onBeforeCreateMonsterUnit hook is given
        // the chance to force a position - and a monster is only ever registered once its unit is
        // there, so this is the one thing that cannot be wrong.
        this.u && area.addPoint(GetUnitX(this.u), GetUnitY(this.u))

        const circleMobParent = this.circleMobParent

        if (circleMobParent) {
            const reach = circleMobParent.getRadius() * CIRCLE_MOB_REACH_FACTOR
            const triggerUnit = circleMobParent.getTriggerMob().u

            if (triggerUnit) {
                // the circle is drawn around the mob at its centre, which the circle itself hides
                const centerX = GetUnitX(triggerUnit)
                const centerY = GetUnitY(triggerUnit)

                area.addRect(centerX - reach, centerY - reach, centerX + reach, centerY + reach)
            }

            if (this.u) {
                // And the circle as seen from this mob, in case the one at the centre has no unit
                // to be asked yet: wherever this one stands on the circle, the whole of it is
                // within twice the reach of here.
                const aroundHere = reach * 2
                const x = GetUnitX(this.u)
                const y = GetUnitY(this.u)

                area.addRect(x - aroundHere, y - aroundHere, x + aroundHere, y + aroundHere)
            }

            return
        }

        this.describeOwnContactArea(area)
    }

    /** Reimplement in children that move on their own. By default a monster stays where it stands. */
    protected describeOwnContactArea(area: ContactAreaBuilder) {
        this.u && area.addPoint(GetUnitX(this.u), GetUnitY(this.u))
    }

    /** How the contact chunks name this kind of monster when they report on themselves */
    getContactAreaLabel(): string {
        return this.circleMobParent ? 'circleMob' : 'monster'
    }

    refreshCollisionLandmark = () => {
        const localEscaper = getUdgEscapers().get(GetPlayerId(Natives.UGetLocalPlayer()))
        const displayCollisionLandmark = localEscaper?.getDisplayCollisionLandmarks() ?? false

        if (this.collisionLandmarkEffect) {
            BlzSetSpecialEffectScale(this.collisionLandmarkEffect, 0) // hide it because an effect doesn't visually instanstly disappear on destroy
            DestroyEffect(this.collisionLandmarkEffect)
            delete this.collisionLandmarkEffect
        }

        if (this.u && IsUnitAliveBJ(this.u) && !this.isDisabledB && !this.isDeleted() && !IsUnitHidden(this.u)) {
            this.collisionLandmarkEffect = AddSpecialEffect(
                Constants.COLLISION_LANDMARK_MODEL,
                GetUnitX(this.u),
                GetUnitY(this.u)
            )
            if (!this.collisionLandmarkEffect) {
                throw new Error("Couldn't create collision landmark effect")
            }
            // const scale = 1024 / Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
            const scale = (this.mt?.getImmolationRadius() ?? 0) / Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
            BlzSetSpecialEffectScale(this.collisionLandmarkEffect, scale)

            if (!displayCollisionLandmark) {
                BlzSetSpecialEffectAlpha(this.collisionLandmarkEffect, 0)
            }
        }
    }

    moveCollisionLandmark = () => {
        if (this.collisionLandmarkEffect && this.u) {
            const z =
                GetUnitZEx(this.u) -
                (Constants.COLLISION_LANDMARK_MODEL_BASE_HEIGHT * (this.mt?.getImmolationRadius() ?? 0)) /
                    Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
            BlzSetSpecialEffectPosition(this.collisionLandmarkEffect, GetUnitX(this.u), GetUnitY(this.u), z)
        }
    }

    delete = () => {
        if (this.u) {
            this.removeUnit()
        }

        this.deleted = true
    }

    undelete = () => {
        this.deleted = false
        this.createUnit()
    }

    isDeleted = () => {
        return this.deleted
    }

    getLife = (): number => {
        return this.life
    }

    setLife = (life: number) => {
        this.life = life
        if (life > 0) {
            this.u && SetUnitLifeBJ(this.u, I2R(life) - 0.5)
        } else {
            this.killUnit()
        }
    }

    getMonsterType = () => {
        return this.mt
    }

    setMonsterType = (mt: MonsterType): boolean => {
        if (mt === this.mt) {
            return false
        }
        this.mt = mt
        this.createUnit()
        return true
    }

    temporarilyDisable = (disablingTimer: timer) => {
        if (
            !this.disablingTimer ||
            this.disablingTimer === disablingTimer ||
            TimerGetRemaining(disablingTimer) > TimerGetRemaining(this.disablingTimer)
        ) {
            const immoSkill = this.mt?.getImmolationSkill() || 0

            this.disablingTimer = disablingTimer
            this.u && immoSkill > 0 && UnitRemoveAbility(this.u, immoSkill)
            this.u && SetUnitVertexColorBJ(this.u, this.vcRed, this.vcGreen, this.vcBlue, Monster.DISABLE_TRANSPARENCY)
            this.vcTransparency = Monster.DISABLE_TRANSPARENCY
            this.isDisabledB = true
            this.refreshCollisionLandmark()
        }
    }

    temporarilyEnable = (disablingTimer: timer) => {
        if (this.disablingTimer === disablingTimer) {
            const immoSkill = this.mt?.getImmolationSkill() || 0

            this.u && immoSkill > 0 && isImmolationSystemEnabled() && UnitAddAbility(this.u, immoSkill)
            this.u && SetUnitVertexColorBJ(this.u, this.vcRed, this.vcGreen, this.vcBlue, 0)
            this.vcTransparency = 0
            this.isDisabledB = false
            this.refreshCollisionLandmark()
        }
    }

    isDisabled = () => {
        return this.isDisabledB
    }

    setBaseColor = (colorString: string) => {
        let baseColorId: number
        if (IsColorString(colorString)) {
            baseColorId = ColorString2Id(colorString)
            if (baseColorId < 0 || baseColorId > Constants.NB_PLAYERS_MAX) {
                return
            }
            this.baseColorId = baseColorId
            if (this.u !== null) {
                if (baseColorId === 0) {
                    this.u && SetUnitColor(this.u, PLAYER_COLOR_RED)
                } else {
                    this.u && SetUnitColor(this.u, Natives.UConvertPlayerColor(baseColorId))
                }
            }
        }
    }

    setVertexColor = (vcRed: number, vcGreen: number, vcBlue: number) => {
        this.vcRed = vcRed
        this.vcGreen = vcGreen
        this.vcBlue = vcBlue
        if (this.u !== null) {
            this.u && SetUnitVertexColorBJ(this.u, vcRed, vcGreen, vcBlue, this.vcTransparency)
        }
    }

    // transparency: 0 (opaque) to 100 (fully invisible). Keeps the current RGB tint.
    setUnitTransparency = (transparency: number) => {
        if (this.u) {
            SetUnitVertexColorBJ(this.u, this.vcRed, this.vcGreen, this.vcBlue, transparency)
        }
    }

    reinitColor = () => {
        let initBaseColorId: number
        //changement valeurs des champs
        this.baseColorId = -1
        this.vcRed = 100
        this.vcGreen = 100
        this.vcBlue = 100
        this.vcTransparency = 0
        //changement couleur du mob actuel
        if (this.u !== null) {
            if (Constants.MOBS_VARIOUS_COLORS && this.u) {
                initBaseColorId = GetPlayerId(GetOwningPlayer(this.u))
            } else {
                initBaseColorId = 12
            }
            if (initBaseColorId === 0) {
                this.u && SetUnitColor(this.u, PLAYER_COLOR_RED)
            } else {
                this.u && SetUnitColor(this.u, Natives.UConvertPlayerColor(initBaseColorId))
            }
            this.u && SetUnitVertexColorBJ(this.u, this.vcRed, this.vcGreen, this.vcBlue, this.vcTransparency)
        }
    }

    hasAttackGroundPos = () => {
        return this.attackGroundX !== undefined && this.attackGroundY !== undefined
    }

    setAttackGroundPos = (x: number | undefined, y: number | undefined, delay: number = 0) => {
        this.attackGroundX = x
        this.attackGroundY = y
        this.attackGroundDelay = delay

        if (this.u) {
            this.removeUnit()
            this.createUnit()
        }
    }

    getAttackGroundDelay = () => {
        return this.attackGroundDelay
    }

    setAttackGroundDelay = (delay: number) => {
        this.attackGroundDelay = delay
    }

    doAttackGroundPos = () => {
        if (this.u && this.attackGroundX && this.attackGroundY) {
            if (this.attackGroundDelay > 0) {
                const targetUnit = this.u
                const targetX = this.attackGroundX
                const targetY = this.attackGroundY
                new Timer().start(this.attackGroundDelay, false, () => {
                    if (targetUnit && GetUnitTypeId(targetUnit) !== 0) {
                        IssuePointOrder(targetUnit, 'attackground', targetX, targetY)
                    }
                })
            } else {
                IssuePointOrder(this.u, 'attackground', this.attackGroundX, this.attackGroundY)
            }
        }
    }

    onEscaperReachingThisLifeBonus(escaper: Escaper) {
        const lifeBonus = this.mt?.getLifeBonus()
        if (!lifeBonus) {
            return
        }

        if (this.lifeBonusEscapersWhoJustReached.has(escaper)) {
            return
        }
        this.lifeBonusEscapersWhoJustReached.add(escaper)

        if (lifeBonus.minimumSurviveTime <= 0) {
            this.triggerEscaperEarningLives(escaper)
        } else {
            const MEC_core_API = ServiceManager.getService('MEC_core_API')

            const timer = createTimer(lifeBonus.minimumSurviveTime, false, () => {
                this.triggerEscaperEarningLives(escaper)
                timer.destroy()
                MEC_core_API.destroyHook(hookId)
            })
            const hookId = MEC_core_API.onEscaperDeath(deadEscaper => {
                if (deadEscaper === escaper) {
                    timer.destroy()
                    this.lifeBonusEscapersWhoJustReached.delete(escaper)
                    MEC_core_API.destroyHook(hookId)
                }
            })
        }
    }

    triggerEscaperEarningLives(escaper: Escaper) {
        this.lifeBonusEscapersWhoJustReached.delete(escaper)

        const lifeBonus = this.mt?.getLifeBonus()
        if (!lifeBonus) {
            return
        }

        if (this.lifeBonusLivesEarned) {
            return
        }
        this.lifeBonusLivesEarned = true

        escaper.runSoundOnHero(LIVES_EARNED_SOUND_PATH, LIVES_EARNED_SOUND_DURATION)

        escaper.addLives(lifeBonus.nbLivesEarned)

        this.removeUnit()
    }

    destroy() {
        if (this.u) {
            this.removeUnit()
        }

        if (this.clearMob) {
            this.clearMob.destroy()
        }

        if (this.portalMob) {
            this.portalMob.destroy()
        }

        if (this.circleMob) {
            this.circleMob.destroy()
        }

        if (this.circleMobParent) {
            this.circleMobParent.removeMob(this.id)
        }

        forgetMonsterInChunks(this)

        delete udg_monsters[this.id]

        this.level?.monsters.removeMonster(this.id)
    }

    toJson(): false | { [x: string]: any } {
        if (this.isDeleted()) {
            return false
        } else {
            const output = MemoryHandler.getEmptyObject<any>()
            output['id'] = this.id
            output['monsterClassName'] = this.constructor.name
            output['monsterTypeLabel'] = this.mt?.label
            output['jumpPad'] = this.jumpPad
            output['jumpPadEffect'] = this.jumpPadEffect
            output['attackGroundX'] = this.attackGroundX
            output['attackGroundY'] = this.attackGroundY
            output['attackGroundDelay'] = this.attackGroundDelay
            return output
        }
    }
}
