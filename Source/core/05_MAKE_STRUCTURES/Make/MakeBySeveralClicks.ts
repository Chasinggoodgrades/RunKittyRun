import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { DrawLine } from '../../01_libraries/Draw_lines'
import { LandmarkForMake } from './LandmarkForMake'

export abstract class MakeBySeveralClicks extends Make {
    protected savedX: number[] = []
    protected savedY: number[] = []
    protected currentMakingLocIndex = -1
    private landmarkLines: lightning[] = MemoryHandler.getEmptyArray()

    private landmarkForMake?: LandmarkForMake

    constructor(maker: unit, kind: string, forSpecificLevel = true) {
        super(maker, kind, forSpecificLevel)
    }

    saveLoc = (x: number, y: number) => {
        this.currentMakingLocIndex++

        this.savedX[this.currentMakingLocIndex] = x
        this.savedY[this.currentMakingLocIndex] = y

        // Remove next saved locs cancelled with ctrl + Z before this saveLoc
        this.savedX.length = this.currentMakingLocIndex + 1
        this.savedY.length = this.currentMakingLocIndex + 1

        if (this.landmarkForMake) {
            this.landmarkForMake.move(x, y)
        } else {
            this.landmarkForMake = new LandmarkForMake(this.escaper, x, y)
        }

        this.drawLastLankmarkLine()

        this.escaper.destroyCancelledActions()
    }

    drawLastLankmarkLine(indexP1?: number, indexP2?: number) {
        if (indexP1 === undefined) indexP1 = this.currentMakingLocIndex - 1
        if (indexP2 === undefined) indexP2 = this.currentMakingLocIndex

        if (this.currentMakingLocIndex >= 1) {
            arrayPush(
                this.landmarkLines,
                DrawLine(
                    this.savedX[indexP1],
                    this.savedY[indexP1],
                    this.savedX[indexP2],
                    this.savedY[indexP2],
                    'white',
                    1
                )
            )
        }
    }

    unsaveLoc = () => {
        if (this.currentMakingLocIndex < 0) {
            return false
        }

        if (this.currentMakingLocIndex >= 1) {
            DestroyLightning(this.landmarkLines[this.landmarkLines.length - 1])
            this.landmarkLines.pop()
        }

        this.currentMakingLocIndex--

        if (this.currentMakingLocIndex >= 0) {
            this.landmarkForMake &&
                this.landmarkForMake.move(
                    this.savedX[this.currentMakingLocIndex],
                    this.savedY[this.currentMakingLocIndex]
                )
        } else {
            this.landmarkForMake && this.landmarkForMake.destroy()
            delete this.landmarkForMake
        }

        return true
    }

    unsaveLocsDefinitely = () => {
        this.savedX.length = 0
        this.savedY.length = 0
        this.currentMakingLocIndex = -1
        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake

        for (let i = 0; i < this.landmarkLines.length; i++) {
            DestroyLightning(this.landmarkLines[i])
        }
        this.landmarkLines.length = 0
    }

    cancelLastAction = () => {
        return this.unsaveLoc()
    }

    redoLastAction = () => {
        if (this.currentMakingLocIndex < this.savedX.length - 1) {
            this.currentMakingLocIndex++
            if (this.landmarkForMake) {
                this.landmarkForMake.move(
                    this.savedX[this.currentMakingLocIndex],
                    this.savedY[this.currentMakingLocIndex]
                )
            } else {
                this.landmarkForMake = new LandmarkForMake(
                    this.escaper,
                    this.savedX[this.currentMakingLocIndex],
                    this.savedY[this.currentMakingLocIndex]
                )
            }
            return true
        }
        return false
    }

    destroy = () => {
        super.destroy()

        this.unsaveLocsDefinitely()
    }
}
