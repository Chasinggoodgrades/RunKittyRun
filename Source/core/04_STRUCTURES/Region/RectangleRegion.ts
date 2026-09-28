import { ParallelogramRegion } from './ParallelogramRegion'

function dot(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * x2 + y1 * y2
}

export class RectangleRegion extends ParallelogramRegion {
    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        // Get Parallelogramm Point3 so that the Parallelogram will be a Rectangle
        const deltaX2X1 = x2 - x1
        const deltaY2Y1 = y2 - y1
        const deltaX3X1 = x3 - x1
        const deltaY3Y1 = y3 - y1

        let parallelogramX3: number
        let parallelogramY3: number
        const points1_2_denominator = deltaX2X1 * deltaX2X1 + deltaY2Y1 * deltaY2Y1
        if (points1_2_denominator === 0) {
            // Points 1 and 2 at the same spot
            parallelogramX3 = x3
            parallelogramY3 = y3
        } else {
            const t = (deltaX3X1 * deltaX2X1 + deltaY3Y1 * deltaY2Y1) / points1_2_denominator
            const Xproj3to1_2 = x1 + t * deltaX2X1
            const Yproj3to1_2 = y1 + t * deltaY2Y1
            parallelogramX3 = x1 + x3 - Xproj3to1_2
            parallelogramY3 = y1 + y3 - Yproj3to1_2
        }

        super(x1, y1, x2, y2, parallelogramX3, parallelogramY3)
    }

    /**
     * Pre-calculations for areCoordsInRegion best performance
     */
    protected areCoordsInRegionPreCalculation() {
        super.areCoordsInRegionPreCalculation()

        // Important note: dotP1P2 and dotP1P4 ahve to be declared in root class or they will be set to 0 after areCoordsInRegionPreCalculation call
        this.dotP1P2 = dot(this.deltaX2X1, this.deltaY2Y1, this.deltaX2X1, this.deltaY2Y1)
        this.dotP1P4 = dot(this.middleVectorX, this.middleVectorY, this.middleVectorX, this.middleVectorY)
    }

    areCoordsInRegion(x: number, y: number) {
        // Let's say (x, y) is point P
        const deltaPxX1 = x - this.x1
        const deltaPyY1 = y - this.y1

        const u = dot(deltaPxX1, deltaPyY1, this.deltaX2X1, this.deltaY2Y1) / this.dotP1P2
        const v = dot(deltaPxX1, deltaPyY1, this.middleVectorX, this.middleVectorY) / this.dotP1P4

        return u >= 0 && u <= 1 && v >= 0 && v <= 1
    }
}
