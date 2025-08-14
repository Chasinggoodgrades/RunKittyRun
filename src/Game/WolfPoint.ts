import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { FilterList } from 'src/Utility/FilterList'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Trigger } from 'w3ts'
import { Wolf } from './Entities/Wolf'
import { distanceBetweenXYPoints, Utility } from 'src/Utility/Utility'

export class WolfPoint {
    private MaxDistance: number = 128 // Max distance between points
    public static readonly MoveOrderID: number = OrderId('move')
    public static readonly StopOrderID: number = OrderId('stop')
    public static readonly AttackOrderID: number = OrderId('attack')
    public static readonly HoldPositionOrderID: number = OrderId('holdposition')
    public static IsPausedTrigger: Trigger

    private Wolf: Wolf
    private PointInfo: WolfPointInfo[]

    /// <summary>
    /// Initializes a new instance of the <see cref="WolfPoint"/> class.
    /// </summary>
    /// <param name="wolf">The wolf instance.</param>
    public constructor(wolf: Wolf) {
        this.Wolf = wolf
        WolfPoint.IsPausedTrigger ??= WolfPoint.InitTrigger()
    }

    /// <summary>
    /// Creates regions between the start and end points.
    /// </summary>
    /// <param name="startX">The start point X coordinate.</param>
    /// <param name="startY">The start point Y coordinate.</param>
    /// <param name="endX">The end point X coordinate.</param>
    /// <param name="endY">The end point Y coordinate.</param>
    public DiagonalRegionCreate(startX: number, startY: number, endX: number, endY: number) {
        try {
            this.PointInfo ??= WolfPointInfo.GetWolfPointList()
            this.Cleanup()

            // Calculate the distance between points
            let distance = distanceBetweenXYPoints(startX, startY, endX, endY)
            let numRegions: number = Math.ceil(distance / this.MaxDistance)

            // Calculate angle and step sizes using trigonometry
            let angle = Math.atan2(endY - startY, endX - startX)
            let stepX = this.MaxDistance * Math.cos(angle)
            let stepY = this.MaxDistance * Math.sin(angle)

            for (let i: number = 0; i < numRegions; i++) {
                let regionX = startX + i * stepX
                let regionY = startY + i * stepY
                this.PointInfo[i].x = regionX
                this.PointInfo[i].y = regionY
                this.PointInfo[i].LastPoint = false
            }

            // Ensure the last point is exactly the end point
            this.PointInfo[numRegions].x = endX
            this.PointInfo[numRegions].y = endY
            this.PointInfo[numRegions].LastPoint = true

            if (this.PointInfo != null && this.PointInfo.length > 0) {
                this.StartMovingOrders()
            }
        } catch (ex: any) {
            Logger.Warning('WolfPoint.DiagonalRegionCreate {ex.Message}')
        }
    }

    public Cleanup() {
        try {
            if (this.PointInfo == null) return
            BlzUnitClearOrders(this.Wolf.Unit.handle, false)

            for (let i: number = 0; i < this.PointInfo.length; i++) {
                this.PointInfo[i].x = 0
                this.PointInfo[i].y = 0
            }
        } catch (ex: any) {
            Logger.Critical('up: error: Clean: WolfPoint: {ex.Message}')
        }
    }

    public dispose() {
        this.Cleanup()
        WolfPointInfo.ClearWolfPointList(this.PointInfo)
        BlzUnitClearOrders(this.Wolf.Unit.handle, false)
    }

    private StartMovingOrders() {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        if (this.Wolf.paused || this.Wolf.IsReviving) {
        BlzUnitClearOrders(this.Wolf.Unit.handle, false)
        return
        }

        try {
            for (let i: number = this.PointInfo.length - 1; i >= 1; i--) {
                if (this.PointInfo[i].x == 0 && this.PointInfo[i].y == 0) continue
                let moveID = this.PointInfo[i].LastPoint ? WolfPoint.AttackOrderID : WolfPoint.MoveOrderID

                BlzQueuePointOrderById(this.Wolf.Unit.handle, moveID, this.PointInfo[i].x, this.PointInfo[i].y)
                if (!this.Wolf.IsWalking) this.Wolf.IsWalking = true // ensure its set after queued order.
            }
        } catch (ex: any) {
            Logger.Critical('WolfPoint.StartMovingOrders {ex.Message}')
        }
    }

    private static InitTrigger(): Trigger {
        this.IsPausedTrigger ??= Trigger.create()!
        WolfPoint.IsPausedTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER)

        TriggerAddCondition(WolfPoint.IsPausedTrigger.handle, FilterList.IssuedOrderAtkOrder)
        TriggerAddCondition(WolfPoint.IsPausedTrigger.handle, FilterList.UnitTypeWolf)

        // When Queued orders, it will proc twice. Once for being queued, then again once finishing the order.
        TriggerAddAction(WolfPoint.IsPausedTrigger.handle, WolfPoint.QueueOrderActions)
        return WolfPoint.IsPausedTrigger
    }

    private static QueueOrderActions() {
        Globals.ALL_WOLVES.get(getTriggerUnit())!.IsWalking = !Globals.ALL_WOLVES.get(getTriggerUnit())!.IsWalking
    }
}

export class WolfPointInfo {
    public x: number
    public y: number
    public LastPoint: boolean

    public WolfPointInfo() {
        this.x = 0
        this.y = 0
    }

    public static GetWolfPointList(): WolfPointInfo[] {
        let list = MemoryHandler.getEmptyArray<WolfPointInfo>()
        for (let i: number = 0; i < 48; i++) {
            list.push(MemoryHandler.getEmptyObject<WolfPointInfo>())
        }
        return list
    }

    public static ClearWolfPointList(list: WolfPointInfo[]) {
        if (list == null) return
        for (let i: number = 0; i < list.length; i++) {
            let item = list[i]
            MemoryHandler.destroyObject(item)
        }
        list = []
        MemoryHandler.destroyArray(list)
    }
}
