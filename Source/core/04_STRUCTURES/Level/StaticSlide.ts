import { MemoryHandler } from 'Utils/MemoryHandler'
import { createEvent } from 'Utils/mapUtils'
import { AnglesDiff, arrayPush } from 'core/01_libraries/Basic_functions'
import { getUdgEscapers } from '../../../../globals'
import { createDiagonalRegions } from '../../01_libraries/Regions_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import type { Escaper } from '../Escaper/Escaper'
import { Hero2Escaper, IsHero } from '../Escaper/Escaper_functions'
import { Level } from './Level'

type SlideAreaBox = { x1: number; y1: number; x2: number; y2: number }

/**
 * A region of the engine is made of cells this size, and a rect added to one brings every cell it
 * overlaps: a hero is in slightly before reaching the rect itself, and a rect thinner than a step
 * of the slide is still a whole cell deep.
 */
const REGION_CELL_SIZE = 32

/** How close to the angle of its lane a hero has to be turned before it may turn by itself again */
const ALIGNED_ANGLE_TOLERANCE = 0.5

/** The cells the engine watches for a rect: widened to the grid, and never less than one cell */
const toRegionCells = (ax: number, ay: number, bx: number, by: number): SlideAreaBox => {
    const x1 = Math.floor(Math.min(ax, bx) / REGION_CELL_SIZE) * REGION_CELL_SIZE
    const y1 = Math.floor(Math.min(ay, by) / REGION_CELL_SIZE) * REGION_CELL_SIZE

    return {
        x1,
        y1,
        x2: Math.max(Math.ceil(Math.max(ax, bx) / REGION_CELL_SIZE) * REGION_CELL_SIZE, x1 + REGION_CELL_SIZE),
        y2: Math.max(Math.ceil(Math.max(ay, by) / REGION_CELL_SIZE) * REGION_CELL_SIZE, y1 + REGION_CELL_SIZE),
    }
}

export class StaticSlide {
    private entryBoxes?: SlideAreaBox[]
    private exitBoxes?: SlideAreaBox[]
    private x1: number
    private y1: number
    private x2: number
    private y2: number
    private x3: number
    private y3: number
    private x4: number
    private y4: number
    private angle: number
    private speed: number
    private canTurnAngle: number | undefined
    level?: Level

    id?: number

    private slidingPlayers: number[] = []
    private slidingPlayerPrevSpeed: number[] = []
    /** Heroes the lane is still turning towards its own angle, by escaper id */
    private aligningPlayers: { [escaperId: number]: boolean } = {}
    private triggers: trigger[] = []

