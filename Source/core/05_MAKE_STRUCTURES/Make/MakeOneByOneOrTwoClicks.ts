import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { LandmarkForMake } from './LandmarkForMake'

export abstract class MakeOneByOneOrTwoClicks extends Make {
    lastX: number = 0
    lastY: number = 0

    private lastLocIsSaved: boolean
    private lastLocSavedIsUsed: boolean
    private landmarkForMake?: LandmarkForMake
    private mode: string
    private acceptedModes: string[] = ['oneByOne', 'twoClics']

    constructor(
        maker: unit,
        kind: string,
        mode: string = '',
        acceptedModes: string[] | null = null,
        forSpecificLevel = true
    ) {
        //modes : oneByOne, twoClics
        super(maker, kind, forSpecificLevel)

        if (acceptedModes) {
            this.acceptedModes = acceptedModes
        }

        if (!this.acceptedModes.includes(mode)) {
            throw this.constructor.name + ' : wrong mode "' + mode + '"'
        }

        this.mode = mode
        this.lastLocIsSaved = false
        this.lastLocSavedIsUsed = false
    }

    isLastLocSavedUsed = () => {
        return this.lastLocSavedIsUsed
    }

    saveLoc = (x: number, y: number) => {
        this.lastX = x
        this.lastY = y
        this.lastLocIsSaved = true
        this.lastLocSavedIsUsed = true

        this.landmarkForMake && this.landmarkForMake.destroy()
        this.landmarkForMake = new LandmarkForMake(this.escaper, x, y)

        this.escaper.destroyCancelledActions()
    }

    unsaveLoc = () => {
        if (!this.lastLocSavedIsUsed) {
            return false
        }

        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake
        this.lastLocSavedIsUsed = false

        return true
    }

    unsaveLocDefinitely = () => {
        this.unsaveLoc()
        this.lastLocIsSaved = false
        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake
    }

    cancelLastAction = () => {
        return this.unsaveLoc()
    }

    redoLastAction = () => {
        if (this.lastLocIsSaved && !this.lastLocSavedIsUsed) {
            this.saveLoc(this.lastX, this.lastY)
            return true
        }
        return false
    }

    getMode = () => {
        return this.mode
    }

    destroy = () => {
        super.destroy()

        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake
    }
}
