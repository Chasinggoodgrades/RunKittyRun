import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { TrapezeRegion } from './TrapezeRegion'

export class ParallelogramRegion extends TrapezeRegion {
    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        // In a parallelogram, the distance between P3 and P4 is the same as the distance between P1 and P2
        const distanceP3P4 = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        super(x1, y1, x2, y2, x3, y3, distanceP3P4)
    }

    redefineZone() {
        super.redefineZone()

        const directionAngle = Math.atan2(this.middleVectorY, this.middleVectorX)
        this.directionAngleCos = Math.cos(directionAngle)
        this.directionAngleSine = Math.sin(directionAngle)
    }

    toJson() {
        const output = MemoryHandler.getEmptyObject<any>()

        output.type = this.constructor.name
        output.x1 = R2I(this.x1)
        output.y1 = R2I(this.y1)
        output.x2 = R2I(this.x2)
        output.y2 = R2I(this.y2)
        output.x3 = R2I(this.x3)
        output.y3 = R2I(this.y3)

        return output
    }
}
