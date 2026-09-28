import { ChangeTerrainType } from 'core/07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { Timer } from 'w3ts'
import { getUdgTerrainTypes, globals, udg_monsters } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { createEvent } from '../../../Utils/mapUtils'
import { ForceAngleBetween0And360, Round32 } from '../../01_libraries/Basic_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import type { ContactAreaBuilder } from './ContactChunks'
import { Monster } from './Monster'
import { MonsterType } from './MonsterType'
import { NewImmobileMonster } from './Monster_functions'

export class MonsterNoMove extends Monster {
    x: number
    y: number
    private angle: number
    private killRect?: rect
    private killRectTrigger?: trigger

    private oldCreateTerrainId: number | null = null

    constructor(mt: MonsterType, x: number, y: number, angle: number, forceId: number | null = null) {
        super(mt, forceId)

        this.x = x
        this.y = y
        this.angle = angle === -1 ? angle : ForceAngleBetween0And360(angle)
    }

    static count = () => {
        let n = 0

        for (const [_, monster] of pairs(udg_monsters)) {
            if (monster instanceof MonsterNoMove) {
                n++
            }
        }

        return n
    }

    createUnit() {
        super.createUnit(() =>
            this.mt ? NewImmobileMonster(this.mt, this.x, this.y, this.angle, !this.hasAttackGroundPos()) : undefined
        )

        this.wander()
        this.startCreateTerrain()
        this.applyKillRect()
    }

    private moveTimer: Timer | null = null
    private wanderTimer: Timer | null = null
    private wanderEffect: effect | null = null
    private initialWander = true

    removeUnit = () => {
        super.removeUnit()

        if (this.moveTimer) {
            this.moveTimer.destroy()
            this.moveTimer = null
        }

        if (this.wanderTimer) {
            this.wanderTimer.destroy()
            this.wanderTimer = null
        }

        if (this.wanderEffect) {
            DestroyEffect(this.wanderEffect)
            this.wanderEffect = null
        }

        this.stopCreateTerrain()

        this.killRectTrigger && DestroyTrigger(this.killRectTrigger)
    }

    /** The region a wanderable monster roams in, which is also everywhere it can be touched */
    private getWanderRegion = () => {
        if (!this.level || !this.mt?.isWanderable()) {
            return undefined
        }

        return this.level.regions.getRegionAtWithFlag(this.x, this.y, 'wanderable')
    }

    getContactAreaLabel(): string {
        if (this.circleMobParent) {
            return super.getContactAreaLabel()
        }

        return this.getWanderRegion() ? 'wanderingMob' : 'immobileMob'
    }

    protected describeOwnContactArea(area: ContactAreaBuilder) {
        const wanderRegion = this.getWanderRegion()

        if (wanderRegion) {
            area.addRect(wanderRegion.getMinX(), wanderRegion.getMinY(), wanderRegion.getMaxX(), wanderRegion.getMaxY())
            return
        }

        area.addPoint(this.x, this.y)
    }

    wander = () => {
        const targetUnit = this.u

        if (!this.level || !targetUnit || !this.mt) {
            return
        }

        if (!this.mt.isWanderable()) {
            return
        }

        const region = this.getWanderRegion()

        if (!region) {
            return
        }

        const createTimer = () => {
            this.moveTimer = new Timer().start(
                Math.random() * globals.wanderExtraTime + (this.initialWander ? 0 : globals.wanderMinTime),
                false,
                () => {
                    if (this.initialWander) {
                        this.initialWander = false
                    }

                    if (this.wanderEffect) DestroyEffect(this.wanderEffect)
                    this.wanderEffect = Natives.UAddSpecialEffectTargetUnitBJ(
                        'overhead',
                        targetUnit,
                        globals.wanderEffectStr
                    )

                    this.wanderTimer = new Timer().start(Math.random() * 1.5 + 0.5, false, () => {
                        let targetPoint = region.getRandomPoint()

                        for (let i = 0; i < 20; i++) {
                            if (
                                distanceBetweenPoints(
                                    GetUnitX(targetUnit),
                                    GetUnitY(targetUnit),
                                    targetPoint.x,
                                    targetPoint.y
                                ) < 1200
                            ) {
                                break
                            }

                            if (!!targetPoint) targetPoint.__destroy()
                            targetPoint = region.getRandomPoint()
                        }

                        IssuePointOrder(targetUnit, 'move', targetPoint.x, targetPoint.y)

                        this.wanderEffect && DestroyEffect(this.wanderEffect)
                        this.wanderEffect = null

                        this.wanderTimer?.destroy()
                        this.wanderTimer = null

                        targetPoint.__destroy()
                    })

                    this.moveTimer?.destroy()
                    this.moveTimer = null

                    createTimer()
                }
            )
        }

        createTimer()
    }

    startCreateTerrain = () => {
        this.stopCreateTerrain()

        const ctl = this.mt?.getCreateTerrainLabel()

        if (ctl) {
            this.removeUnit()

            const ct = getUdgTerrainTypes().getByLabel(ctl)

            if (ct) {
                this.oldCreateTerrainId = GetTerrainType(this.x, this.y)
                ChangeTerrainType(this.x, this.y, ct.getTerrainTypeId())
            }
        }
    }

    stopCreateTerrain = () => {
        if (this.oldCreateTerrainId) {
            ChangeTerrainType(this.x, this.y, this.oldCreateTerrainId)
            this.oldCreateTerrainId = null
        }
    }

    applyKillRect() {
        const monsterKillRectDimensions = this.mt?.getKillRectDimensions()
        if (!monsterKillRectDimensions) {
            return
        }

        const roundedAngle = (Math.round(this.angle / 90) * 90) % 360
        let minX: number, minY: number, maxX: number, maxY: number
        if (roundedAngle % 180 === 0) {
            minX = Round32(this.x - monsterKillRectDimensions.height / 2)
            maxX = Round32(this.x + monsterKillRectDimensions.height / 2)
            minY = Round32(this.y - monsterKillRectDimensions.width / 2)
            maxY = Round32(this.y + monsterKillRectDimensions.width / 2)
        } else {
            // Swap width and height for 90 and 270 degrees
            minX = Round32(this.x - monsterKillRectDimensions.width / 2)
            maxX = Round32(this.x + monsterKillRectDimensions.width / 2)
            minY = Round32(this.y - monsterKillRectDimensions.height / 2)
            maxY = Round32(this.y + monsterKillRectDimensions.height / 2)
        }

        this.killRect = Rect(minX, minY, maxX, maxY)

        this.registerKillRectTrigger()
    }

    registerKillRectTrigger() {
        this.killRectTrigger && DestroyTrigger(this.killRectTrigger)

        this.killRectTrigger = createEvent({
            events: [t => this.killRect && TriggerRegisterEnterRectSimple(t, this.killRect)],
            actions: [
                () => {
                    const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

                    if (!escaper || !escaper.isAlive() || this.isDisabled() || !this.u || !IsUnitAliveBJ(this.u)) {
                        return
                    }

                    ServiceManager.getService('InvisUnit_is_getting_damage').onEscaperTouchingMonster(
                        escaper,
                        this.u,
                        0
                    )
                },
            ],
        })
    }

    getKillRect() {
        return this.killRect
    }

    toJson() {
        const output = super.toJson()
        if (output) {
            output['x'] = R2I(this.x)
            output['y'] = R2I(this.y)
            output['angle'] = R2I(this.angle)
        }
        return output
    }
}

const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}
