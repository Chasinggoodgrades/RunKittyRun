import { ServiceManager } from 'Services'
import { IDestroyable, MemoryHandler } from 'Utils/MemoryHandler'
import { SlideAfterDarkUtils } from 'Utils/SlideAfterDarkUtils'
import { ThemeUtils } from 'Utils/ThemeUtils'
import { createTimer } from 'Utils/mapUtils'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import { hooks } from 'core/API/GeneralHooks'
import { Timer } from 'w3ts'
import { getUdgEscapers, getUdgLevels, getUdgTerrainTypes } from '../../../../globals'
import { DefineDrawLineType, DrawLine } from '../../01_libraries/Draw_lines'
import { createDiagonalRegions } from '../../01_libraries/Regions_functions'
import { ChangeTerrainType } from '../../07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { MecHookArray } from '../../API/MecHookArray'
import type { CasterType } from '../Caster/CasterType'
import type { Escaper } from '../Escaper/Escaper'
import { MeteorArray } from '../Meteor/MeteorArray'
import { MonsterArray } from '../Monster/MonsterArray'
import { MonsterMultiplePatrols } from '../Monster/MonsterMultiplePatrols'
import { MonsterNoMove } from '../Monster/MonsterNoMove'
import { MonsterSimplePatrol } from '../Monster/MonsterSimplePatrol'
import type { MonsterType } from '../Monster/MonsterType'
import { MonsterSpawnArray } from '../MonsterSpawn/MonsterSpawnArray'
import { CircleMobArray } from '../Monster_properties/CircleMobArray'
import { ClearMobArray } from '../Monster_properties/ClearMobArray'
import { PortalMobArray } from '../Monster_properties/PortalMobArray'
import { RegionArray } from '../Region/RegionArray'
import { End, Start, TpForEnd } from './StartAndEnd'
import { StaticSlideArray } from './StaticSlideArray'
import { TriggerArray } from './Triggers'
import type { VisibilityModifier } from './VisibilityModifier'
import { VisibilityModifierArray } from './VisibilityModifierArray'
import { checkPointReviveHeroes } from './checkpointReviveHeroes_function'

type ITempTerrainTypeMap = {
    [x_y: string]:
        | ({
              x?: number
              y?: number
              terrainTypeId?: number
              effectOnShow?: effect
              effectOnHide?: effect
              tempTerrainTimer?: Timer
          } & IDestroyable)
        | null
}

export class Level {
    public static earningLivesActivated = true

    private isActivatedB: boolean
    private startMessage: string
    private livesEarnedAtBeginning: number
    private start?: Start
    private end?: End
    private tpForEnd?: TpForEnd
    private triggers: TriggerArray
    public id: number = -1
    private lights: lightning[] = []
    debugRegionsVisible: 'on' | 'off' | 'on_monsters' = 'off'
    /**
     * What "-debugRegions" last asked for, kept for every level: a level draws its own lines, and
     * loses them when it ends, so the next one to start draws them again from this - rather than
     * waiting for the command to be typed again.
     */
    static debugRegionsMode: 'on' | 'off' | 'on_monsters' = 'off'

    visibilities: VisibilityModifierArray
    private resetVisiblitiesAtStart: boolean // if true, all visibilities from previous levels are disabled at level start
    monsters: MonsterArray
    monsterSpawns: MonsterSpawnArray
    meteors: MeteorArray
    clearMobs: ClearMobArray
    portalMobs: PortalMobArray
    circleMobs: CircleMobArray
    staticSlides: StaticSlideArray
    regions: RegionArray

    //hooks
    public hooks_onStart = new MecHookArray<(level: Level) => void>()
    public hooks_onEnd = new MecHookArray<(level: Level) => void>()

