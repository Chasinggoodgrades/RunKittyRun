using System;
using System.Collections.Generic;
using System.ComponentModel;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class WolfPoint
{
    private const float MaxDistance = 400f; // Max distance between points
    private Wolf Wolf { get; set; }
    public List<WolfPointInfo> PointsToVisit { get; set; } = new List<WolfPointInfo>();
    private region Region { get; set; }
    private trigger Trigger { get; set; }
    private int CurrentIndex = 1;

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
            if(PointsToVisit != null && PointsToVisit.Count > 0) StartRects();
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
            PointsToVisit[i] = null;
        }
        Region.Dispose();
        PointsToVisit.Clear();
        CurrentIndex = 1;
    }

    public void Dispose()
    {
        Cleanup();
        //Region.RemoveRect(CurrentRect);
        Region.Dispose();
        //CurrentRect.Dispose();
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
            Wolf.Unit.IssueOrder("move", x, y);
        }
    }

    private void CreateEnterRegionTriggers()
    {
        Trigger.AddAction(() =>
        {
            if (CurrentIndex > PointsToVisit.Count - 1) return;
            //Region.RemoveRect(CurrentRect);
            // If there are more points to visit, set the next point as the target
            CurrentIndex = CurrentIndex + 1;
            if (CurrentIndex < PointsToVisit.Count)
            {
                var nextPoint = PointsToVisit[CurrentIndex];
                var r = rect.Create(-25, -25, 25, 25);
                r.MoveTo(nextPoint.PointX, nextPoint.PointY);
                Region.AddRect(r);
                r.Dispose();
                Wolf.Unit.IssueOrder("move", nextPoint.PointX, nextPoint.PointY);
            }
        });
    }

    private void StartRects()
    {
        Region = region.Create();
        Trigger.RegisterEnterRegion(Region, Filter(() => GetFilterUnit() == Wolf.Unit));
        if (PointsToVisit.Count > 1)
        {
            var r = rect.Create(-25, -25, 25, 25);
            r.MoveTo(PointsToVisit[1].PointX, PointsToVisit[1].PointY);
            Region.AddRect(r);
            r.Dispose();
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
