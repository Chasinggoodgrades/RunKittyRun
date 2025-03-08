using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class ProgressPointHelper
{
    public static List<RectPoints> Points;
    public int CurrentPoint;

    public ProgressPointHelper()
    {
        Points ??= RectPoints.InitPoints();
        CurrentPoint = 0;
    }
}

public class RectPoints
{
    public float X { get; set; }
    public float Y { get; set; }

    public RectPoints(float x, float y)
    {
        X = x;
        Y = y;
    }

    public static List<RectPoints> InitPoints()
    {
        List<RectPoints> points = new List<RectPoints>();
        foreach (var point in RegionList.PathingPoints)
        {
            points.Add(new RectPoints(point.Rect.CenterX, point.Rect.CenterY));
        }
        return points;
    }
}