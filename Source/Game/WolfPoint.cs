using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class WolfPoint
{
    private const float MaxDistance = 200f; // Max distance between points
    private Wolf Wolf { get; set; }
    public List<WolfPointInfo> PointsToVisit { get; set; } = new List<WolfPointInfo>();
    private region Region { get; set; }
    private trigger Trigger { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="WolfPoint"/> class.
    /// </summary>
    /// <param name="wolf">The wolf instance.</param>
    public WolfPoint(Wolf wolf)
    {
        Wolf = wolf;
        Trigger = trigger.Create();
        CreateEnterRegionTriggers();
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
            float xDiff = endX - startX;
            float yDiff = endY - startY;
            float distance = (float)Math.Sqrt(xDiff * xDiff + yDiff * yDiff);
            int numRegions = (int)Math.Ceiling(distance / MaxDistance);

            float stepX = xDiff / numRegions;
            float stepY = yDiff / numRegions;
            for (int i = 0; i < numRegions; i++)
            {
                float regionX = startX + (i * stepX);
                float regionY = startY + (i * stepY);
                var pointInfo = new WolfPointInfo(regionX, regionY);
                PointsToVisit.Add(pointInfo);
            }
            if(PointsToVisit != null && PointsToVisit.Count > 0)
                StartRects();
            Begin(endX, endY);
        }
        catch (Exception ex)
        {
            if (Source.Program.Debug) Console.WriteLine($"{ex.Message}");
        }
    }

    public void Cleanup()
    {
        if (PointsToVisit == null) return;
        for (int i = 0; i < PointsToVisit.Count; i++)
        {
            Region.RemoveCell(PointsToVisit[i].PointX, PointsToVisit[i].PointY);
            PointsToVisit[i] = null;
        }
        PointsToVisit.Clear();
    }

    public void Dispose()
    {
        Cleanup();
        Region.Dispose();
        Trigger.ClearActions();
        Trigger.Dispose();
        PointsToVisit = null;
    }

    private void Begin(float x, float y)
    {
        if (PointsToVisit.Count > 1) // If there are more points to visit, set the next point as the target
        {
            var nextPoint = PointsToVisit[1];
            Wolf.Unit.IssueOrder("move", nextPoint.PointX, nextPoint.PointY);
        }
        else
        {
            var point = PointsToVisit[0];
            Wolf.Unit.IssueOrder("move", point.PointX, point.PointY);
        }
    }

    private void CreateEnterRegionTriggers()
    {
        Region = region.Create();
        Trigger.RegisterEnterRegion(Region, Filter(() => GetFilterUnit() == Wolf.Unit));
        Trigger.AddAction(() =>
        {
            if (PointsToVisit.Count > 0)
            {
                Region.RemoveCell(PointsToVisit[0].PointX, PointsToVisit[0].PointY);
                PointsToVisit.RemoveAt(0);
                // If there are more points to visit, set the next point as the target
                if (PointsToVisit.Count > 0)
                {
                    var nextPoint = PointsToVisit[0];
                    Region.AddCell(nextPoint.PointX, nextPoint.PointY);
                    Wolf.Unit.IssueOrder("move", nextPoint.PointX, nextPoint.PointY);
                }
            }
        });
    }

    private void StartRects()
    {
        if (PointsToVisit.Count > 1)
        {
            var currentPoint = PointsToVisit[1];
            Region.AddCell(currentPoint.PointX, currentPoint.PointY);
            PointsToVisit.RemoveAt(0);
        }
    }

    public class WolfPointInfo
    {
        public float PointX { get; set; } = 0.0f;
        public float PointY { get; set; } = 0.0f;

        public WolfPointInfo(float pointX, float pointY)
        {
            PointX = pointX;
            PointY = pointY;
        }
    }
}
