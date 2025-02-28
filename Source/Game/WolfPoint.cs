using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;

public class WolfPoint
{
    private const float MaxDistance = 400f; // Max distance between points
    public readonly static int MoveOrderID = OrderId("move");
    private Wolf Wolf { get; set; }
    public List<float[]> PointsToVisit { get; set; } = new List<float[]>();

    /// <summary>
    /// Initializes a new instance of the <see cref="WolfPoint"/> class.
    /// </summary>
    /// <param name="wolf">The wolf instance.</param>
    public WolfPoint(Wolf wolf)
    {
        Wolf = wolf;
    }

    /// <summary>
    /// Creates regions between the start and end points.
    /// </summary>
    /// <param name="startX">The start point X coordinate.</param>
    /// <param name="startY">The start point Y coordinate.</param>
    /// <param name="endX">The end point X coordinate.</param>
    /// <param name="endY">The end point Y coordinate.</param>
    public void CreateRegionsBetweenPoints(float startX, float startY, float endX, float endY)
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
            var lastPointInfo = new float[] { endX, endY };
            PointsToVisit.Add(lastPointInfo);

            if (PointsToVisit != null && PointsToVisit.Count > 0)
            {
                StartMovingOrders();
            }
        }
        catch (Exception ex)
        {
            if (Source.Program.Debug) Console.WriteLine($"{ex.Message}");
        }
    }


    public void Cleanup()
    {
        if (PointsToVisit == null) return;
        PointsToVisit.Clear();
        Wolf.Unit.ClearOrders();
    }

    public void Dispose()
    {
        Cleanup();
        PointsToVisit.Clear();
        PointsToVisit = null;
    }

    private void StartMovingOrders()
    {
        // WC3 QueueOrders works like a stack, so treat with LIFO.
        for (int i = PointsToVisit.Count -1; i >= 1; i--)
        {
            Wolf.Unit.QueueOrder(MoveOrderID, PointsToVisit[i][0], PointsToVisit[i][1]); 
        }
    }
}
