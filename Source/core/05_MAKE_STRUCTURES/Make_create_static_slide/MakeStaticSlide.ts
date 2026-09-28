import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import { StaticSlide } from 'core/04_STRUCTURES/Level/StaticSlide'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { createPoint, IPoint } from 'Utils/Point'

export class MakeStaticSlide extends Make {
    private staticSlide?: StaticSlide

    private points = MemoryHandler.getEmptyArray<IPoint>()
    private angle: number
    private speed: number

    constructor(maker: unit, angle: number, speed: number) {
        super(maker, 'createStaticSlide')
        this.angle = angle
        this.speed = speed
    }

    private createStaticSlide = () => {
        if (
            this.points[0]?.x !== undefined &&
            this.points[0]?.y !== undefined &&
            this.points[1]?.x !== undefined &&
            this.points[1]?.y !== undefined &&
            this.points[2]?.x !== undefined &&
            this.points[2]?.y !== undefined &&
            this.points[3]?.x !== undefined &&
            this.points[3]?.y !== undefined
        ) {
            this.staticSlide = this.escaper
                .getMakingLevel()
                .staticSlides.new(
                    this.points[0].x,
                    this.points[0].y,
                    this.points[1].x,
                    this.points[1].y,
                    this.points[2].x,
                    this.points[2].y,
                    this.points[3].x,
                    this.points[3].y,
                    this.angle,
                    this.speed
                )

            this.staticSlide.activate(true)
        }
    }

    clickMade = () => {
        Text.mkP(this.makerOwner, 'point added')
        arrayPush(this.points, createPoint(this.orderX, this.orderY))

        if (this.points.length === 4) {
            this.createStaticSlide()
            Text.mkP(this.makerOwner, 'static slide made')
            this.escaper.destroyMake()
        }
    }

    doActions = () => {
        if (super.doBaseActions()) {
            this.clickMade()
        }
    }

    destroy() {
        this.points.__destroy(true)
        super.destroy()
    }
}