    constructor() {
        this.visibilities = new VisibilityModifierArray(this)
        this.resetVisiblitiesAtStart = false
        this.triggers = new TriggerArray()
        this.monsters = new MonsterArray(this)
        this.monsterSpawns = new MonsterSpawnArray(this)
        this.meteors = new MeteorArray(this)
        this.clearMobs = new ClearMobArray(this)
        this.portalMobs = new PortalMobArray(this)
        this.circleMobs = new CircleMobArray(this)
        this.staticSlides = new StaticSlideArray(this)
        this.regions = new RegionArray(this)
        this.livesEarnedAtBeginning = 1
        this.isActivatedB = false
        this.startMessage = ''
    }

    activate(activ: boolean) {
        if (this.isActivatedB == activ) return

        this.end && this.end.activate(activ)
        this.tpForEnd && this.tpForEnd.activate(activ)

        this.triggers.activate(activ)

        if (activ) {
            if (this.startMessage && Level.earningLivesActivated) {
                Text.A(this.startMessage)
            }

            this.monsters.createMonstersUnits()
            this.monsterSpawns.activate()
            this.meteors.createMeteorsItems()
            this.clearMobs.initializeClearMobs()
            this.portalMobs.initializePortalMobs()
            this.circleMobs.activate(true)
            this.staticSlides.activate(true)
            this.regions.activate(true)
            this.removeTempTerrainTypes()

            if (getUdgLevels().getLevelProgression() === 'all') {
                if (Level.earningLivesActivated && this.getId() > 0) {
                    ServiceManager.getService('Lives').add(this.livesEarnedAtBeginning)
                }
            }

            if (!!this.hooks_onStart) {
                for (const hook of this.hooks_onStart.getHooks()) {
                    hook.execute(this)
                }
            }

            if (!!hooks.hooks_onStartLevelAny) {
                for (const hook of hooks.hooks_onStartLevelAny.getHooks()) {
                    hook.execute(this)
                }
            }
        } else {
            this.monsters.removeMonstersUnits()
            this.monsterSpawns.deactivate()
            this.meteors.removeMeteorsItems()
            this.circleMobs.activate(false)
            this.staticSlides.activate(false)
            this.regions.activate(false)
            this.removeTempTerrainTypes()
            getUdgEscapers().deleteSpecificActionsForLevel(this)
            this.setDebugRegionsVisible('off')

            if (!!this.hooks_onEnd) {
                for (const hook of this.hooks_onEnd.getHooks()) {
                    hook.execute(this)
                }
            }

            if (!!hooks.hooks_onEndLevelAny) {
                for (const hook of hooks.hooks_onEndLevelAny.getHooks()) {
                    hook.execute(this)
                }
            }
        }

        this.isActivatedB = activ

        // once its monsters stand on the map, which "on_monsters" draws the paths of
        if (activ) {
            this.setDebugRegionsVisible(Level.debugRegionsMode)
        }

        ThemeUtils.applyGameTheme()
        SlideAfterDarkUtils.applyToLevel(this.id)
    }

    checkpointReviveHeroes(finisher: Escaper | undefined, finished?: boolean) {
        checkPointReviveHeroes(this, finisher, finished)
    }

    getStart = () => {
        return this.start
    }

    getStartRandomX = () => {
        return this.start ? this.start.getRandomX() : 0
    }

    getStartRandomY = () => {
        return this.start ? this.start.getRandomY() : 0
    }

    newStart(x1: number, y1: number, x2: number, y2: number, facing?: number) {
        this.start && this.start.destroy()
        this.start = new Start(x1, y1, x2, y2, facing)

        this.updateDebugRegions()
    }

    newStartFromJson(data: { [x: string]: number }) {
        this.newStart(data.minX, data.minY, data.maxX, data.maxY, data.facing)
    }

    newEnd(x1: number, y1: number, x2: number, y2: number) {
        this.end && this.end.destroy()
        this.end = new End(this.id, x1, y1, x2, y2)
        if (this.isActivatedB) {
            this.end.activate(true)
        }

        this.updateDebugRegions()
    }

    newEndFromJson(data: { [x: string]: number }) {
        this.newEnd(data.minX, data.minY, data.maxX, data.maxY)
    }

