import { MemoryHandler } from 'Utils/MemoryHandler'
import { createTimer, errorHandler } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { CombineHooks } from 'core/API/MecHookArray'
import { Timer } from 'w3ts'
import { registerSpawnedMonster, unregisterSpawnedMonster } from '../../../../globals'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { hooks } from '../../API/GeneralHooks'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Level } from '../Level/Level'
import { registerSpawnedUnitInChunks, unregisterSpawnedUnitFromChunks } from '../Monster/ContactChunks'
import { IssueMoveOrderForLongDistance, LongDistanceMoveOrder } from '../Monster/LongDistanceMoveOrder'
import { Monster } from '../Monster/Monster'
import { MONSTER_NEAR_DIFF_MAX } from '../Monster/MonsterArray'
import { MonsterType } from '../Monster/MonsterType'
import { NewImmobileMonster } from '../Monster/Monster_functions'
import { MECRegion, StartAndEndPoints } from '../Region/MECRegion'
import { initSimpleUnitRecycler } from './SimpleUnitRecycler'

export type MonsterDirectionMode = 'straight' | 'random'
type FixedSpawnOffset = number | 'auto' | undefined

const MAXIMUM_SPANWED_MONSTERS_SIMULTANEOUSLY = 500
const HIDE_REGION_DEBUG_COLOR = 'green'

const MonsterSpawn_Actions = errorHandler(() => {
    const monsterSpawn = MonsterSpawn.anyTrigId2MonsterSpawn.get(GetHandleId(Natives.UGetTriggeringTrigger()))

    if (!monsterSpawn?.monsters) {
        return
    }
    if (
        BlzGroupGetSize(monsterSpawn.monsters) + monsterSpawn.getSpawnAmount() >
        MAXIMUM_SPANWED_MONSTERS_SIMULTANEOUSLY
    ) {
        return
    }

    const mecRegion = monsterSpawn.getMecRegion()
    if (!mecRegion) {
        return
    }

    const unspawnTime = monsterSpawn.getTimedUnspawn()
    if (unspawnTime !== undefined) {
        const monsterSpeed = monsterSpawn.getMonsterType().getUnitMoveSpeed()
        monsterSpawn.setForcedDistance(monsterSpeed * (unspawnTime + 2)) // the 2s added to unspawn time are here to be sure that the monster will be unspawned before reaching the end of their movement
    }

    for (let spawnIndex = 0; spawnIndex < monsterSpawn.getSpawnAmount(); spawnIndex++) {
        monsterSpawn.setSpawnIndex(spawnIndex)

        const startAndEndPoints = mecRegion.generateStartAndEndPoints(monsterSpawn)

        const mobUnit = monsterSpawn.createMob(startAndEndPoints)

        if (mobUnit) {
            // Everywhere it can be touched, told once: it never leaves the line it is about to walk
            const walkEnd = clampWalkToSpawnRegion(
                mecRegion,
                startAndEndPoints.startX,
                startAndEndPoints.startY,
                startAndEndPoints.endX,
                startAndEndPoints.endY
            )

            registerSpawnedUnitInChunks(
                mobUnit,
                monsterSpawn.getMonsterType().getImmolationRadius(),
                startAndEndPoints.startX,
                startAndEndPoints.startY,
                walkEnd.x,
                walkEnd.y
            )

            // Make the unit move
            const moveOrder = IssueMoveOrderForLongDistance(
                mobUnit,
                startAndEndPoints.endX,
                startAndEndPoints.endY,
                false
            )
            if (moveOrder instanceof LongDistanceMoveOrder) {
                MonsterSpawn.anyMonsterUnitId2MoveOrder.set(GetHandleId(mobUnit), moveOrder)
            }

            const unspawnTime = monsterSpawn.getTimedUnspawn()
            if (unspawnTime !== undefined) {
                const unspawnTimer = CreateTimer()
                MonsterSpawn.anyTimedUnspawnTimerId2Unit.set(GetHandleId(unspawnTimer), mobUnit)
                MonsterSpawn.anyUnit2TimedUnspawnTimer.set(GetHandleId(mobUnit), unspawnTimer)
                TimerStart(unspawnTimer, unspawnTime, false, MonsterUnspawn)
            }

            if (startAndEndPoints.ephemeral) {
                MemoryHandler.destroyObject(startAndEndPoints)
            }
        }
    }
})

