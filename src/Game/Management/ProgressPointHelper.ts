

class ProgressPointHelper
{
    public static List<RectPoints> Points;
    public CurrentPoint: number;

    public ProgressPointHelper()
    {
        Points ??= RectPoints.InitPoints();
        CurrentPoint = 0;
    }
}

class RectPoints
{
    public X: number 
    public Y: number 

    public RectPoints(x: number, y: number)
    {
        X = x;
        Y = y;
    }

    public static List<RectPoints> InitPoints()
    {
        List<RectPoints> points = new List<RectPoints>();
        for (let point in RegionList.PathingPoints)
        {
            points.Add(new RectPoints(point.Rect.CenterX, point.Rect.CenterY));
        }
        return points;
    }
}