    getEnd = () => {
        return this.end
    }

    newTpForEnd(x1: number, y1: number, x2: number, y2: number) {
        this.tpForEnd && this.tpForEnd.destroy()
        this.tpForEnd = new TpForEnd(this.id, x1, y1, x2, y2)
        if (this.isActivatedB) {
            this.tpForEnd.activate(true)
        }

        this.updateDebugRegions()
    }

    newTpForEndFromJson(data: { [x: string]: number }) {
        this.newTpForEnd(data.minX, data.minY, data.maxX, data.maxY)
    }

    getTpForEnd = () => {
        return this.tpForEnd
    }

    getNbMonsters(mode: string) {
        //modes : all, moving, not moving
        return this.monsters.count(mode)
    }

    destroy = () => {
        this.start && this.start.destroy()
        this.end && this.end.destroy()
        this.visibilities.destroy()
        this.triggers.destroy()
        this.monsters.destroy()
        this.monsterSpawns.destroy()
        this.destroyDebugRegions()
        this.removeTempTerrainTypes()
    }

    recreateMonstersUnitsOfType(mt: MonsterType) {
        this.monsters.recreateMonstersUnitsOfType(mt)
    }

    clearMonstersOfType(mt: MonsterType) {
        this.monsters.clearMonstersOfType(mt)
    }

    refreshCastersOfType(ct: CasterType) {
        this.monsters.refreshCastersOfType(ct)
    }

    removeCastersOfType(ct: CasterType) {
        this.monsters.removeCastersOfType(ct)
    }

    getId = () => {
        return this.id
    }

    isActivated = () => {
        return this.isActivatedB
    }

    setIsActivated(activated: boolean) {
        this.isActivatedB = activated
    }

    setNbLivesEarned(nbLives: number) {
        if (nbLives < 0) {
            return false
        }
        this.livesEarnedAtBeginning = nbLives
        return true
    }

    getNbLives = () => {
        return this.livesEarnedAtBeginning
    }

    newVisibilityModifier(x1: number, y1: number, x2: number, y2: number) {
        return this.visibilities.new(x1, y1, x2, y2)
    }

    newVisibilityModifierFromExisting(vm: VisibilityModifier) {
        return this.visibilities.newFromExisting(vm)
    }

    removeVisibilities = () => {
        this.visibilities.removeAllVisibilityModifiers()
    }

    activateVisibilities(activate: boolean) {
        this.visibilities.activate(activate)
    }

    setStartMessage(str: string) {
        this.startMessage = str
    }

    getStartMessage = () => {
        return this.startMessage
    }

