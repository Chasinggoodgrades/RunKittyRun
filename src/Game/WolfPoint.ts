

class WolfPoint
{
    private MaxDistance: number = 128; // Max distance between points
    public static readonly MoveOrderID: number = OrderId("move");
    public static readonly StopOrderID: number = OrderId("stop");
    public static readonly AttackOrderID: number = OrderId("attack");
    public static readonly HoldPositionOrderID: number = OrderId("holdposition");
    public static IsPausedTrigger: trigger;

    private Wolf!: Wolf
    private PointInfo!: WolfPointInfo[]

    /// <summary>
    /// Initializes a new instance of the <see cref="WolfPoint"/> class.
    /// </summary>
    /// <param name="wolf">The wolf instance.</param>
    public WolfPoint(wolf: Wolf)
    {
        this.Wolf = wolf;
        this.IsPausedTrigger ??= this.InitTrigger();
    }

    /// <summary>
    /// Creates regions between the start and end points.
    /// </summary>
    /// <param name="startX">The start point X coordinate.</param>
    /// <param name="startY">The start point Y coordinate.</param>
    /// <param name="endX">The end point X coordinate.</param>
    /// <param name="endY">The end point Y coordinate.</param>
    public DiagonalRegionCreate(startX: number, startY: number, endX: number, endY: number)
    {
        try
        {
            PointInfo ??= WolfPointInfo.GetWolfPointList();
            Cleanup();

            // Calculate the distance between points
            let distance = WCSharp.Shared.Util.DistanceBetweenPoints(startX, startY, endX, endY);
            let numRegions: number = Math.Ceiling(distance / MaxDistance);

            // Calculate angle and step sizes using trigonometry
            let angle = Math.Atan2(endY - startY, endX - startX);
            let stepX = (MaxDistance * Math.Cos(angle));
            let stepY = (MaxDistance * Math.Sin(angle));

            for (let i: number = 0; i < numRegions; i++)
            {
                let regionX = startX + (i * stepX);
                let regionY = startY + (i * stepY);
                PointInfo[i].X = regionX;
                PointInfo[i].Y = regionY;
                PointInfo[i].LastPoint = false;
            }

            // Ensure the last point is exactly the end point
            PointInfo[numRegions].X = endX;
            PointInfo[numRegions].Y = endY;
            PointInfo[numRegions].LastPoint = true;

            if (PointInfo != null && PointInfo.Count > 0)
            {
                this.StartMovingOrders();
            }
        }
        catch (ex: Error)
        {
            Logger.Warning("WolfPoint.DiagonalRegionCreate {ex.Message}");
        }
    }

    public Cleanup()
    {
        try
        {
            if (PointInfo == null) return;
            Wolf.Unit.ClearOrders();

            for (let i: number = 0; i < PointInfo.Count; i++)
            {
                PointInfo[i].X = 0;
                PointInfo[i].Y = 0;
            }
        }
        catch (ex: Error)
        {
            Logger.Critical("up: error: Clean: WolfPoint: {ex.Message}");
        }
    }

    public Dispose()
    {
        this.Cleanup();
        WolfPointInfo.ClearWolfPointList(this.PointInfo);
        BlzUnitClearOrders(this.Wolf.Unit, false);
    }

    private StartMovingOrders()
    {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        if (Wolf.IsPaused || Wolf.IsReviving)
        {
            Wolf.Unit.ClearOrders();
            return;
        }

        try
        {
            for (let i: number = PointInfo.Count - 1; i >= 1; i--)
            {
                if (PointInfo[i].X == 0 && PointInfo[i].Y == 0) continue;
                let moveID = PointInfo[i].LastPoint ? AttackOrderID : MoveOrderID;

                Wolf.Unit.QueueOrder(moveID, PointInfo[i].X, PointInfo[i].Y);
                if (!Wolf.IsWalking) Wolf.IsWalking = true; // ensure its set after queued order.
            }
        }
        catch (ex: Error)
        {
            Logger.Critical("WolfPoint.StartMovingOrders {ex.Message}");
        }
    }

    private static InitTrigger(): trigger
    {
        this.IsPausedTrigger ??= CreateTrigger();
        TriggerRegisterAnyUnitEventBJ(this.IsPausedTrigger, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER);

        TriggerAddCondition(this.IsPausedTrigger, FilterList.IssuedOrderAtkOrder);
        TriggerAddCondition(this.IsPausedTrigger, FilterList.UnitTypeWolf);

        // When Queued orders, it will proc twice. Once for being queued, then again once finishing the order.
        TriggerAddAction(this.IsPausedTrigger, this.QueueOrderActions);
        return this.IsPausedTrigger;
    }

    private static QueueOrderActions()
    {
        Globals.ALL_WOLVES[GetTriggerUnit()].IsWalking = !Globals.ALL_WOLVES[GetTriggerUnit()].IsWalking;
    }
}

class WolfPointInfo
{
    public X!: number 
    public Y!: number 
    public LastPoint!: boolean 

    public WolfPointInfo()
    {
        this.X = 0;
        this.Y = 0;
    }

    public static  GetWolfPointList():WolfPointInfo[]
    {
        let list = ObjectPool<WolfPointInfo>.GetEmptyList();
        for (let i: number = 0; i < 48; i++)
        {
            list.Add(ObjectPool.GetEmptyObject<WolfPointInfo>());
        }
        return list;
    }

    public static ClearWolfPointList( list:WolfPointInfo[])
    {
        if (list == null) return;
        for (let i: number = 0; i < list.Count; i++)
        {
            let item = list[i];
            ObjectPool<WolfPointInfo>.ReturnObject(item);
        }
        list.Clear();
        ObjectPool<WolfPointInfo>.ReturnList(list);
    }
}