const MonsterUnspawn = errorHandler(() => {
    const unspawnTimer = GetExpiredTimer()
    if (!unspawnTimer) {
        return
    }

    const mobUnit = MonsterSpawn.anyTimedUnspawnTimerId2Unit.get(GetHandleId(unspawnTimer))

    if (mobUnit) {
        const monsterSpawn = MonsterSpawn.anyMonsterUnitId2MonsterSpawn.get(GetHandleId(mobUnit))
        monsterSpawn?.removeMonsterUnit(mobUnit)
    }
})

/**
 * How far past the zone a mob is allowed to be remembered walking. It is removed as it leaves, but
 * the zone is only watched every few frames, so it always gets a step or two further.
 */
const SPAWN_EXIT_MARGIN = Constants.LARGEUR_CASE

/** The end of the walk, reused for every mob rather than given back to the garbage collector */
const clampedEnd = { x: 0, y: 0 }

/**
 * The part of the line a mob was told to walk that it can really be found on. A mob is removed as
 * soon as it leaves the zone of its spawn, and the order it is given reaches well past it - by the
 * offset that guarantees it does leave, and by much more when a timed unspawn sends it towards a
 * point it never reaches.
 *
 * The zones are convex, so what stays inside is a single stretch: its far end is worth finding.
 */
const clampWalkToSpawnRegion = (mecRegion: MECRegion, startX: number, startY: number, endX: number, endY: number) => {
    clampedEnd.x = endX
    clampedEnd.y = endY

    if (mecRegion.areCoordsInRegion(endX, endY) || !mecRegion.areCoordsInRegion(startX, startY)) {
        return clampedEnd
    }

    const deltaX = endX - startX
    const deltaY = endY - startY
    let insideRatio = 0
    let outsideRatio = 1

    for (let i = 0; i < 12; i++) {
        const middleRatio = (insideRatio + outsideRatio) / 2

        if (mecRegion.areCoordsInRegion(startX + deltaX * middleRatio, startY + deltaY * middleRatio)) {
            insideRatio = middleRatio
        } else {
            outsideRatio = middleRatio
        }
    }

    const length = SquareRoot(deltaX * deltaX + deltaY * deltaY)
    const ratio = length > 0 ? RMinBJ(1, insideRatio + SPAWN_EXIT_MARGIN / length) : insideRatio

    clampedEnd.x = startX + deltaX * ratio
    clampedEnd.y = startY + deltaY * ratio

    return clampedEnd
}

const OnMonsterUnitLeavesSpawnRegion = function (this: any, monsterUnit: unit) {
    const monsterSpawn = MonsterSpawn.anyMonsterUnitId2MonsterSpawn.get(GetHandleId(monsterUnit))
    monsterSpawn?.removeMonsterUnit(monsterUnit)
}

const OnMonsterUnitEntersHideRegion = function (this: any, monsterUnit: unit) {
    ShowUnit(monsterUnit, false)
    UnitRemoveAbility(monsterUnit, FourCC('Aloc'))
}

const OnMonsterUnitLeavesHideRegion = function (this: any, monsterUnit: unit) {
    const monsterSpawn = MonsterSpawn.anyMonsterUnitId2MonsterSpawn.get(GetHandleId(monsterUnit))
    if (
        monsterSpawn?.getMecRegion()?.isUnitInRegion(monsterUnit) &&
        !monsterSpawn?.isUnitInAnyHideRegion(monsterUnit)
    ) {
        ShowUnit(monsterUnit, true)
        UnitAddAbility(monsterUnit, FourCC('Aloc'))
    }
}

/**
 * class MonsterSpawn
 */
export class MonsterSpawn {
    static anyTrigId2MonsterSpawn = new Map<number, MonsterSpawn>()
    static anyMonsterUnitId2MonsterSpawn = new Map<number, MonsterSpawn>()
    static anyMonsterUnitId2MoveOrder = new Map<number, LongDistanceMoveOrder>()

    static anyUnit2TimedUnspawnTimer = new Map<number, timer>()
    static anyTimedUnspawnTimerId2Unit = new Map<number, unit>()

    private static lastInstanceId = -1

