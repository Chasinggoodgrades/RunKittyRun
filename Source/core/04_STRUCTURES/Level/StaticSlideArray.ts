import { BaseArray } from '../BaseArray'
import type { Level } from './Level'
import { StaticSlide } from './StaticSlide'

export class StaticSlideArray extends BaseArray<StaticSlide> {
    private level: Level

    constructor(level: Level) {
        super(true)
        this.level = level
    }

    /** The static slide whose entry area holds this point, if the level has one there */
    findEntryAtCoords = (x: number, y: number) => {
        for (const [_, staticSlide] of pairs(this.getAll())) {
            if (staticSlide.areCoordsInEntry(x, y)) {
                return staticSlide
            }
        }

        return undefined
    }

    new = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        x4: number,
        y4: number,
        angle: number,
        speed: number
    ) => {
        const staticSlide = new StaticSlide(x1, y1, x2, y2, x3, y3, x4, y4, angle, speed)

        staticSlide.id = this._new(staticSlide)
        staticSlide.level = this.level

        this.level.updateDebugRegions()

        return staticSlide
    }

    newFromJson = (staticSlidesJson: { [x: string]: any }[]) => {
        for (const s of staticSlidesJson) {
            const staticSlide = this.new(s.x1, s.y1, s.x2, s.y2, s.x3, s.y3, s.x4, s.y4, s.angle, s.speed)

            if (s.canTurnAngle) {
                staticSlide.setCanTurnAngle(s.canTurnAngle)
            }
        }
    }

    removeStaticSlide = (itemId: number) => {
        delete this.data[itemId]

        this.level.updateDebugRegions()
    }

    removeAllStaticSlides = () => {
        for (const [_, staticSlide] of pairs(this.data)) {
            staticSlide.destroy()
        }

        this.level.updateDebugRegions()
    }

    activate = (activ: boolean) => {
        for (const [_, staticSlide] of pairs(this.data)) {
            staticSlide.activate(activ)
        }
    }

    getStaticSlideFromPoint = (x: number, y: number): StaticSlide | null => {
        for (const [_, staticSlide] of pairs(this.data)) {
            if (staticSlide.containsPoint(x, y)) {
                return staticSlide
            }
        }

        return null
    }
}
