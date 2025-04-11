using System;
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
    private float[] XPoints { get; set; } = new float[50];
    private float[] YPoints { get; set; } = new float[50];


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
            if (XPoints == null) return;
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
                XPoints[i] = regionX;
                YPoints[i] = regionY;
            }

            // Ensure the last point is exactly the end point
            XPoints[numRegions] = endX;
            YPoints[numRegions] = endY;

            if (XPoints != null && XPoints.Length > 0)
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
            if (XPoints == null) return;
            Wolf.Unit.ClearOrders();

            for (int i = 0; i < XPoints.Length; i++)
            {
                XPoints[i] = 0;
                YPoints[i] = 0;
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
        XPoints = null;
        YPoints = null;
        Wolf.Unit.ClearOrders();
    }

    private void StartMovingOrders()
    {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        if (Wolf.IsPaused || Wolf.IsReviving) return;

        try
        {
            for (int i = XPoints.Length - 1; i >= 1; i--)
            {
                if (XPoints[i] == 0 && YPoints[i] == 0) continue;
                var moveID = MoveOrderID;
                if (i == XPoints.Length - 1) moveID = AttackOrderID;
                Wolf.Unit.QueueOrder(moveID, XPoints[i], YPoints[i]);
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

        TriggerAddCondition(IsPausedTrigger, FilterList.IssuedOrderAtkOrder);
        TriggerAddCondition(IsPausedTrigger, FilterList.UnitTypeWolf);

        // When Queued orders, it will proc twice. Once for being queued, then again once finishing the order.
        TriggerAddAction(IsPausedTrigger, () =>
        {
            Globals.ALL_WOLVES[@event.Unit].IsWalking = !Globals.ALL_WOLVES[@event.Unit].IsWalking;
        });
        return IsPausedTrigger;
    }
}