    public static getNextId = () => {
        return ++MonsterSpawn.lastInstanceId
    }

    // Properties that determine the spawn behavior and should be saved
    private label: string
    private mt: MonsterType
    private mecRegion?: MECRegion
    private frequency: number
    private spawnAmount = 1
    private initialDelay = 0
    private timedUnspawn: number | undefined
    private monsterDirectionMode: MonsterDirectionMode
    private fixedSpawnOffset: FixedSpawnOffset
    private spawnOffset = 0
    private fixedSpawnOffsetBounce = false
    private fixedSpawnOffsetMirrored = false
    private hideRegions: { [x: number]: MECRegion } = MemoryHandler.getEmptyObject()

    // Properties for runtime use only
    private tSpawn?: trigger
    monsters?: group
    private lastSpawnVal: number | undefined
    private bouncing = false
    private mirrored = false
    private spawnIndex = 0
    private forcedDistance: number | undefined

    level?: Level
    id: number

    private initialDelayTimer: Timer | undefined

    private simpleUnitRecycler = initSimpleUnitRecycler()
    private _active = false

    constructor(
        label: string,
        mt: MonsterType,
        mecRegion: MECRegion,
        frequence: number,
        monsterDirectionMode: MonsterDirectionMode
    ) {
        this.monsterDirectionMode = monsterDirectionMode

        this.id = MonsterSpawn.getNextId()
        this.label = label
        this.mt = mt
        this.frequency = frequence
        this.setMECRegion(mecRegion)
    }

    getId() {
        return this.id
    }

    getLabel = (): string => {
        return this.label
    }

    getMonsterType = () => {
        return this.mt
    }

    getMecRegion = () => {
        return this.mecRegion
    }

    setMECRegion = (newMecRegion: MECRegion) => {
        this.mecRegion && this.mecRegion.destroy()
        this.mecRegion = newMecRegion
        this.mecRegion.onUnitLeaves(OnMonsterUnitLeavesSpawnRegion)
        this._active && this.refresh()
    }

    // remove monster unit without destroying it but just hiding it with the simpleUnitRecycler
    removeMonsterUnit(monsterUnit: unit) {
        this.monsters && GroupRemoveUnit(this.monsters, monsterUnit)

        this.mecRegion?.unwatchUnit(monsterUnit)
        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            hideRegion.unwatchUnit(monsterUnit)
        }

        UnitRemoveAbility(monsterUnit, FourCC('Aloc'))
        this.simpleUnitRecycler.removeUnit(monsterUnit)
        unregisterSpawnedMonster(monsterUnit)
        unregisterSpawnedUnitFromChunks(monsterUnit)

        const timer = MonsterSpawn.anyUnit2TimedUnspawnTimer.get(GetHandleId(monsterUnit))
        if (timer) {
            MonsterSpawn.anyTimedUnspawnTimerId2Unit.delete(GetHandleId(timer))
            MonsterSpawn.anyUnit2TimedUnspawnTimer.delete(GetHandleId(monsterUnit))
            DestroyTimer(timer)
        }
        MonsterSpawn.anyMonsterUnitId2MonsterSpawn.delete(GetHandleId(monsterUnit))

