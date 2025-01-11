using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class WolfPoint
{
    private static float MAX_DISTANCE = 400; // max distance between points
    private Wolf Wolf { get; set; }
    private List<WolfPointInfo> PointsToVisit { get; set; } = new List<WolfPointInfo>();
    public (float x, float y) StartPoint { get; set; }
    public (float x, float y) EndPoint { get; set; }

    public WolfPoint(Wolf wolf)
    {
        Wolf = wolf;
    }

    public void CreateRegionsBetweenPoints((float x, float y) startPoint, (float x, float y) endPoint)
    {
        Cleanup();
        float xDiff = endPoint.x - startPoint.x;
        float yDiff = endPoint.y - startPoint.y;
        float distance = (float)Math.Sqrt(xDiff * xDiff + yDiff * yDiff);

        int numRegions = (int)Math.Ceiling(distance / MAX_DISTANCE);
        //Console.WriteLine($"Distance: {distance} | Num Regions: {numRegions}");
        float stepX = xDiff / numRegions;
        float stepY = yDiff / numRegions;

        for (int i = 0; i < numRegions; i++)
        {
            float regionX = startPoint.x + (i * stepX);
            float regionY = startPoint.y + (i * stepY);
            region newRegion = region.Create();
            rect regionRect = CreateRectForRegion(newRegion, regionX, regionY);
            var pointInfo = new WolfPointInfo(newRegion, null, regionRect); // set triggers later.
            PointsToVisit.Add(pointInfo);

            //Console.WriteLine($"Region {i}: ({regionX}, {regionY})");
        }
        CreateEnterRegionTrig();
        //Begin();
    }

    private void Cleanup()
    {
        foreach (var point in PointsToVisit) point.Dispose();
        PointsToVisit.Clear();
    }

    private void Begin()
    {
        var point = PointsToVisit[0];
        Console.WriteLine($"Moving to initial point: ({point.Rect.CenterX}, {point.Rect.CenterY})");
        Wolf.Unit.IssueOrder("move", point.Rect.CenterX, point.Rect.CenterY);
    }

    private rect CreateRectForRegion(region region, float x, float y)
    {
        rect r = rect.Create(-75,-75,75,75);
        r.MoveTo(x, y);
        region.AddRect(r);
        return r;
    }

    private void CreateEnterRegionTrig()
    {
        // creating enter region trigger, that tells unit to move to the next point
        foreach (var point in PointsToVisit)
        {
            point.Trigger = trigger.Create();
            point.Trigger.RegisterEnterRegion(point.Region, Filter(() => GetFilterUnit() == Wolf.Unit));
            point.Trigger.AddAction(() =>
            {
                Console.WriteLine($"Entered region: ({point.Rect.CenterX}, {point.Rect.CenterY})");
                if (point == PointsToVisit[PointsToVisit.Count - 1]) return; // if last point, do nothing
                Console.WriteLine(point.Rect.CenterX + " " + point.Rect.CenterY);
                var nextPoint = PointsToVisit[PointsToVisit.IndexOf(point) + 1];
                Wolf.Unit.IssueOrder("move", nextPoint.Rect.CenterX, nextPoint.Rect.CenterY);
            });
        }
    }

    private class WolfPointInfo
    {
        public region Region;
        public trigger Trigger;
        public rect Rect;

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
