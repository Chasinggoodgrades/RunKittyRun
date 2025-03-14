using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class WolfPoint
{
    private const float MaxDistance = 128f; // Max distance between points
    public static readonly int MoveOrderID = OrderId("move");
    public static readonly int StopOrderID = OrderId("stop");
    public static readonly int AttackOrderID = OrderId("attack");
    public static readonly int HoldPositionOrderID = OrderId("holdposition");
    public static trigger IsPausedTrigger;

    private Wolf Wolf { get; set; }
    public List<float[]> PointsToVisit { get; set; } = new List<float[]>();

    /// <summary>
    /// Initializes a new instance of the <see cref="WolfPoint"/> class.
    /// </summary>
    /// <param name="wolf">The wolf instance.</param>
    public WolfPoint(Wolf wolf)
    {
        Wolf = wolf;
        IsPausedTrigger ??= InitTrigger();
    }

    /// <summary>
    /// Creates regions between the start and end points.
    /// </summary>
    /// <param name="startX">The start point X coordinate.</param>
    /// <param name="startY">The start point Y coordinate.</param>
    /// <param name="endX">The end point X coordinate.</param>
    /// <param name="endY">The end point Y coordinate.</param>
    public void DiagonalRegionCreate(float startX, float startY, float endX, float endY)
    {
        try
        {
            if (PointsToVisit == null) return;
            Cleanup();

            // Calculate the distance between points
            var distance = WCSharp.Shared.Util.DistanceBetweenPoints(startX, startY, endX, endY);
            int numRegions = (int)Math.Ceiling(distance / MaxDistance);

            // Calculate angle and step sizes using trigonometry
            var angle = (float)Math.Atan2(endY - startY, endX - startX);
            var stepX = (float)(MaxDistance * Math.Cos(angle));
            var stepY = (float)(MaxDistance * Math.Sin(angle));

            for (int i = 0; i < numRegions; i++)
            {
                var regionX = startX + (i * stepX);
                var regionY = startY + (i * stepY);
                var pointInfo = new float[] { regionX, regionY };
                PointsToVisit.Add(pointInfo);
            }

            // Ensure the last point is exactly the end point
            float[] lastPointInfo = new float[] { endX, endY };
            PointsToVisit.Add(lastPointInfo);

            if (PointsToVisit != null && PointsToVisit.Count > 0)
            {
                StartMovingOrders();
            }
        }
        catch (Exception ex)
        {
            Logger.Warning($"WolfPoint.DiagonalRegionCreate {ex.Message}");
        }
    }

    public void Cleanup()
    {
        try
        {
            if (PointsToVisit == null) return;
            PointsToVisit.Clear();
            Wolf.Unit.ClearOrders();
        }
        catch (Exception ex)
        {
            Logger.Critical(ex.Message);
        }
    }

    public void Dispose()
    {
        Cleanup();
        PointsToVisit.Clear();
        PointsToVisit = null;
        Wolf.Unit.ClearOrders();
    }

    private void StartMovingOrders()
    {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        if (Wolf.IsPaused || Wolf.IsReviving) return;

        try
        {
            for (int i = PointsToVisit.Count - 1; i >= 1; i--)
            {
                var moveID = MoveOrderID;
                if (i == PointsToVisit.Count - 1) moveID = AttackOrderID;
                Wolf.Unit.QueueOrder(moveID, PointsToVisit[i][0], PointsToVisit[i][1]);
                if (!Wolf.IsWalking) Wolf.IsWalking = true; // ensure its set after queued order.
            }
        }
        catch (Exception ex)
        {
            Logger.Critical(ex.Message);
        }
    }

    private static trigger InitTrigger()
    {
        IsPausedTrigger = CreateTrigger();
        Blizzard.TriggerRegisterAnyUnitEventBJ(IsPausedTrigger, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER);

        TriggerAddCondition(IsPausedTrigger, Condition(() => GetIssuedOrderId() == AttackOrderID));
        TriggerAddCondition(IsPausedTrigger, Condition(() => GetTriggerUnit().UnitType == Wolf.WOLF_MODEL));

        // When Queued orders, it will proc twice. Once for being queued, then again once finishing the order.
        TriggerAddAction(IsPausedTrigger, () =>
        {
            try
            {
                Globals.ALL_WOLVES[@event.Unit].IsWalking = !Globals.ALL_WOLVES[@event.Unit].IsWalking;
                //Console.WriteLine($"Wolf: {Globals.ALL_WOLVES[@event.Unit].Unit.Name} is walking: {Globals.ALL_WOLVES[@event.Unit].IsWalking}");
            }
            catch (Exception ex)
            {
                Logger.Critical("Wolf Point: " + ex.Message);
            }
        });
        return IsPausedTrigger;
    }
}

public class WolfVisitPoints : IDestroyable
{
    public float X { get; set; }
    public float Y { get; set; }

    public WolfVisitPoints()
    {
    }

    public void __destroy(bool recursive = false)
    {
        MemoryHandler.DestroyObject(this, recursive);
    }
}