    constructor(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number,
        angle: number,
        speed: number
    ) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.x3 = x3
        this.y3 = y3
        this.x4 = x4
        this.y4 = y4
        this.angle = angle
        this.speed = speed
    }

    destroy = () => {
        this.activate(false)
        this.level && this.id && this.level.staticSlides.removeStaticSlide(this.id)
    }

    removePlayer = (playerId: number) => {
        delete this.aligningPlayers[playerId]

        const itemIndex = this.slidingPlayers.indexOf(playerId)

        if (itemIndex !== -1) {
            const escaper = getUdgEscapers().get(playerId)

            if (escaper) {
                escaper.setStaticSliding(undefined)
                escaper.setLastTerrainType(undefined)
                this.slidingPlayers.splice(itemIndex, 1)

                escaper.setSlideSpeed(this.slidingPlayerPrevSpeed[escaper.getEscaperId()])

                if (!escaper.isAlive()) {
                    escaper.enableSlide(false)
                }
            }
        }
    }

    activate = (activ: boolean) => {
        if (activ) {
            // Built here, on every machine at once. Built on demand, they were built by the machine of
            // an async hero alone, taking tables from the shared pool of MemoryHandler on that machine
            // only: a pool that differs from one machine to another hands out tables walked in another
            // order.
            this.entryBoxes = this.buildAreaBoxes(this.x1, this.y1, this.x2, this.y2)
            this.exitBoxes = this.buildAreaBoxes(this.x3, this.y3, this.x4, this.y4)

            const isDiagonal = this.angle % 90 !== 0

            // Start region
            arrayPush(
                this.triggers,
                createEvent({
                    events: [
                        t => {
                            if (isDiagonal) {
                                const regions = createDiagonalRegions(this.x1, this.y1, this.x2, this.y2, 32)

                                for (const region of regions) {
                                    const r = Rect(
                                        region.topLeft.x,
                                        region.topLeft.y,
                                        region.bottomRight.x,
                                        region.bottomRight.y
                                    )
                                    TriggerRegisterEnterRectSimple(t, r)
                                    RemoveRect(r)
                                }

                                regions.__destroy(true)
                            } else {
                                const rect = Rect(this.x1, this.y1, this.x2, this.y2)
                                TriggerRegisterEnterRectSimple(t, rect)
                                RemoveRect(rect)
                            }
                        },
                    ],
                    actions: [
                        () => {
                            const hero = Natives.UGetTriggerUnit()
                            const escaper = Hero2Escaper(hero)

                            // A hero sliding as an effect is taken along by its own machine, where it
                            // really is (see Escaper.followStaticSlidesOfAsyncHero): its unit only
                            // follows the packets, and would be taken a second time, and late.
                            if (IsHero(hero) && escaper && !escaper.isHeroAsEffect()) {
                                this.takeHero(escaper)
                            }
                        },
                    ],
                })
            )

            // End region
            arrayPush(
                this.triggers,
                createEvent({
                    events: [
                        t => {
                            if (isDiagonal) {
                                const regions = createDiagonalRegions(this.x3, this.y3, this.x4, this.y4, 32)

                                for (const region of regions) {
                                    const r = Rect(
                                        region.topLeft.x,
                                        region.topLeft.y,
                                        region.bottomRight.x,
                                        region.bottomRight.y
                                    )
                                    TriggerRegisterEnterRectSimple(t, r)
                                    RemoveRect(r)
                                }

                                regions.__destroy(true)
                            } else {
                                const rect = Rect(this.x3, this.y3, this.x4, this.y4)
                                TriggerRegisterEnterRectSimple(t, rect)
                                RemoveRect(rect)
                            }
                        },
                    ],
                    actions: [
                        () => {
                            const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

                            // let go by its own machine while it slides as an effect, as it was taken
                            if (escaper && !escaper.isHeroAsEffect()) {
                                this.releaseHero(escaper)
                            }
                        },
                    ],
                })
            )
        } else {
            for (const playerId of this.slidingPlayers) {
                this.removePlayer(playerId)
            }

            for (const trigger of this.triggers) {
                DestroyTrigger(trigger)
            }
        }
    }

    // If the point is in either of the start/end regions
    containsPoint = (x: number, y: number) => {
        return this.areCoordsInEntry(x, y) || this.areCoordsInExit(x, y)
    }

    // If the point is in the sliding region
    isInRegion = (x: number, y: number) => {
        // 32 offset is needed cuz TriggerRegisterEnterRectSimple gets called even before the unit is in the region. Sometimes its not enough so 64 for good measure.
        const x1 = Math.min(this.x1, this.x2, this.x3, this.x4) - 64
        const x4 = Math.max(this.x1, this.x2, this.x3, this.x4) + 64
        const y1 = Math.min(this.y1, this.y2, this.y3, this.y4) - 64
        const y4 = Math.max(this.y1, this.y2, this.y3, this.y4) + 64

        return x >= x1 && x <= x4 && y >= y1 && y <= y4
    }

    /**
     * Takes a sliding hero along: it turns towards the slide and takes its speed. Called by the
     * region the engine watches, and for a hero sliding as an effect by the machine of its player,
     * the only one knowing where it is: the regions only ever see units.
     */
    takeHero = (escaper: Escaper) => {
        if (!escaper.isSliding() || escaper.isStaticSliding() || this.slidingPlayers.includes(escaper.getEscaperId())) {
            return false
        }

        arrayPush(this.slidingPlayers, escaper.getEscaperId())
        escaper.setStaticSliding(this)

        if (this.canTurnAngle) {
            const currentAngle = escaper.getHeroFacing()
            escaper.setRemainingDegreesToTurn(AnglesDiff(this.angle, currentAngle))

            // turned towards the lane first, and only then free to turn within what it allows
            this.aligningPlayers[escaper.getEscaperId()] = true
        } else {
            escaper.setRemainingDegreesToTurn(0)
            escaper.turnInstantly(this.angle)
        }

        this.slidingPlayerPrevSpeed[escaper.getEscaperId()] = escaper.getSlideSpeed()
        escaper.setSlideSpeed(this.speed)

        return true
    }

    /**
     * The boxes one of the two areas is made of - a single rect, or the staircase of rects a
     * diagonal one is cut into. Built once and kept: they never move, and they are asked about
     * fifty times a second for a hero whose machine looks for them itself.
     *
     * Cut the way the engine cuts them into cells, rather than to the exact rect: a hero sliding as
     * an effect is taken along and let go by these, and must be so where the region would do it for
     * its unit. The exact rect of a thin exit is stepped over, and the slide kills a hero that goes
     * on past its lane.
     */
    private buildAreaBoxes = (ax: number, ay: number, bx: number, by: number): SlideAreaBox[] => {
        if (this.angle % 90 !== 0) {
            const boxes: SlideAreaBox[] = []
            const regions = createDiagonalRegions(ax, ay, bx, by, 32)

            for (const region of regions) {
                boxes[boxes.length] = toRegionCells(
                    region.topLeft.x,
                    region.topLeft.y,
                    region.bottomRight.x,
                    region.bottomRight.y
                )
            }

            regions.__destroy(true)

            return boxes
        }

        return [toRegionCells(ax, ay, bx, by)]
    }

    private areCoordsInBoxes = (boxes: SlideAreaBox[], x: number, y: number) => {
        for (const box of boxes) {
            if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) {
                return true
            }
        }

        return false
    }

    /** The area that grabs a sliding hero, which is what the engine watches with a region */
    areCoordsInEntry = (x: number, y: number) => {
        if (!this.entryBoxes) {
            this.entryBoxes = this.buildAreaBoxes(this.x1, this.y1, this.x2, this.y2)
        }

        return this.areCoordsInBoxes(this.entryBoxes, x, y)
    }

    /** The area that lets a hero go again, at the end of the ride */
    areCoordsInExit = (x: number, y: number) => {
        if (!this.exitBoxes) {
            this.exitBoxes = this.buildAreaBoxes(this.x3, this.y3, this.x4, this.y4)
        }

        return this.areCoordsInBoxes(this.exitBoxes, x, y)
    }

    /** Lets a hero go, wherever the news came from: the region of the engine, or the machine of its player */
    releaseHero = (escaper: Escaper) => {
        if (escaper.getStaticSliding() !== this) {
            return false
        }

        this.removePlayer(escaper.getEscaperId())

        return true
    }

    /**
     * Drops a hero without giving it anything back, speed nor terrain: for a hero whose machine
     * was the only one to take it along, when its effect gives way to its unit. The others never
     * heard of that ride, and a membership nobody else has cannot outlive the effect.
     */
    forgetHero = (escaper: Escaper) => {
        delete this.aligningPlayers[escaper.getEscaperId()]

        const itemIndex = this.slidingPlayers.indexOf(escaper.getEscaperId())

        if (itemIndex !== -1) {
            this.slidingPlayers.splice(itemIndex, 1)
        }

        if (escaper.getStaticSliding() === this) {
            escaper.setStaticSliding(undefined)
        }
    }

    /** The speed this lane gives back to a hero when it lets it go */
    getPreviousSlideSpeed = (escaperId: number) => this.slidingPlayerPrevSpeed[escaperId] ?? 0

    /**
     * Carries on with the body of a hero that died along this lane on the one machine taking it
     * along: every machine gives it back to the lane on the same turn, with the speed and the facing
     * its death came with, and the speed to give back when the lane lets it go.
     */
    carryDeadHero = (escaper: Escaper, previousSlideSpeed: number) => {
        const escaperId = escaper.getEscaperId()

        if (escaper.isStaticSliding() || this.slidingPlayers.includes(escaperId)) {
            return
        }

        arrayPush(this.slidingPlayers, escaperId)
        escaper.setStaticSliding(this)
        this.slidingPlayerPrevSpeed[escaperId] = previousSlideSpeed
    }

    /**
     * Whether the lane is still turning this hero towards its own angle. Nobody may turn the hero
     * meanwhile, or the turn the lane started would be replaced by one kept within the angle it
     * allows, from wherever the hero was looking when it came in.
     *
     * Over once the hero looks along the lane, but also as soon as nothing is left to turn it
     * there - its sliding mode changed, say - so that it is never kept from turning for good.
     */
    isAligningHero = (escaper: Escaper) => {
        const escaperId = escaper.getEscaperId()

        if (!this.aligningPlayers[escaperId]) {
            return false
        }

        const isStillTurning =
            escaper.slidingMode === 'max' &&
            escaper.getRemainingDegreesToTurn() !== 0 &&
            RAbsBJ(AnglesDiff(this.angle, escaper.getHeroFacing())) > ALIGNED_ANGLE_TOLERANCE

        if (!isStillTurning) {
            delete this.aligningPlayers[escaperId]
        }

        return isStillTurning
    }

    getX1 = () => this.x1
    getX2 = () => this.x2
    getX3 = () => this.x3
    getX4 = () => this.x4
    getY1 = () => this.y1
    getY2 = () => this.y2
    getY3 = () => this.y3
    getY4 = () => this.y4

    getSpeed = () => this.speed
    getAngle = () => this.angle

    setSpeed = (speed: number) => {
        this.speed = speed
    }

    setAngle = (angle: number) => {
        this.angle = angle
    }

    getCanTurnAngle = () => this.canTurnAngle

    setCanTurnAngle = (canTurnAngle: number | undefined) => {
        this.canTurnAngle = canTurnAngle
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['x1'] = R2I(this.x1)
        output['y1'] = R2I(this.y1)
        output['x2'] = R2I(this.x2)
        output['y2'] = R2I(this.y2)
        output['x3'] = R2I(this.x3)
        output['y3'] = R2I(this.y3)
        output['x4'] = R2I(this.x4)
        output['y4'] = R2I(this.y4)
        output['angle'] = R2I(this.angle)
        output['speed'] = R2I(this.speed)
        output['canTurnAngle'] = this.canTurnAngle

        return output
    }
}
