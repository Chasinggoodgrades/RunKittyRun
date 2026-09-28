import { arrayPush, ForceAngleBetween0And360 } from 'core/01_libraries/Basic_functions'
import { createTimer } from 'Utils/mapUtils'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { Timer } from 'w3ts'
import { globals } from '../../../../globals'
import { Level } from '../Level/Level'
import { requestContactChunksRebuild } from '../Monster/ContactChunks'
import { Monster } from '../Monster/Monster'

const TIMER_PERIOD = 0.02
const DEFAULT_ROTATION_SPEED = 90
const DEFAULT_DIRECTION = 'cw'
const DEFAULT_FACING = 'cw'
const DEFAULT_SHAPE = 'circle'

export type CircleMobShape =
    | 'circle'
    | 'square'
    | 'triangle'
    | 'pentagon'
    | 'hexagon'
    | 'octagon'
    | 'eight'
    | 'star'
    | 'spiral'
    | 'heart'
    | 'infinity'
    | 'rose'
    | 'butterfly'

export class CircleMob {
    level?: Level

    private triggerMob: Monster
    private mobs: number[] = []

    private rotationSpeed: number
    private direction: 'cw' | 'ccw'
    private facing: 'cw' | 'ccw' | 'in' | 'out'
    private shape: CircleMobShape
    private radius: number
    private initialAngle = 0
    private currentBaseAngle = 0

    id: number = -1

    private circleTimer: Timer | null = null

    constructor(
        triggerMob: Monster,
        rotationSpeed: number | null,
        direction: 'cw' | 'ccw' | null,
        facing: 'cw' | 'ccw' | 'in' | 'out' | null,
        radius: number
    ) {
        this.triggerMob = triggerMob
        triggerMob.setCircleMob(this)

        this.rotationSpeed = rotationSpeed || DEFAULT_ROTATION_SPEED
        this.direction = direction || DEFAULT_DIRECTION
        this.facing = facing || DEFAULT_FACING
        this.shape = DEFAULT_SHAPE
        this.radius = radius
    }

    getTriggerMob = () => this.triggerMob

    getSpeed = () => this.rotationSpeed

    setSpeed = (rotationSpeed: number) => {
        this.rotationSpeed = rotationSpeed
        this.reactivate()
    }

    getDirection = () => this.direction

    setDirection = (direction: 'cw' | 'ccw') => {
        this.direction = direction
        this.reactivate()
    }

    getFacing = () => this.facing

    setFacing = (facing: 'cw' | 'ccw' | 'in' | 'out') => {
        this.facing = facing
        this.reactivate()
    }

    getShape = () => this.shape

    setShape = (shape: CircleMobShape) => {
        this.shape = shape
        this.reactivate()
        requestContactChunksRebuild()
    }

    getRadius = () => this.radius

    setRadius = (radius: number) => {
        this.radius = radius
        this.reactivate()
        requestContactChunksRebuild() // the circle its mobs are found on just changed size
    }

    getInitialAngle = () => this.initialAngle

    setInitialAngle = (initialAngle: number) => {
        this.initialAngle = initialAngle || 0
        this.reactivate()
    }

    getBlockMobs = () => {
        return this.mobs
    }

    close = () => {}

    redoMainMobPermanentEffect = () => {}

    addBlockMob = (monster: Monster): boolean => {
        if (this.mobs.includes(monster.getId())) {
            return false
        }

        if (monster.getId() === this.triggerMob.getId()) {
            return false
        }

        arrayPush(this.mobs, monster.getId())
        monster.setCircleMobParent(this)
        requestContactChunksRebuild() // its area is the circle now, not where it was standing

        return true
    }

    removeLastBlockMob = (): boolean => {
        return !!this.mobs.splice(-1, 1)
    }

    removeAllBlockMobs = () => {
        this.mobs.length = 0
    }

    removeMob = (monsterId: number) => {
        this.mobs.splice(this.mobs.indexOf(monsterId), 1)
        requestContactChunksRebuild()
    }

