import { Constants } from 'core/01_libraries/Constants'
import { globals } from '../../../../globals'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { HorizontalRectangleRegion } from '../Region/HorizontalRectangleRegion'

function OnNextWaypointReached(this: any, unit: unit) {
    const longDistanceMoveOrder = LongDistanceMoveOrder.unitToLongDistanceMoveOrder[GetHandleId(unit)]

    if (!!longDistanceMoveOrder) {
        longDistanceMoveOrder.onNextWaypointReached()
    }
}

export function init_LongDistanceMoveOrder_garbageCollector() {
    const triggerInterval = 10 // 10 seconds
    TimerStart(CreateTimer(), triggerInterval, true, () => {
        for (const [_, longDistanceMoveOrder] of pairs(LongDistanceMoveOrder.ordersInSequence)) {
            longDistanceMoveOrder.destroyIfObsolete()
        }
    })
}

/**
 * Issues an order to a unit to move to a point, with intermediate waypoints if the distance is too long.
 * @param whichUnit The unit to issue the move order to.
 * @param x The x-coordinate of the destination point.
 * @param y The y-coordinate of the destination point.
 * @param automaticallyDestroyLongMoveOrderAtEndOfMvt If true, the LongDistanceMoveOrder instance will be automatically destroyed at the end of the movement. If false, it will need to be destroyed manually by calling the destroy() method on the LongDistanceMoveOrder instance. Default is true.
 * @returns True if the order was successfully issued, false otherwise.
 */
export const IssueMoveOrderForLongDistance = (
    whichUnit: unit,
    x: number,
    y: number,
    automaticallyDestroyLongMoveOrderAtEndOfMvt = true
): boolean | LongDistanceMoveOrder => {
    if (!whichUnit || !IsUnitAliveBJ(whichUnit)) {
        return false
    }

    // Determinate if we can handle the move in one go (short distance or vertical/horizontal move)
    const startX = GetUnitX(whichUnit)
    const startY = GetUnitY(whichUnit)
    const deltaX = x - startX
    const deltaY = y - startY

    const distance = SquareRoot(deltaX * deltaX + deltaY * deltaY)
    let simpleMove = distance <= Constants.MAX_DISTANCE_PER_MOVE_ORDER

    if (simpleMove) {
        IssuePointOrder(whichUnit, 'move', x, y)
        return true
    } else {
        // Handle long distance move with intermediate waypoints
        return MemoryHandler.getEmptyClass(
            LongDistanceMoveOrder,
            whichUnit,
            x,
            y,
            automaticallyDestroyLongMoveOrderAtEndOfMvt
        )
    }
}

export class LongDistanceMoveOrder {
    /** By handle id of the unit: looked up on this machine, never walked */
    static unitToLongDistanceMoveOrder: { [x: number]: LongDistanceMoveOrder } = {}
    /**
     * The same orders, keyed by the order they were made in, which is what is walked: every machine
     * goes through it alike, unlike handle ids, which Lua recycles on each machine at its own pace.
     */
    static ordersInSequence: { [sequence: number]: LongDistanceMoveOrder } = {}
    private static lastSequence = 0

    private sequence: number

    private unit: unit
    private destinationX: number
    private destinationY: number
    private waypointsX = MemoryHandler.getEmptyArray<number>()
    private waypointsY = MemoryHandler.getEmptyArray<number>()
    private nextWaypointRegion: HorizontalRectangleRegion
    private currentWaypointIndex: number
    private automaticallyDestroyAtEndOfMvt: boolean

    constructor(whichUnit: unit, x: number, y: number, automaticallyDestroyAtEndOfMvt = true) {
        this.unit = whichUnit
        this.destinationX = x
        this.destinationY = y
        this.automaticallyDestroyAtEndOfMvt = automaticallyDestroyAtEndOfMvt

        if (!whichUnit || !IsUnitAliveBJ(whichUnit)) {
            throw new Error('LongDistanceMoveOrder: whichUnit is invalid or dead')
        }

        LongDistanceMoveOrder.unitToLongDistanceMoveOrder[GetHandleId(this.unit)] = this

        LongDistanceMoveOrder.lastSequence++
        this.sequence = LongDistanceMoveOrder.lastSequence
        LongDistanceMoveOrder.ordersInSequence[this.sequence] = this

        this.nextWaypointRegion = MemoryHandler.getEmptyClass(HorizontalRectangleRegion, 0, 0, 64, 64)
        if (globals.debugLongDistanceMoves) {
            this.nextWaypointRegion.debugRects(true)
        }

        this.nextWaypointRegion.watchUnit(this.unit)
        this.nextWaypointRegion.onUnitEnters(OnNextWaypointReached)
        this.nextWaypointRegion.enableWatchUnits(true)

        this.calculateWaypoints()

        this.currentWaypointIndex = -1
        this.issueMoveOrderToNextWaypoint()
    }

    private calculateWaypoints() {
        const startX = GetUnitX(this.unit)
        const startY = GetUnitY(this.unit)
        const deltaX = this.destinationX - startX
        const deltaY = this.destinationY - startY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        const steps = Math.ceil(distance / Constants.MAX_DISTANCE_PER_MOVE_ORDER)

        for (let i = 1; i <= steps; i++) {
            const t = I2R(i) / I2R(steps)
            const waypointX = startX + t * deltaX
            const waypointY = startY + t * deltaY
            arrayPush(this.waypointsX, waypointX)
            arrayPush(this.waypointsY, waypointY)
        }
    }

    private issueMoveOrderToNextWaypoint() {
        this.currentWaypointIndex++

        if (this.currentWaypointIndex < this.waypointsX.length) {
            const waypointX = this.waypointsX[this.currentWaypointIndex]
            const waypointY = this.waypointsY[this.currentWaypointIndex]

            IssuePointOrder(this.unit, 'move', waypointX, waypointY)

            if (this.currentWaypointIndex === this.waypointsX.length - 1) {
                // Last waypoint is the final destination, we can clean the region entering detection
                this.automaticallyDestroyAtEndOfMvt && this.destroy()
            } else {
                this.nextWaypointRegion.moveTo(waypointX, waypointY)
            }
        }
    }

    public onNextWaypointReached() {
        this.issueMoveOrderToNextWaypoint()
    }

    public destroy() {
        delete LongDistanceMoveOrder.unitToLongDistanceMoveOrder[GetHandleId(this.unit)]
        delete LongDistanceMoveOrder.ordersInSequence[this.sequence]

        this.nextWaypointRegion.destroy()

        MemoryHandler.destroyArray(this.waypointsX)
        MemoryHandler.destroyArray(this.waypointsY)

        MemoryHandler.destroyClassObject(this.nextWaypointRegion, this.nextWaypointRegion.constructor.name)
        MemoryHandler.destroyClassObject(this, this.constructor.name)
    }

    public destroyIfObsolete() {
        if (!IsUnitAliveBJ(this.unit)) {
            this.destroy()
        }
    }
}