    updateDebugRegions = () => {
        this.destroyDebugRegions()

        if (this.debugRegionsVisible !== 'off') {
            // Rect for start and end of level
            DefineDrawLineType('darkblue', 2)
            this.start && this.drawRegion(this.start.minX, this.start.minY, this.start.maxX, this.start.maxY)
            this.end && this.drawRegion(this.end.minX, this.end.minY, this.end.maxX, this.end.maxY)
            this.tpForEnd &&
                this.drawRegion(this.tpForEnd.minX, this.tpForEnd.minY, this.tpForEnd.maxX, this.tpForEnd.maxY)

            // Static slides
            DefineDrawLineType('teal', 2)
            for (const [_, staticSlide] of pairs(this.staticSlides.getAll())) {
                const isDiagonal = staticSlide.getAngle() % 90 !== 0

                this.drawRegion(
                    staticSlide.getX1(),
                    staticSlide.getY1(),
                    staticSlide.getX2(),
                    staticSlide.getY2(),
                    isDiagonal
                )
                this.drawRegion(
                    staticSlide.getX3(),
                    staticSlide.getY3(),
                    staticSlide.getX4(),
                    staticSlide.getY4(),
                    isDiagonal
                )
            }

            // Regions
            DefineDrawLineType('black', 2)
            for (const [_, region] of pairs(this.regions.getAll())) {
                this.drawRegion(region.getMinX(), region.getMinY(), region.getMaxX(), region.getMaxY())
            }

            // Monster spawns
            for (const [_, monsterSpawn] of pairs(this.monsterSpawns.getAll())) {
                monsterSpawn.getMecRegion()?.debugRects(true) // todo find out when to disable this
                monsterSpawn.debugHideRegions(true) // todo find out when to disable this
            }

            // Monsters
            DefineDrawLineType('red', 2)
            if (this.debugRegionsVisible === 'on_monsters') {
                for (const [_, monster] of pairs(this.monsters.getAll())) {
                    if (monster.isDeleted()) {
                        continue
                    }

                    if (monster instanceof MonsterSimplePatrol) {
                        this.drawLine(monster.x1, monster.y1, monster.x2, monster.y2)
                    } else if (monster instanceof MonsterMultiplePatrols) {
                        for (let i = 0; i < monster.x.length; i++) {
                            const nx = i + 1 > monster.x.length - 1 ? 0 : i + 1
                            const ny = i + 1 > monster.y.length - 1 ? 0 : i + 1

                            this.drawLine(monster.x[i], monster.y[i], monster.x[nx], monster.y[ny])
                        }
                    } else if (monster instanceof MonsterNoMove) {
                        const killRect = monster.getKillRect()
                        if (killRect) {
                            this.drawRegion(
                                GetRectMinX(killRect),
                                GetRectMinY(killRect),
                                GetRectMaxX(killRect),
                                GetRectMaxY(killRect)
                            )
                        }
                    }
                }
            }
        }
    }

    setDebugRegionsVisible = (active: typeof this.debugRegionsVisible) => {
        this.debugRegionsVisible = active
        this.updateDebugRegions()
    }

