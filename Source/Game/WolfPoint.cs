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
    private List<WolfPointInfo> PointInfo { get; set; }


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
            PointInfo ??= WolfPointInfo.GetWolfPointList();
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
                PointInfo[i].X = regionX;
                PointInfo[i].Y = regionY;
            }

            // Ensure the last point is exactly the end point
            PointInfo[numRegions].X = endX;
            PointInfo[numRegions].Y = endY;

            if (PointInfo != null && PointInfo.Count > 0)
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
            if (PointInfo == null) return;
            Wolf.Unit.ClearOrders();

            for (int i = 0; i < PointInfo.Count; i++)
            {
                PointInfo[i].X = 0;
                PointInfo[i].Y = 0;
            }
        }
        catch (Exception ex)
        {
            Logger.Critical($"Clean up error: WolfPoint: {ex.Message}");
        }
    }

    public void Dispose()
    {
        Cleanup();
        WolfPointInfo.ClearWolfPointList(PointInfo);
        Wolf.Unit.ClearOrders();
    }

    private void StartMovingOrders()
    {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        if (Wolf.IsPaused || Wolf.IsReviving)
        {
            Wolf.Unit.ClearOrders();
            return;
        }

        try
        {
            for (int i = PointInfo.Count - 1; i >= 1; i--)
            {
                if (PointInfo[i].X == 0 && PointInfo[i].Y == 0) continue;
                var moveID = MoveOrderID;
                if (i == PointInfo.Count - 1) moveID = AttackOrderID;
                Wolf.Unit.QueueOrder(moveID, PointInfo[i].X, PointInfo[i].Y);
                if (!Wolf.IsWalking) Wolf.IsWalking = true; // ensure its set after queued order.
            }
        }
        catch (Exception ex)
        {
            Logger.Critical($"WolfPoint.StartMovingOrders {ex.Message}");
        }
    }

    private static trigger InitTrigger()
    {
        IsPausedTrigger = CreateTrigger();
        Blizzard.TriggerRegisterAnyUnitEventBJ(IsPausedTrigger, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER);

        TriggerAddCondition(IsPausedTrigger, FilterList.IssuedOrderAtkOrder);
        TriggerAddCondition(IsPausedTrigger, FilterList.UnitTypeWolf);

        // When Queued orders, it will proc twice. Once for being queued, then again once finishing the order.
        TriggerAddAction(IsPausedTrigger, () =>
        {
            Globals.ALL_WOLVES[@event.Unit].IsWalking = !Globals.ALL_WOLVES[@event.Unit].IsWalking;
        });
        return IsPausedTrigger;
    }

    private class WolfPointInfo
    {
        public float X { get; set; }
        public float Y { get; set; }

        public WolfPointInfo()
        {
            X = 0;
            Y = 0;
        }

        public static List<WolfPointInfo> GetWolfPointList()
        {
            var list = ObjectPool.GetEmptyList<WolfPointInfo>();
            for (int i = 0; i < 48; i++)
            {
                list.Add(ObjectPool.GetEmptyObject<WolfPointInfo>());
            }
            return list;
        }

        public static void ClearWolfPointList(List<WolfPointInfo> list)
        {
            if (list == null) return;
            for (int i = 0; i < list.Count; i++)
            {
                var item = list[i];
                ObjectPool.ReturnObject(item);
            }
            list.Clear();
            ObjectPool.ReturnList(list);
        }
    }
}
