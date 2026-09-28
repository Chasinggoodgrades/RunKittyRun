import { MECRegion } from './MECRegion'
import { Constants } from '../../01_libraries/Constants'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { arrayPush } from '../../01_libraries/Basic_functions'

export class CircleRegion extends MECRegion {
    private centerX: number
    private centerY: number
    private radius: number
    private radiusSquare: number

    constructor(centerX: number, centerY: number, radius: number) {
        super()

        this.centerX = centerX
        this.centerY = centerY
        this.radius = radius
        this.radiusSquare = radius * radius
    }

    areCoordsInRegion(x: number, y: number) {
        const dx = x - this.centerX
        const dy = y - this.centerY
        return dx * dx + dy * dy <= this.radiusSquare
    }

    generateDebugEffects(): effect[] {
        const z =
            -(Constants.COLLISION_LANDMARK_MODEL_BASE_HEIGHT * this.radius) /
            Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS

        const circleEffect = AddSpecialEffect(Constants.COLLISION_LANDMARK_MODEL, this.centerX, this.centerY)
        if (!circleEffect) {
            throw new Error("Couldn't create region circle effect")
        }
        BlzSetSpecialEffectPosition(circleEffect, this.centerX, this.centerY, z)
        const scale = this.radius / Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
        BlzSetSpecialEffectScale(circleEffect, scale)

        arrayPush(this.debugEffects, circleEffect)

        return this.debugEffects
    }

    getArea() {
        return Math.PI * this.radiusSquare
    }

    getCenterX(): number {
        return this.centerX
    }

    getCenterY(): number {
        return this.centerY
    }

    toJson(): any {
        const output = super.toJson()

        output.centerX = R2I(this.centerX)
        output.centerY = R2I(this.centerY)
        output.radius = this.radius

        return output
    }

    toText(detailled = false) {
        return super.toText() + (detailled ? ': radius(' + this.radius + ')' : '')
    }
}
