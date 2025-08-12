export class ProgressPointHelper {
    public static Points: RectPoints[]
    public CurrentPoint: number

    public ProgressPointHelper() {
        Points ??= RectPoints.InitPoints()
        CurrentPoint = 0
    }
}

export class RectPoints {
    public X: number
    public Y: number

    public RectPoints(x: number, y: number) {
        X = x
        Y = y
    }

    public static InitPoints(): RectPoints[] {
        let points: RectPoints[] = []
        for (let point in RegionList.PathingPoints) {
            points.push(new RectPoints(point.Rect.CenterX, point.Rect.CenterY))
        }
        return points
    }
}
