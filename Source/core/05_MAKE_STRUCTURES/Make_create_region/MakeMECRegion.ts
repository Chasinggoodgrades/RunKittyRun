import { ServiceManager } from '../../../Services'
import { Text } from '../../01_libraries/Text'
import { CircleRegion } from '../../04_STRUCTURES/Region/CircleRegion'
import { HorizontalRegionDirection } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import { LineRegion } from '../../04_STRUCTURES/Region/LineRegion'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import { MakeBySeveralClicks } from '../Make/MakeBySeveralClicks'

export type MakeMECRegionMode = 'horizRect' | 'rect' | 'parallelogram' | 'trapeze' | 'circle' | 'line'

export abstract class MakeMECRegion extends MakeBySeveralClicks {
    protected mode: MakeMECRegionMode
    protected requiredLocsNumber: number
    private directionForHorizontal: HorizontalRegionDirection

    constructor(maker: unit, mode: MakeMECRegionMode, directionForHorizontal: HorizontalRegionDirection = 'up') {
        super(maker, 'mecRegionCreate')

        this.mode = mode

        if (mode === 'trapeze') this.requiredLocsNumber = 4
        else if (['rect', 'parallelogram'].includes(this.mode)) {
            this.requiredLocsNumber = 3
        } else {
            this.requiredLocsNumber = 2
        }

        this.directionForHorizontal = directionForHorizontal
    }

    drawLastLankmarkLine = () => {
        if (this.mode === 'trapeze' && this.currentMakingLocIndex === 2) {
            super.drawLastLankmarkLine(0, 2)
        } else {
            super.drawLastLankmarkLine()
        }
    }

    doActions = () => {
        if (super.doBaseActions()) {
            this.saveLoc(this.orderX, this.orderY)

            if (this.currentMakingLocIndex === this.requiredLocsNumber - 1) {
                const mecRegionService = ServiceManager.getService('MECRegionService')

                let mecRegion: MECRegion

                if (this.mode === 'horizRect') {
                    mecRegion = mecRegionService.newHorizontalRectangleRegionBackupToLine(
                        this.savedX[0],
                        this.savedY[0],
                        this.savedX[1],
                        this.savedY[1],
                        this.directionForHorizontal
                    )
                } else if (this.mode === 'rect') {
                    mecRegion = mecRegionService.newRectangleRegionBackupToLine(
                        this.savedX[0],
                        this.savedY[0],
                        this.savedX[1],
                        this.savedY[1],
                        this.savedX[2],
                        this.savedY[2]
                    )
                } else if (this.mode === 'parallelogram') {
                    mecRegion = mecRegionService.newParallelogramRegionBackupToLine(
                        this.savedX[0],
                        this.savedY[0],
                        this.savedX[1],
                        this.savedY[1],
                        this.savedX[2],
                        this.savedY[2]
                    )
                } else if (this.mode === 'trapeze') {
                    const distanceP3P4 = Math.sqrt(
                        (this.savedX[3] - this.savedX[2]) ** 2 + (this.savedY[3] - this.savedY[2]) ** 2
                    )

                    mecRegion = mecRegionService.newTrapezeRegionBackupToLine(
                        this.savedX[0],
                        this.savedY[0],
                        this.savedX[1],
                        this.savedY[1],
                        this.savedX[2],
                        this.savedY[2],
                        distanceP3P4
                    )
                } else if (this.mode === 'circle') {
                    const centerX = this.savedX[0]
                    const centerY = this.savedY[0]
                    const edgeX = this.savedX[1]
                    const edgeY = this.savedY[1]
                    const radius = Math.sqrt((edgeX - centerX) ** 2 + (edgeY - centerY) ** 2)
                    mecRegion = new CircleRegion(centerX, centerY, radius)
                } else if (this.mode === 'line') {
                    mecRegion = new LineRegion(this.savedX[0], this.savedY[0], this.savedX[1], this.savedY[1])
                } else {
                    throw new Error('MakeMECRegion: unknown mode "' + this.mode + '"')
                }

                this.unsaveLocsDefinitely()

                this.onMECRegionCreated(mecRegion)
            }
        }
    }

    /**
     * This function has to be reimplemented in children to do something with the created MEC region
     * @param mecRegion
     */
    onMECRegionCreated(mecRegion: MECRegion) {
        Text.mkP(this.makerOwner, `MEC "${this.mode}" region created and removed (no usage of it done)`)
        mecRegion.destroy()
    }
}