        const moveOrder = MonsterSpawn.anyMonsterUnitId2MoveOrder.get(GetHandleId(monsterUnit))
        if (moveOrder) {
            moveOrder.destroy()
            MonsterSpawn.anyMonsterUnitId2MoveOrder.delete(GetHandleId(monsterUnit))
        }
    }

    deactivate = () => {
        this._active = false
        this.initialDelayTimer?.pause().destroy()

        if (this.tSpawn) {
            DestroyTrigger(this.tSpawn)
            delete this.tSpawn
        }

        if (this.monsters) {
            ForGroup(this.monsters, () => {
                this.removeMonsterUnit(Natives.UGetEnumUnit())
            })
            DestroyGroup(this.monsters)
            delete this.monsters
        }

        this.mecRegion?.enableWatchUnits(false)
        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            hideRegion.enableWatchUnits(false)
        }
    }

    activate = () => {
        this._active = true
        this.monsters = Natives.UCreateGroup()

        this.initialDelayTimer = createTimer(this.initialDelay, false, () => {
            this.tSpawn = CreateTrigger()
            MonsterSpawn.anyTrigId2MonsterSpawn.set(GetHandleId(this.tSpawn), this)
            TriggerRegisterTimerEvent(this.tSpawn, 1 / this.frequency, true)
            TriggerAddAction(this.tSpawn, MonsterSpawn_Actions)
            this.initialDelayTimer?.pause().destroy()

            this.mecRegion?.enableWatchUnits(true)
            for (const [_, hideRegion] of pairs(this.hideRegions)) {
                hideRegion.enableWatchUnits(true)
            }
        })
    }

    isActive = () => {
        return this._active
    }

    destroy = () => {
        this.deactivate()
        this.level && this.level.monsterSpawns.removeMonsterSpawn(this.id)
        this.simpleUnitRecycler.destroy()
        this.mecRegion?.destroy()

        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            hideRegion.destroy()
        }
        MemoryHandler.destroyArray(this.hideRegions)
    }

    createMob = (startAndEndPoints: StartAndEndPoints) => {
        const spawnAngle = Rad2Deg(
            Math.atan2(
                startAndEndPoints.endY - startAndEndPoints.startY,
                startAndEndPoints.endX - startAndEndPoints.startX
            )
        )

        // hook onBeforeCreateMonsterUnit
        const hookArray = CombineHooks(
            this.level?.monsters.hooks_onBeforeCreateMonsterUnit,
            hooks.hooks_onBeforeCreateMonsterUnit
        )

        let forceUnitTypeId = 0
        if (!!hookArray) {
            let quit = false

            for (const hook of hookArray) {
                const unitData = MemoryHandler.getEmptyObject<{ mt: MonsterType }>()
                unitData.mt = this.mt
                const output = hook.execute(unitData)
                MemoryHandler.destroyObject(unitData)

                if (output === false) {
                    quit = true
                } else if (output && output.unitTypeId) {
                    forceUnitTypeId = output.unitTypeId
                }
            }

            if (quit) {
                MemoryHandler.destroyArray(hookArray)
                return
            }
        }
        MemoryHandler.destroyArray(hookArray)

        let monster = this.simpleUnitRecycler.getUnit()
        if (!monster) {
            if (forceUnitTypeId > 0) {
                Monster.forceUnitTypeIdForNextMonster = forceUnitTypeId
            }
            monster = NewImmobileMonster(this.mt, startAndEndPoints.startX, startAndEndPoints.startY, spawnAngle)
        } else {
            // todo the forceUnitTypeId should be taken into account and change the unit type of the existing unit without recreating it
            BlzSetUnitFacingEx(monster, spawnAngle)
            SetUnitPosition(monster, startAndEndPoints.startX, startAndEndPoints.startY)
            UnitAddAbility(monster, FourCC('Aloc'))
        }

        registerSpawnedMonster(monster, this.mt)
        if (this.monsters) {
            GroupAddUnit(this.monsters, monster)
            MonsterSpawn.anyMonsterUnitId2MonsterSpawn.set(GetHandleId(monster), this)

            if (this.timedUnspawn === undefined) {
                this.mecRegion?.watchUnit(monster, true)
            }

            for (const [_, hideRegion] of pairs(this.hideRegions)) {
                hideRegion.watchUnit(monster)
            }
        }

        //hook after create unit
        const hookArray2 = CombineHooks(
            this.level?.monsters.hooks_onAfterCreateMonsterUnit,
            hooks.hooks_onAfterCreateMonsterUnit
        )

        if (!!hookArray2) {
            for (const hook of hookArray2) {
                const unitData = MemoryHandler.getEmptyObject<{ mt: MonsterType; u: unit }>()
                unitData.mt = this.mt
                unitData.u = monster
                hook.execute(unitData)
                MemoryHandler.destroyObject(unitData)
            }
        }

        MemoryHandler.destroyArray(hookArray2)

        return monster
    }

    addHideRegion(mecRegion: MECRegion) {
        mecRegion.setDefaultDebugLineColor(HIDE_REGION_DEBUG_COLOR)
        this.hideRegions[mecRegion.getId()] = mecRegion
        this.addHideRegionCallbacks(mecRegion)
        this.activateHideRegion(mecRegion)
    }

    removeHideRegion(mecRegion: MECRegion, destroyRegion = true) {
        if (!this.hideRegions[mecRegion.getId()]) {
            return
        }

        delete this.hideRegions[mecRegion.getId()]

        if (destroyRegion) {
            mecRegion.destroy()
        } else {
            mecRegion.disable()
        }
    }

    removeAllHideRegions(destroyRegions = true) {
        for (const [regionId, hideRegion] of pairs(this.hideRegions)) {
            this.removeHideRegion(hideRegion, destroyRegions)
            delete this.hideRegions[regionId]
        }
    }

    addHideRegionCallbacks(mecRegion: MECRegion) {
        mecRegion.onUnitEnters(OnMonsterUnitEntersHideRegion)
        mecRegion.onUnitLeaves(OnMonsterUnitLeavesHideRegion)
    }

    isUnitInAnyHideRegion(monsterUnit: unit): boolean {
        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            if (hideRegion.isUnitInRegion(monsterUnit)) {
                return true
            }
        }
        return false
    }

    activateHideRegion(mecRegion: MECRegion) {
        if (!this.isActive() || !this.monsters) {
            return
        }

        ForGroup(this.monsters, () => {
            const monsterUnit = Natives.UGetEnumUnit()
            mecRegion.watchUnit(monsterUnit, true)
        })

        mecRegion.enableWatchUnits(true)
    }

    debugHideRegions(enable: boolean) {
        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            hideRegion.debugRects(enable)
        }
    }

    getMostLittleHideRegionAtPosition(x: number, y: number): MECRegion | null {
        let mostLittleHideRegion: MECRegion | null = null
        let mostLittleArea = -1

        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            if (hideRegion.areCoordsInRegion(x, y)) {
                const area = hideRegion.getArea()
                if (mostLittleArea === -1 || area < mostLittleArea) {
                    mostLittleHideRegion = hideRegion
                    mostLittleArea = area
                }
            }
        }

        return mostLittleHideRegion
    }

    setLabel = (newLabel: string) => {
        this.label = newLabel
    }

    setMonsterType = (mt: MonsterType) => {
        this.mt = mt
        this._active && this.refresh()
    }

    setFrequence = (frequence: number) => {
        this.frequency = frequence
        this.tSpawn && DestroyTrigger(this.tSpawn)
        this.tSpawn = CreateTrigger()
        MonsterSpawn.anyTrigId2MonsterSpawn.set(GetHandleId(this.tSpawn), this)
        TriggerRegisterTimerEvent(this.tSpawn, 1 / this.frequency, true)
        TriggerAddAction(this.tSpawn, MonsterSpawn_Actions)
    }

    setMonsterDirectionMode(mode: MonsterDirectionMode) {
        this.monsterDirectionMode = mode
    }

    getMonsterDirectionMode() {
        return this.monsterDirectionMode
    }

    toText = (detailled = false): string => {
        let text =
            udg_colorCode[Constants.RED] +
            this.label +
            udg_colorCode[Constants.GREY] +
            ' : monster(' +
            this.mt.label +
            ') zone(' +
            this.mecRegion?.toText(detailled) +
            ') freq(' +
            R2S(this.frequency) +
            ')'

        if (this.spawnAmount !== 1) {
            text = text + ' spawnAmount(' + this.spawnAmount + ')'
        }

        if (detailled) {
            text += '\n    '
            if (this.initialDelay !== 0) {
                text = text + ' initialDelay(' + R2S(this.initialDelay) + 's)'
            }
            if (this.timedUnspawn !== undefined) {
                text = text + ' unspawn(' + R2S(this.timedUnspawn) + 's)'
            }
            text += ' dirMode(' + this.monsterDirectionMode + ')'
            if (this.fixedSpawnOffset !== undefined) {
                text = text + ' fixedSpawnOffset(' + this.fixedSpawnOffset + ')'
            }
            if (this.spawnOffset !== 0) {
                text = text + ' spawnOffset(' + this.spawnOffset + ')'
            }
            if (this.fixedSpawnOffsetBounce) {
                text = text + ' boucing'
            }
            if (this.fixedSpawnOffsetMirrored) {
                text = text + ' mirroring'
            }
        }

        return text
    }

    displayForPlayer = (p: player, detailled = false) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText(detailled))
    }

    getForcedDistance = () => this.forcedDistance
    setForcedDistance = (forcedDistance: number) => {
        this.forcedDistance = forcedDistance
    }
    getSpawnAmount = () => this.spawnAmount
    setSpawnAmount = (spawnAmount: number) => {
        this.spawnAmount = spawnAmount
    }

    getSpawnOffset = () => this.spawnOffset
    setSpawnOffset = (spawnOffset: number) => {
        this.spawnOffset = spawnOffset
    }

    getInitialDelay = () => this.initialDelay
    setInitialDelay = (initialDelay: number) => {
        this.initialDelay = initialDelay
    }

    getFixedSpawnOffset = () => this.fixedSpawnOffset
    setFixedSpawnOffset = (fixedSpawnOffset: FixedSpawnOffset) => {
        this.fixedSpawnOffset = fixedSpawnOffset
    }

    getFixedSpawnOffsetBounce = () => this.fixedSpawnOffsetBounce
    setFixedSpawnOffsetBounce = (fixedSpawnOffsetBounce: boolean) => {
        this.fixedSpawnOffsetBounce = fixedSpawnOffsetBounce
    }

    getFixedSpawnOffsetMirrored = () => this.fixedSpawnOffsetMirrored
    setFixedSpawnOffsetMirrored = (fixedSpawnOffsetMirrored: boolean) => {
        this.fixedSpawnOffsetMirrored = fixedSpawnOffsetMirrored
    }

    getTimedUnspawn = () => this.timedUnspawn
    setTimedUnspawn = (timedUnspawn: number | undefined) => {
        this.timedUnspawn = timedUnspawn
        this.mecRegion?.setIsLeaveZoneEnabled(timedUnspawn === undefined)
        this._active && this.refresh()
    }

    getLastSpawnVal = () => {
        return this.lastSpawnVal
    }
    setLastSpawnVal = (lastSpawnVal: number) => {
        this.lastSpawnVal = lastSpawnVal
    }
    getBouncing = () => {
        return this.bouncing
    }
    setBouncing = (bouncing: boolean) => {
        this.bouncing = bouncing
    }
    getMirrored = () => {
        return this.mirrored
    }
    setMirrored = (mirrored: boolean) => {
        this.mirrored = mirrored
    }
    getSpawnIndex(): number {
        return this.spawnIndex
    }
    setSpawnIndex(value: number) {
        this.spawnIndex = value
    }

    refresh = () => {
        this.deactivate()
        this.simpleUnitRecycler.reinit()
        this.activate()
    }

    getActiveMonsterUnitNear = (x: number, y: number): unit | null => {
        if (!this.monsters) {
            return null
        }

        let foundUnit: unit | null = null
        ForGroup(this.monsters, () => {
            if (foundUnit) return

            const monsterUnit = Natives.UGetEnumUnit()
            if (IsUnitHidden(monsterUnit)) return

            const xMob = GetUnitX(monsterUnit)
            const yMob = GetUnitY(monsterUnit)

            if (RAbsBJ(x - xMob) < MONSTER_NEAR_DIFF_MAX && RAbsBJ(y - yMob) < MONSTER_NEAR_DIFF_MAX) {
                foundUnit = monsterUnit
            }
        })

        return foundUnit
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['label'] = this.label
        output['monsterTypeLabel'] = this.mt.label
        output['mecRegion'] = this.mecRegion?.toJson()
        output['frequency'] = this.frequency
        output['spawnAmount'] = this.spawnAmount
        output['initialDelay'] = this.initialDelay
        output['timedUnspawn'] = this.timedUnspawn
        output['monsterDirectionMode'] = this.monsterDirectionMode
        output['fixedSpawnOffset'] = this.fixedSpawnOffset
        output['spawnOffset'] = this.spawnOffset
        output['fixedSpawnOffsetBounce'] = this.fixedSpawnOffsetBounce
        output['fixedSpawnOffsetMirrored'] = this.fixedSpawnOffsetMirrored

        const hideRegionsJson: any = []
        for (const [_, hideRegion] of pairs(this.hideRegions)) {
            arrayPush(hideRegionsJson, hideRegion.toJson())
        }
        output['hideRegions'] = hideRegionsJson

        return output
    }
}
