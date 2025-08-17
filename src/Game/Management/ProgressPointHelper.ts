import { RegionList } from 'src/Global/RegionList'

export class ProgressPointHelper {
    public static Points: RectPoints[]
    public CurrentPoint = 0

    public constructor() {
        ProgressPointHelper.Points ??= RectPoints.InitPoints()
        this.CurrentPoint = 0
    }
}

export class RectPoints {
    public x = 0
    public y = 0

    public constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    public static InitPoints(): RectPoints[] {
        let points: RectPoints[] = []
        for (let point of RegionList.PathingPoints) {
            points.push(new RectPoints(point.centerX, point.centerY))
        }
        return points
    }
}