    drawRectangle = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number
    ) => {
        this.drawLine(x1, y1, x2, y2)
        this.drawLine(x2, y2, x3, y3)
        this.drawLine(x3, y3, x4, y4)
        this.drawLine(x4, y4, x1, y1)
    }

    drawRegion = (x1: number, y1: number, x2: number, y2: number, isDiagonal = false) => {
        if (isDiagonal) {
            const regions = createDiagonalRegions(x1, y1, x2, y2, 32)

            for (const region of regions) {
                const x1 = region.topLeft.x
                const y1 = region.topLeft.y
                const x2 = region.bottomRight.x
                const y2 = region.bottomRight.y

                this.drawLine(x1, y1, x1, y2)
                this.drawLine(x1, y1, x2, y1)
                this.drawLine(x2, y2, x1, y2)
                this.drawLine(x2, y2, x2, y1)
            }

            regions.__destroy(true)
        } else {
            this.drawLine(x1, y1, x1, y2)
            this.drawLine(x1, y1, x2, y1)
            this.drawLine(x2, y2, x1, y2)
            this.drawLine(x2, y2, x2, y1)
        }
    }

    drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        const light = DrawLine(x1, y1, x2, y2)
        arrayPush(this.lights, light)
    }

    destroyDebugRegions = () => {
        for (const light of this.lights) {
            DestroyLightning(light)
        }

        // Monster spawns
        for (const [_, monsterSpawn] of pairs(this.monsterSpawns.getAll())) {
            monsterSpawn.getMecRegion()?.debugRects(false)
            monsterSpawn.debugHideRegions(false)
        }

        this.lights.length = 0
    }

    removeTempTerrainTypes = () => {
        for (const [key, tempTerrainType] of pairs(this.tempTerrainTypeMap)) {
            if (!!tempTerrainType) {
                tempTerrainType.terrainTypeId &&
                    tempTerrainType.x &&
                    tempTerrainType.y &&
                    ChangeTerrainType(tempTerrainType.x, tempTerrainType.y, tempTerrainType.terrainTypeId)

                tempTerrainType.effectOnShow && DestroyEffect(tempTerrainType.effectOnShow)
                tempTerrainType.effectOnHide && DestroyEffect(tempTerrainType.effectOnHide)
                tempTerrainType.tempTerrainTimer?.destroy()
                tempTerrainType.__destroy()
                this.tempTerrainTypeMap[key] = null
            }
        }
    }

    private tempTerrainTypeMap: ITempTerrainTypeMap = {}

    setTerrainTypeTemporarily(
        x: number,
        y: number,
        tt: string,
        duration: number,
        effectOnShow?: string,
        effectOnHide?: string
    ) {
        const terrainType = getUdgTerrainTypes().getByLabel(tt)

        if (!terrainType) {
            return
        }

        const oldTerrainType = this.tempTerrainTypeMap[`${x}_${y}`]

        if (oldTerrainType) {
            oldTerrainType.terrainTypeId && ChangeTerrainType(x, y, oldTerrainType.terrainTypeId)
            oldTerrainType.effectOnShow && DestroyEffect(oldTerrainType.effectOnShow)
            oldTerrainType.effectOnHide && DestroyEffect(oldTerrainType.effectOnHide)
            oldTerrainType.tempTerrainTimer?.destroy()
            oldTerrainType.__destroy()
            this.tempTerrainTypeMap[`${x}_${y}`] = null
        }

        const tempTerrainType = MemoryHandler.getEmptyObject<ITempTerrainTypeMap[string]>()
        this.tempTerrainTypeMap[`${x}_${y}`] = tempTerrainType

        tempTerrainType.x = x
        tempTerrainType.y = y

        tempTerrainType.terrainTypeId = GetTerrainType(x, y)
        ChangeTerrainType(x, y, terrainType.getTerrainTypeId())

        if (effectOnShow) {
            tempTerrainType.effectOnShow = AddSpecialEffect(effectOnShow, x, y)
        }

        tempTerrainType.tempTerrainTimer = createTimer(duration, false, () => {
            if (tempTerrainType.terrainTypeId) {
                ChangeTerrainType(x, y, tempTerrainType.terrainTypeId)
            }

            tempTerrainType.effectOnShow && DestroyEffect(tempTerrainType.effectOnShow)

            if (effectOnHide) {
                tempTerrainType.effectOnHide = AddSpecialEffect(effectOnHide, x, y)
            }
        })
    }

    getResetVisiblitiesAtStart() {
        return this.resetVisiblitiesAtStart
    }

    setResetVisiblitiesAtStart(reset: boolean) {
        if (reset === this.resetVisiblitiesAtStart) {
            return
        }

        this.resetVisiblitiesAtStart = reset

        getUdgLevels().refreshVisibilities()
    }

    toJson = () => {
        const json = MemoryHandler.getEmptyObject<any>()

        //level id
        json.id = this.id

        //start message
        if (this.getStartMessage() != null && this.getStartMessage() != '') {
            json.startMessage = this.getStartMessage()
        }

        //nb lives earned
        json.nbLives = this.getNbLives()

        //start
        json.start = this.getStart()?.toJson()

        //end
        json.end = this.getEnd()?.toJson()

        //tpForEnd
        json.tpForEnd = this.getTpForEnd()?.toJson()

        //visibilities
        json.visibilities = this.visibilities.toJson()
        json.resetVisiblitiesAtStart = this.resetVisiblitiesAtStart

        //monsters
        json.monsters = this.monsters.toJson()

        //monsterSpawns
        json.monsterSpawns = this.monsterSpawns.toJson()

        //meteors
        json.meteors = this.meteors.toJson()

        //clearMobs
        json.clearMobs = this.clearMobs.toJson()

        //portalMobs
        json.portalMobs = this.portalMobs.toJson()

        //circleMobs
        json.circleMobs = this.circleMobs.toJson()

        //staticSlides
        json.staticSlides = this.staticSlides.toJson()

        //regions
        json.regions = this.regions.toJson()

        return json
    }
}
