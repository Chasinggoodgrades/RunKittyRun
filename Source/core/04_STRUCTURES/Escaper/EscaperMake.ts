import { getUdgLevels } from '../../../../globals'
import { createTimer } from '../../../Utils/mapUtils'
import { StopUnit } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { Text } from '../../01_libraries/Text'
import { Make } from '../../05_MAKE_STRUCTURES/Make/Make'
import { MakePropertyChange } from '../../05_MAKE_STRUCTURES/Make/MakePropertyChange'
import { MakeCopyLevelPatrol } from '../../05_MAKE_STRUCTURES/Make_copy_paste/MakeCopyLevelPatrol'
import { MakeCaster } from '../../05_MAKE_STRUCTURES/Make_create_casters/MakeCaster'
import { MakeMeteor } from '../../05_MAKE_STRUCTURES/Make_create_meteors/MakeMeteor'
import { MakeMonsterMultiplePatrols } from '../../05_MAKE_STRUCTURES/Make_create_monsters/MakeMonsterMultiplePatrols'
import { MakeMonsterNoMove } from '../../05_MAKE_STRUCTURES/Make_create_monsters/MakeMonsterNoMove'
import { MakeMonsterSimplePatrol } from '../../05_MAKE_STRUCTURES/Make_create_monsters/MakeMonsterSimplePatrol'
import { MakeMonsterTeleport } from '../../05_MAKE_STRUCTURES/Make_create_monsters/MakeMonsterTeleport'
import { MakeDebugMECRegion } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeDebugMECRegion'
import { MakeGetRegion } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeGetRegion'
import { MakeMECRegionMode } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeMECRegion'
import { MakeMoveRegionPoint } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeMoveRegionPoint'
import { MakeRegion } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeRegion'
import { MakeDeleteStaticSlide } from '../../05_MAKE_STRUCTURES/Make_create_static_slide/MakeDeleteStaticSlide'
import { MakeStaticSlide } from '../../05_MAKE_STRUCTURES/Make_create_static_slide/MakeStaticSlide'
import { MakeStaticSlideInfo } from '../../05_MAKE_STRUCTURES/Make_create_static_slide/MakeStaticSlideInfo'
import { MakeDeleteCasters } from '../../05_MAKE_STRUCTURES/Make_delete_casters/MakeDeleteCasters'
import { MakeDeleteMeteors } from '../../05_MAKE_STRUCTURES/Make_delete_meteors/MakeDeleteMeteors'
import { MakeDeleteMonsters } from '../../05_MAKE_STRUCTURES/Make_delete_monsters/MakeDeleteMonsters'
import { MakeExchangeTerrains } from '../../05_MAKE_STRUCTURES/Make_exchange_terrains/MakeExchangeTerrains'
import { MakeGetMonsterInfo } from '../../05_MAKE_STRUCTURES/Make_get_info/MakeGetMonsterInfo'
import { MakeGetTerrainType } from '../../05_MAKE_STRUCTURES/Make_get_info/MakeGetTerrainType'
import { MakeCircleMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeCircleMob'
import { MakeClearMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeClearMob'
import { MakeDeleteCircleMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeDeleteCircleMob'
import { MakeDeleteClearMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeDeleteClearMob'
import { MakeDeletePortalMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeDeletePortalMob'
import { MakeMonsterAttackGroundOrder } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeMonsterAttackGroundOrder'
import { MakePortalMob } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakePortalMob'
import { MakeSetBlockMobEffect } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeSetBlockMobEffect'
import { MakeSetClearMobEffect } from '../../05_MAKE_STRUCTURES/Make_monster_properties/MakeSetClearMobEffect'
import { MakeMonsterSpawn, MakeMonsterSpawnKind } from '../../05_MAKE_STRUCTURES/Make_monster_spawn/MakeMonsterSpawn'
import { MakeMonsterSpawnHideRegion } from '../../05_MAKE_STRUCTURES/Make_monster_spawn/MakeMonsterSpawnHideRegion'
import { MakeMonsterSpawnRemoveHideRegion } from '../../05_MAKE_STRUCTURES/Make_monster_spawn/MakeMonsterSpawnRemoveHideRegion'
import { MakeSetMonsterSpawnZone } from '../../05_MAKE_STRUCTURES/Make_monster_spawn/MakeSetMonsterSpawnZone'
import { MakeGetUnitTeleportPeriod } from '../../05_MAKE_STRUCTURES/Make_set_unit_properties/MakeGetUnitTeleportPeriod'
import { MakeSetUnitMonsterType } from '../../05_MAKE_STRUCTURES/Make_set_unit_properties/MakeSetUnitMonsterType'
import { MakeSetUnitTeleportPeriod } from '../../05_MAKE_STRUCTURES/Make_set_unit_properties/MakeSetUnitTeleportPeriod'
import { MakeEnd } from '../../05_MAKE_STRUCTURES/Make_start_end_visibilityModifier/MakeEnd'
import { MakeStart } from '../../05_MAKE_STRUCTURES/Make_start_end_visibilityModifier/MakeStart'
import { MakeTpForEnd } from '../../05_MAKE_STRUCTURES/Make_start_end_visibilityModifier/MakeTpForEnd'
import { MakeVisibilityModifier } from '../../05_MAKE_STRUCTURES/Make_start_end_visibilityModifier/MakeVisibilityModifier'
import { MakeTerrainCopyPaste } from '../../05_MAKE_STRUCTURES/Make_terrain/MakeTerrainCopyPaste'
import { MakeTerrainCreate } from '../../05_MAKE_STRUCTURES/Make_terrain/MakeTerrainCreate'
import { MakeTerrainCreateBrush } from '../../05_MAKE_STRUCTURES/Make_terrain/MakeTerrainCreateBrush'
import { MakeTerrainHorizontalSymmetry } from '../../05_MAKE_STRUCTURES/Make_terrain/MakeTerrainHorizontalSymmetry'
import { MakeTerrainVerticalSymmetry } from '../../05_MAKE_STRUCTURES/Make_terrain/MakeTerrainVerticalSymmetry'
import { MakeTerrainHeight } from '../../05_MAKE_STRUCTURES/Make_terrain_height/MakeTerrainHeight'
import { MakeSelectMonsterForEvent } from '../../05_MAKE_STRUCTURES/Make_terrain_save/MakeSelectMonsterForEvent'
import { MakeTerrainSaveZone } from '../../05_MAKE_STRUCTURES/Make_terrain_save/MakeTerrainSaveZone'
import { MakeUpdateTerrainSaveZone } from '../../05_MAKE_STRUCTURES/Make_terrain_save/MakeUpdateTerrainSaveZone'
import { MakeAction } from '../../05_MAKE_STRUCTURES/MakeLastActions/MakeAction'
import { MakeLastActions } from '../../05_MAKE_STRUCTURES/MakeLastActions/MakeLastActions'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { CasterType } from '../Caster/CasterType'
import { Level } from '../Level/Level'
import { IsLevelBeingMade } from '../Level/Level_functions'
import { MonsterType } from '../Monster/MonsterType'
import { MonsterSpawn } from '../MonsterSpawn/MonsterSpawn'
import { HorizontalRegionDirection } from '../Region/HorizontalRectangleRegion'
import type { TerrainSave } from '../TerrainSave/TerrainSave'
import type { TerrainType } from '../TerrainType/TerrainType'
import { Escaper } from './Escaper'
import { GetMirrorEscaper } from './Escaper_functions'

export abstract class EscaperMake {
    private make?: Make
    private makeLastActions: MakeLastActions
    private makingLevel?: Level

    protected hero?: unit
    protected p: player
    protected escaperId: number
    protected readonly playerId: number

    protected constructor(escaperId: number) {
        this.playerId = escaperId >= Constants.NB_PLAYERS_MAX ? escaperId - 12 : escaperId
        this.escaperId = escaperId
        this.p = Natives.UPlayer(this.playerId)
        this.makeLastActions = new MakeLastActions(this as unknown as Escaper)
    }

    isEscaperSecondary = () => {
        return this.escaperId >= Constants.NB_PLAYERS_MAX
    }

    getMake = () => {
        return this.make
    }

    destroyMakeIfForSpecificLevel = () => {
        if (this.make && this.make.forSpecificLevel) {
            this.destroyMake()
        }
    }

    setMakingLevel(level: Level | null) {
        if (this.makingLevel == level) {
            return false
        }

        const oldMakingLevel = this.makingLevel
        this.destroyMakeIfForSpecificLevel()

        delete this.makingLevel

        if (oldMakingLevel && !IsLevelBeingMade(oldMakingLevel)) {
            oldMakingLevel.activate(false)
        }

        if (level) {
            Level.earningLivesActivated = false
            level && level.activate(true)
            Level.earningLivesActivated = true
            this.makingLevel = level
        }

        getUdgLevels().refreshVisibilities()

        return true
    }

    getMakingLevel(): Level {
        if (this.makingLevel) {
            return this.makingLevel
        } else {
            return getUdgLevels().getCurrentLevel()
        }
    }

    isMakingCurrentLevel = () => {
        return !!this.makingLevel
    }

    destroyMake = () => {
        if (!this.make) {
            return false
        }

        this.make && this.make.destroy()
        delete this.make

        if (!this.isEscaperSecondary()) {
            createTimer(0, false, () => {
                //prevent secondary hero from moving at end of make
                const hero = GetMirrorEscaper(this as unknown as Escaper)?.getHero()
                if (hero) {
                    StopUnit(hero)
                }
            })
        }

        return true
    }

    cancelLastAction = () => {
        if (this.make) {
            if (this.make.cancelLastAction()) {
                return true
            }
        }
        return this.makeLastActions.cancelLastAction()
    }

    redoLastAction = () => {
        if (this.makeLastActions.redoLastAction()) {
            return true
        }
        if (this.make) {
            return this.make.redoLastAction()
        }
        return false
    }

    deleteSpecificActionsForLevel(level: Level) {
        this.makeLastActions.deleteSpecificActionsForLevel(level)
    }

    newAction(action: MakeAction) {
        return this.makeLastActions.newAction(action)
    }

    destroyCancelledActions = () => {
        this.makeLastActions.destroyCancelledActions()
    }

    protected destroyMakeLastActions() {
        this.makeLastActions.destroy()
    }

    makeCreateNoMoveMonsters(mt: MonsterType, facingAngle: number) {
        //mode : noMove
        this.destroyMake()
        if (this.hero) this.make = new MakeMonsterNoMove(this.hero, mt, facingAngle)
    }

    makeCreateSimplePatrolMonsters(mode: string, mt: MonsterType, angle?: number) {
        this.destroyMake()
        //modes : normal, string, auto
        if (mode == 'normal' || mode == 'string' || mode == 'auto') {
            if (this.hero) this.make = new MakeMonsterSimplePatrol(this.hero, mode, mt, angle)
        }
    }

    makeCreateMultiplePatrolsMonsters(mode: string, mt: MonsterType) {
        this.destroyMake()
        //modes : normal, string
        if (mode == 'normal' || mode == 'string') {
            if (this.hero) this.make = new MakeMonsterMultiplePatrols(this.hero, mode, mt)
        }
    }

    makeCreateTeleportMonsters(mode: string, mt: MonsterType, period: number, angle: number) {
        this.destroyMake()
        //modes : normal, string
        if (mode == 'normal' || mode == 'string') {
            if (this.hero) this.make = new MakeMonsterTeleport(this.hero, mode, mt, period, angle)
        }
    }

    makeMmpOrMtNext = () => {
        if (!this.make) {
            return false
        }

        if (this.make instanceof MakeMonsterMultiplePatrols || this.make instanceof MakeMonsterTeleport) {
            this.make.nextMonster()
        } else {
            return false
        }

        return true
    }

    makeMonsterTeleportWait = () => {
        if (!this.make || !(this.make instanceof MakeMonsterTeleport)) {
            return false
        }
        return this.make.addWaitPeriod()
    }

    makeMonsterTeleportHide = () => {
        if (!this.make || !(this.make instanceof MakeMonsterTeleport)) {
            return false
        }
        return this.make.addHidePeriod()
    }

    makeCreateMonsterSpawn(
        label: string,
        mt: MonsterType,
        kind: MakeMonsterSpawnKind,
        frequency: number,
        monsterDirectionMode: 'straight' | 'random'
    ) {
        this.destroyMake()
        if (this.hero) {
            const makeMonsterSpawn = new MakeMonsterSpawn(this.hero, label, mt, kind, frequency, monsterDirectionMode)
            this.make = makeMonsterSpawn
            return makeMonsterSpawn
        }

        return null
    }

    makeSetMonsterSpawnZone(monsterSpawn: MonsterSpawn, kind: MakeMonsterSpawnKind) {
        this.destroyMake()
        if (this.hero) {
            const makeSetMonsterSpawnZone = new MakeSetMonsterSpawnZone(this.hero, monsterSpawn, kind)
            this.make = makeSetMonsterSpawnZone
            return makeSetMonsterSpawnZone
        }

        return null
    }

    makeMonsterSpawnHideRegion(monsterSpawn: MonsterSpawn, mecRegionMode: MakeMECRegionMode) {
        this.destroyMake()
        if (this.hero) {
            const makeMonsterSpawnHideRegion = new MakeMonsterSpawnHideRegion(this.hero, monsterSpawn, mecRegionMode)
            this.make = makeMonsterSpawnHideRegion
            return makeMonsterSpawnHideRegion
        }

        return null
    }

    makeSaveTerrainZone(label: string, level: Level | null) {
        this.destroyMake()
        if (this.hero) {
            const makeTerrainSaveZone = new MakeTerrainSaveZone(this.hero, label, level)
            this.make = makeTerrainSaveZone
            return makeTerrainSaveZone
        }

        return null
    }

    makeUpdateTerrainSaveZone(terrainSave: TerrainSave) {
        this.destroyMake()
        if (this.hero) {
            const makeUpdateTerrainSaveZone = new MakeUpdateTerrainSaveZone(this.hero, terrainSave)
            this.make = makeUpdateTerrainSaveZone
            return makeUpdateTerrainSaveZone
        }

        return null
    }

    makeSelectMonsterForEvent(onSelected: (this: void, monsterId: number) => void) {
        this.destroyMake()
        if (this.hero) {
            const makeSelectMonsterForEvent = new MakeSelectMonsterForEvent(this.hero, onSelected)
            this.make = makeSelectMonsterForEvent
            return makeSelectMonsterForEvent
        }

        return null
    }

    makeCreateRegion(label: string) {
        this.destroyMake()
        if (this.hero) this.make = new MakeRegion(this.hero, label)
    }

    makeGetRegionAtPoint = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeGetRegion(this.hero)
    }

    makeMoveRegionPoint = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeMoveRegionPoint(this.hero)
    }

    makeCopyLevelPatrol = (targetLevel: Level, mode: string) => {
        this.destroyMake()
        if (this.hero) this.make = new MakeCopyLevelPatrol(this.hero, mode, targetLevel)
    }

    makeDeleteMonsters(mode: string) {
        this.destroyMake()

        try {
            if (this.hero) this.make = new MakeDeleteMonsters(this.hero, mode)
        } catch (error) {
            if (typeof error == 'string') {
                Text.erP(this.p, error)
            }
        }
    }

    makeSetUnitTeleportPeriod(mode: string, period: number) {
        this.destroyMake()

        try {
            if (this.hero) this.make = new MakeSetUnitTeleportPeriod(this.hero, mode, period)
        } catch (error) {
            if (typeof error == 'string') {
                Text.erP(this.p, error)
            }
        }
    }

    makeGetUnitTeleportPeriod = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeGetUnitTeleportPeriod(this.hero)
    }

    makeSetUnitMonsterType(mode: string, mt: MonsterType) {
        this.destroyMake()

        try {
            if (this.hero) this.make = new MakeSetUnitMonsterType(this.hero, mode, mt)
        } catch (error) {
            if (typeof error == 'string') {
                Text.erP(this.p, error)
            }
        }
    }

    makeCreateMeteor = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeMeteor(this.hero)
    }

    makeDeleteMeteors(mode: string) {
        this.destroyMake()

        try {
            if (this.hero) this.make = new MakeDeleteMeteors(this.hero, mode)
        } catch (error) {
            if (typeof error == 'string') {
                Text.erP(this.p, error)
            }
        }
    }

    makeCreateCaster(casterType: CasterType, angle: number) {
        this.destroyMake()
        if (this.hero) this.make = new MakeCaster(this.hero, casterType, angle)
    }

    makeDeleteCasters(mode: string) {
        this.destroyMake()

        try {
            if (this.hero) this.make = new MakeDeleteCasters(this.hero, mode)
        } catch (error) {
            if (typeof error == 'string') {
                Text.erP(this.p, error)
            }
        }
    }

    makeCreateClearMobs(disableDuration: number) {
        this.destroyMake()
        if (this.hero) this.make = new MakeClearMob(this.hero, disableDuration)
    }

    makeDeleteClearMobs = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeDeleteClearMob(this.hero)
    }

    makeSetClearMobEffect = (effectPath: string) => {
        this.destroyMake()
        if (this.hero) this.make = new MakeSetClearMobEffect(this.hero, effectPath)
    }

    makeSetBlockMobEffect = (effectPath: string) => {
        this.destroyMake()
        if (this.hero) this.make = new MakeSetBlockMobEffect(this.hero, effectPath)
    }

    makeSetClearMobDisableDuration(disableDuration: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'disableDuration',
                disableDuration,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getClearMob(),
                clearMob => clearMob.getDisableDuration(),
                (clearMob, disableDuration) => clearMob.setDisableDuration(disableDuration)
            )
        }
    }

    makeCreatePortalMobs(freezeDuration: number, portalEffect: string | null, portalEffectDuration: number | null) {
        this.destroyMake()
        if (this.hero) this.make = new MakePortalMob(this.hero, freezeDuration, portalEffect, portalEffectDuration)
    }

    makeDeletePortalMobs = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeDeletePortalMob(this.hero)
    }

    makeCreateCircleMob(
        speed: number | null,
        direction: 'cw' | 'ccw' | null,
        facing: 'cw' | 'ccw' | 'in' | 'out' | null,
        radius: number | null
    ) {
        this.destroyMake()
        if (this.hero) this.make = new MakeCircleMob(this.hero, speed, direction, facing, radius)
    }

    makeDeleteCircleMob = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeDeleteCircleMob(this.hero)
    }

    makeCreateStaticSlide(angle: number, speed: number) {
        this.destroyMake()
        if (this.hero) this.make = new MakeStaticSlide(this.hero, angle, speed)
    }

    makeDeleteStaticSlide = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeDeleteStaticSlide(this.hero)
    }

    makeStaticSlideInfo = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeStaticSlideInfo(this.hero)
    }

    makeSetPortalMobFreezeDuration(freezeDuration: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'freezeDuration',
                freezeDuration,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getPortalMob(),
                monster => monster.getFreezeDuration(),
                (monster, freezeDuration) => monster.setFreezeDuration(freezeDuration)
            )
        }
    }

    makeSetPortalMobPortalEffect(portalEffect: string | null) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'portalEffect',
                portalEffect,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getPortalMob(),
                monster => monster.getPortalEffect(),
                (monster, portalEffect) => monster.setPortalEffect(portalEffect)
            )
        }
    }

    makeSetPortalMobPortalEffectDuration(portalEffectDuration: number | null) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'portalEffectDuration',
                portalEffectDuration,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getPortalMob(),
                monster => monster.getPortalEffectDuration(),
                (monster, portalEffectDuration) => monster.setPortalEffectDuration(portalEffectDuration)
            )
        }
    }

    makeSetCircleMobSpeed(speed: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'speed',
                speed,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getSpeed(),
                (monster, speed) => monster.setSpeed(speed)
            )
        }
    }

    makeSetCircleMobDirection(direction: 'cw' | 'ccw') {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'direction',
                direction,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getDirection(),
                (monster, direction) => monster.setDirection(direction)
            )
        }
    }

    makeSetCircleMobFacing(facing: 'cw' | 'ccw' | 'in' | 'out') {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'facing',
                facing,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getFacing(),
                (monster, facing) => monster.setFacing(facing)
            )
        }
    }

    makeSetCircleMobShape(shape: 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'octagon' | 'eight') {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'shape',
                shape,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getShape(),
                (monster, shape) => monster.setShape(shape)
            )
        }
    }

    makeSetCircleMobInitialAngle(initialAngle: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'initialAngle',
                initialAngle,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getInitialAngle(),
                (monster, initialAngle) => monster.setInitialAngle(initialAngle)
            )
        }
    }

    makeSetCircleMobRadius(radius: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'radius',
                radius,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y)?.getCircleMob(),
                monster => monster.getRadius(),
                (monster, radius) => monster.setRadius(radius)
            )
        }
    }

    makeSetStaticSlideSpeed(speed: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'speed',
                speed,
                (x, y) => this.getMakingLevel().staticSlides.getStaticSlideFromPoint(x, y),
                staticSlide => staticSlide.getSpeed(),
                (staticSlide, speed) => staticSlide.setSpeed(speed)
            )
        }
    }

    makeSetStaticSlideAngle(angle: number) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'angle',
                angle,
                (x, y) => this.getMakingLevel().staticSlides.getStaticSlideFromPoint(x, y),
                staticSlide => staticSlide.getAngle(),
                (staticSlide, angle) => staticSlide.setAngle(angle)
            )
        }
    }

    makeSetStaticSlideCanTurnAngle(canTurnAngle: number | undefined) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'canTurnAngle',
                canTurnAngle,
                (x, y) => this.getMakingLevel().staticSlides.getStaticSlideFromPoint(x, y),
                staticSlide => staticSlide.getCanTurnAngle(),
                (staticSlide, canTurnAngle) => staticSlide.setCanTurnAngle(canTurnAngle)
            )
        }
    }

    makeSetMonsterJumpPad(jumpPad: number | undefined) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'jumpPad',
                jumpPad,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y),
                monster => monster.getJumpPad(),
                (monster, jumpPad) => monster.setJumpPad(jumpPad)
            )
        }
    }

    makeSetMonsterJumpPadEffect(jumpPadEffect: string | undefined) {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakePropertyChange(
                this.hero,
                'jumpPadEffect',
                jumpPadEffect,
                (x, y) => this.getMakingLevel().monsters.getMonsterNear(x, y),
                monster => monster.getJumpPadEffect(),
                (monster, jumpPadEffect) => monster.setJumpPadEffect(jumpPadEffect)
            )
        }
    }

    makeSetMonsterAttackGroundOrder(delay: number = 0) {
        this.destroyMake()
        if (this.hero) this.make = new MakeMonsterAttackGroundOrder(this.hero, delay)
    }

    makeCreateTerrain(terrainType: TerrainType) {
        this.destroyMake()
        if (this.hero) this.make = new MakeTerrainCreate(this.hero, terrainType)
    }

    makeCreateTerrainBrush(terrainType: TerrainType, brushSize: number, shape: 'square' | 'circle' = 'square') {
        this.destroyMake()
        this.make = new MakeTerrainCreateBrush(this as unknown as Escaper, terrainType, brushSize, shape)
    }

    makeTerrainCopyPaste = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeTerrainCopyPaste(this.hero)
    }

    makeTerrainVerticalSymmetry = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeTerrainVerticalSymmetry(this.hero)
    }

    makeTerrainHorizontalSymmetry = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeTerrainHorizontalSymmetry(this.hero)
    }

    makeTerrainHeight(radius: number, height: number) {
        this.destroyMake()
        if (this.hero) this.make = new MakeTerrainHeight(this.hero, radius, height)
    }

    makeGetTerrainType = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeGetTerrainType(this.hero)
    }

    makeGetMonsterInfo = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeGetMonsterInfo(this.hero)
    }

    makeExchangeTerrains = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeExchangeTerrains(this.hero)
    }

    makeCreateStart(forNext: boolean, facing?: number) {
        this.destroyMake()
        if (this.hero) this.make = new MakeStart(this.hero, forNext, facing)
    }

    makeCreateEnd = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeEnd(this.hero)
    }

    makeCreateTpForEnd = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeTpForEnd(this.hero)
    }

    makeCreateVisibilityModifier = () => {
        this.destroyMake()
        if (this.hero) this.make = new MakeVisibilityModifier(this.hero)
    }

    makeCreateDebugMECRegions = (mode: MakeMECRegionMode, directionForHorizontal: HorizontalRegionDirection = 'up') => {
        this.destroyMake()
        if (this.hero) this.make = new MakeDebugMECRegion(this.hero, mode, directionForHorizontal)
    }

    makeMonsterSpawnRemoveHideRegion = (monsterSpawn: MonsterSpawn) => {
        this.destroyMake()
        if (this.hero) {
            this.make = new MakeMonsterSpawnRemoveHideRegion(this.hero, monsterSpawn)
        }
    }
}
