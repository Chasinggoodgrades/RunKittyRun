import { RegionList } from 'src/Global/RegionList'

export class ProgressPointHelper {
    public static Points: RectPoints[]
    public CurrentPoint: number

    public constructor() {
        ProgressPointHelper.Points ??= RectPoints.InitPoints()
        this.CurrentPoint = 0
    }
}

export class RectPoints {
    public x: number
    public y: number

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