    destroy = () => {
        this.close()
        this.triggerMob.removeCircleMob()

        this.getBlockMobs().forEach(monsterId => {
            this.level?.monsters.get(monsterId)?.createUnit()
        })

        this.removeAllBlockMobs()

        this.circleTimer?.destroy()
        this.circleTimer = null
        this.triggerMob.u && ShowUnit(this.triggerMob.u, true)

        this.level && this.level.circleMobs.removeCircleMob(this.id)
    }

    reactivate = () => {
        if (this.circleTimer) {
            this.activate(true)
        }
    }

    activate = (activ: boolean) => {
        this.circleTimer?.destroy()
        this.circleTimer = null

        // The mobs of a level are created before its circles are told to turn, so they were put in
        // the chunks of wherever they stood. Now that the circle is there, they belong to it.
        requestContactChunksRebuild()

        if (activ) {
            this.triggerMob.u && ShowUnit(this.triggerMob.u, false)

            const directionReal = this.direction === 'ccw' ? 1 : -1
            this.currentBaseAngle = this.initialAngle

            this.circleTimer = createTimer(TIMER_PERIOD, true, () => {
                if (!this.triggerMob.u) {
                    return
                }

                const centerX = GetUnitX(this.triggerMob.u)
                const centerY = GetUnitY(this.triggerMob.u)

                const mobCount = this.mobs.length
                const angleDiff = 360.0 / I2R(mobCount)

                let angle = this.currentBaseAngle

                for (let i = 0; i < this.mobs.length; i++) {
                    const monsterId = this.mobs[i]
                    const mob = this.level?.monsters.get(monsterId)

                    if (mob?.u) {
                        let unitX: number
                        let unitY: number

                        // Calculate position based on shape
                        if (this.shape === 'circle') {
                            unitX = centerX + this.radius * CosBJ(angle)
                            unitY = centerY + this.radius * SinBJ(angle)
                        } else if (this.shape === 'eight') {
                            // Figure-eight/lemniscate pattern (vertical)
                            // Parametric equation: x = r*sin(t), y = r*sin(t)*cos(t)
                            const t = angle * (Math.PI / 180) // Convert to radians
                            const scale = this.radius * 0.8 // Scale factor for the figure-eight
                            unitX = centerX + scale * Math.sin(t)
                            unitY = centerY + scale * Math.sin(t) * Math.cos(t)
                        } else if (this.shape === 'star') {
                            // 5-pointed star pattern with smooth interpolation
                            const t = angle * (Math.PI / 180)
                            const outerRadius = this.radius
                            const innerRadius = this.radius * 0.4
                            const points = 5
                            const segmentAngle = 360 / (points * 2) // 36 degrees per segment
                            const normalizedAngle = ((angle % 360) + 360) % 360
                            const segmentPosition = (normalizedAngle % segmentAngle) / segmentAngle
                            const segmentIndex = Math.floor(normalizedAngle / segmentAngle)

                            // Smooth interpolation between outer and inner radii
                            const r =
                                segmentIndex % 2 === 0
                                    ? outerRadius - (outerRadius - innerRadius) * segmentPosition
                                    : innerRadius + (outerRadius - innerRadius) * segmentPosition

                            unitX = centerX + r * Math.cos(t)
                            unitY = centerY + r * Math.sin(t)
                        } else if (this.shape === 'spiral') {
                            // Expanding/contracting spiral
                            const t = angle * (Math.PI / 180)
                            const cycles = 3 // Number of full rotations
                            const radiusFactor = (angle % 360) / 360 // 0 to 1
                            const r = this.radius * (0.3 + 0.7 * Math.sin(cycles * t))
                            unitX = centerX + r * Math.cos(t)
                            unitY = centerY + r * Math.sin(t)
                        } else if (this.shape === 'heart') {
                            // Heart shape using parametric equations
                            const t = angle * (Math.PI / 180)
                            const scale = this.radius * 0.08
                            unitX = centerX + scale * 16 * Math.pow(Math.sin(t), 3)
                            unitY =
                                centerY +
                                scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
                        } else if (this.shape === 'infinity') {
                            // Horizontal figure-eight (infinity symbol)
                            const t = angle * (Math.PI / 180)
                            const scale = this.radius * 0.8
                            unitX = centerX + scale * Math.sin(t) * Math.cos(t)
                            unitY = centerY + scale * Math.sin(t)
                        } else if (this.shape === 'rose') {
                            // Rose curve (flower pattern with 5 petals)
                            const t = angle * (Math.PI / 180)
                            const k = 5 // Number of petals
                            const r = this.radius * Math.abs(Math.cos(k * t))
                            unitX = centerX + r * Math.cos(t)
                            unitY = centerY + r * Math.sin(t)
                        } else if (this.shape === 'butterfly') {
                            // Butterfly curve
                            const t = angle * (Math.PI / 180)
                            const scale = this.radius * 0.15
                            const exp = Math.exp(Math.cos(t))
                            const r = Math.sin(t) * (exp - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5))
                            unitX = centerX + scale * r * Math.cos(t) * 5
                            unitY = centerY + scale * r * Math.sin(t) * 5
                        } else {
                            const shapeVertices = this.getShapeVertices()

                            // Fallback to circle if shape has no vertices
                            if (shapeVertices === 0) {
                                unitX = centerX + this.radius * CosBJ(angle)
                                unitY = centerY + this.radius * SinBJ(angle)
                            } else {
                                const t = (angle - this.currentBaseAngle + 360) % 360
                                const segmentAngle = 360.0 / shapeVertices
                                const vertexIndex = Math.floor(t / segmentAngle)
                                const nextVertexIndex = (vertexIndex + 1) % shapeVertices
                                const localT = (t % segmentAngle) / segmentAngle

                                const vertex1Angle = this.currentBaseAngle + vertexIndex * segmentAngle
                                const vertex2Angle = this.currentBaseAngle + nextVertexIndex * segmentAngle

                                const x1 = centerX + this.radius * CosBJ(vertex1Angle)
                                const y1 = centerY + this.radius * SinBJ(vertex1Angle)
                                const x2 = centerX + this.radius * CosBJ(vertex2Angle)
                                const y2 = centerY + this.radius * SinBJ(vertex2Angle)

                                unitX = x1 + (x2 - x1) * localT
                                unitY = y1 + (y2 - y1) * localT
                            }
                        }

                        let facingAngle: number
                        if (this.facing === 'cw') {
                            facingAngle = angle - 90
                        } else if (this.facing === 'ccw') {
                            facingAngle = angle + 90
                        } else if (this.facing === 'in') {
                            facingAngle = angle + 180
                        } else {
                            // 'out'
                            facingAngle = angle
                        }

                        if (globals.MAP_MIN_X <= unitX && globals.MAP_MAX_X >= unitX) {
                            SetUnitX(mob.u, unitX)
                        }

                        if (globals.MAP_MIN_Y <= unitY && globals.MAP_MAX_Y >= unitY) {
                            SetUnitY(mob.u, unitY)
                        }

                        BlzSetUnitFacingEx(mob.u, facingAngle)
                    }

                    angle += angleDiff
                }

                this.currentBaseAngle = ForceAngleBetween0And360(
                    this.currentBaseAngle + directionReal * this.rotationSpeed * TIMER_PERIOD
                )
            })
        }
    }

    private getShapeVertices = (): number => {
        switch (this.shape) {
            case 'triangle':
                return 3
            case 'square':
                return 4
            case 'pentagon':
                return 5
            case 'hexagon':
                return 6
            case 'octagon':
                return 8
            default:
                return 0 // circle has no vertices
        }
    }

    toJson = () => {
        const blockMobIds: number[] = []

        for (const monsterId of this.mobs) {
            if (!this.level?.monsters.get(monsterId)?.isDeleted()) {
                arrayPush(blockMobIds, monsterId)
            }
        }

        const output = MemoryHandler.getEmptyObject<any>()

        output['id'] = this.id
        output['mainMobId'] = this.triggerMob.id
        output['blockMobsIds'] = blockMobIds
        output['rotationSpeed'] = this.rotationSpeed
        output['direction'] = this.direction
        output['facing'] = this.facing
        output['shape'] = this.shape
        output['radius'] = this.radius
        output['initialAngle'] = this.initialAngle

        return output
    }
}
