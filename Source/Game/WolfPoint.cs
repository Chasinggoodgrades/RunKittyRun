using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class WolfPoint
{
    private const float MaxDistance = 400f; // Max distance between points

    private Wolf Wolf { get; set; }
    private List<WolfPointInfo> PointsToVisit { get; } = new List<WolfPointInfo>();

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
    /// <param name="startPoint">The start point coordinates.</param>
    /// <param name="endPoint">The end point coordinates.</param>
    public void CreateRegionsBetweenPoints((float x, float y) startPoint, (float x, float y) endPoint)
    {
        Cleanup();
        float xDiff = endPoint.x - startPoint.x;
        float yDiff = endPoint.y - startPoint.y;
        float distance = (float)Math.Sqrt(xDiff * xDiff + yDiff * yDiff);
        int numRegions = (int)Math.Ceiling(distance / MaxDistance);

        float stepX = xDiff / numRegions;
        float stepY = yDiff / numRegions;

        for (int i = 0; i < numRegions; i++)
        {
            float regionX = startPoint.x + (i * stepX);
            float regionY = startPoint.y + (i * stepY);
            region newRegion = region.Create();
            rect regionRect = CreateRect(newRegion, regionX, regionY);
            var pointInfo = new WolfPointInfo(newRegion, null, regionRect); // Set triggers later
            PointsToVisit.Add(pointInfo);
        }
        CreateEnterRegionTriggers();
        Begin(endPoint.x, endPoint.y);
    }

    private void Cleanup()
    {
        foreach (var point in PointsToVisit)
        {
            point.Dispose();
        }
        PointsToVisit.Clear();
    }

    private void Begin(float x, float y)
    {
        if (PointsToVisit.Count > 1) // If there are more points to visit, set the next point as the target
        {
            var nextPoint = PointsToVisit[1];
            Wolf.Unit.IssueOrder("move", nextPoint.Rect.CenterX, nextPoint.Rect.CenterY);
        }
        else // If there is only one point, just move to endPoint
        {
            Wolf.Unit.IssueOrder("move", x, y);
        }
    }

    private rect CreateRect(region region, float x, float y)
    {
        var regionRect = rect.Create(-25, -25, 25, 25); // Just a small region size
        regionRect.MoveTo(x, y);
        region.AddRect(regionRect);
        return regionRect;
    }

    private void CreateEnterRegionTriggers()
    {
        foreach (var point in PointsToVisit)
        {
            point.Trigger = trigger.Create();
            point.Trigger.RegisterEnterRegion(point.Region, Filter(() => GetFilterUnit() == Wolf.Unit));
            point.Trigger.AddAction(() =>
            {
                if (point == PointsToVisit[PointsToVisit.Count - 1]) // last point , cleanup and return
                {
                    Cleanup();
                    return;
                }
                var nextPoint = PointsToVisit[PointsToVisit.IndexOf(point) + 1];
                Wolf.Unit.IssueOrder("move", nextPoint.Rect.CenterX, nextPoint.Rect.CenterY);
            });
        }
    }

    private class WolfPointInfo
    {
        public region Region { get; }
        public trigger Trigger { get; set; }
        public rect Rect { get; }

        public WolfPointInfo(region region, trigger trigger, rect rect)
        {
            Region = region;
            Trigger = trigger;
            Rect = rect;
        }

        public void Dispose()
        {
            Rect.Dispose();
            Trigger.Dispose();
            Region.Dispose();
        }
    }
}
