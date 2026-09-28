import { Text } from 'core/01_libraries/Text'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { MakeTerrainCopyPasteAction } from '../MakeLastActions/MakeTerrainCopyPasteAction'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { LandmarkForMake } from '../Make/LandmarkForMake'

export class MakeTerrainCopyPaste extends Make {
    x1: number = 0
    y1: number = 0
    x2: number = 0
    y2: number = 0
    x3: number = 0
    y3: number = 0
    private landmarkForMake1?: LandmarkForMake
    private landmarkForMake2?: LandmarkForMake
    private landmarkForMake3?: LandmarkForMake
    private isPoint1Saved: boolean
    private isPoint2Saved: boolean
    private isPoint3Saved: boolean
    private isPoint1Used: boolean
    private isPoint2Used: boolean
    private isPoint3Used: boolean

    constructor(maker: unit) {
        super(maker, 'terrainCopyPaste', false)

        this.isPoint1Saved = false
        this.isPoint2Saved = false
        this.isPoint3Saved = false
        this.isPoint1Used = false
        this.isPoint2Used = false
        this.isPoint3Used = false
    }

    destroy = () => {
        super.destroy()

        this.landmarkForMake1 && this.landmarkForMake1.destroy()
        this.landmarkForMake2 && this.landmarkForMake2.destroy()
        this.landmarkForMake3 && this.landmarkForMake3.destroy()
    }

    unsaveLoc = (locId: number) => {
        if (locId === 1) {
            this.isPoint1Used = false
            this.landmarkForMake1 && this.landmarkForMake1.destroy()
        } else if (locId === 2) {
            this.isPoint2Used = false
            this.landmarkForMake2 && this.landmarkForMake2.destroy()
        } else if (locId === 3) {
            this.isPoint3Used = false
            this.landmarkForMake3 && this.landmarkForMake3.destroy()
        }
    }

    unsaveLocDefinitely = (locId: number) => {
        this.unsaveLoc(locId)
        if (locId === 1) {
            this.isPoint1Saved = false
        } else if (locId === 2) {
            this.isPoint2Saved = false
        } else if (locId === 3) {
            this.isPoint3Saved = false
        }
    }

    unsaveLocsDefinitely = () => {
        this.unsaveLocDefinitely(1)
        this.unsaveLocDefinitely(2)
        this.unsaveLocDefinitely(3)
    }

    saveLoc = (x: number, y: number) => {
        if (!this.isPoint1Used) {
            if (this.landmarkForMake1) {
                this.landmarkForMake1.move(x, y)
            } else {
                this.landmarkForMake1 = new LandmarkForMake(this.escaper, x, y)
            }
            this.x1 = x
            this.y1 = y
            this.isPoint1Saved = true
            this.isPoint1Used = true
            this.unsaveLocDefinitely(2)
            this.unsaveLocDefinitely(3)
        } else if (!this.isPoint2Used) {
            if (this.landmarkForMake2) {
                this.landmarkForMake2.move(x, y)
            } else {
                this.landmarkForMake2 = new LandmarkForMake(this.escaper, x, y)
            }
            this.x2 = x
            this.y2 = y
            this.isPoint2Saved = true
            this.isPoint2Used = true
            this.unsaveLocDefinitely(3)
        } else if (!this.isPoint3Used) {
            if (this.landmarkForMake3) {
                this.landmarkForMake3.move(x, y)
            } else {
                this.landmarkForMake3 = new LandmarkForMake(this.escaper, x, y)
            }
            this.x3 = x
            this.y3 = y
            this.isPoint3Saved = true
            this.isPoint3Used = true
        } else {
            try {
                const action = new MakeTerrainCopyPasteAction(
                    this.x1,
                    this.y1,
                    this.x2,
                    this.y2,
                    this.x3,
                    this.y3,
                    x,
                    y
                )
                this.unsaveLocsDefinitely()
                this.escaper.newAction(action)
            } catch (error) {
                if (typeof error == 'string') {
                    Text.erP(this.makerOwner, error)
                }
            }
        }

        this.escaper.destroyCancelledActions()
    }

    cancelLastAction = (): boolean => {
        if (this.isPoint3Used) {
            this.unsaveLoc(3)
            return true
        } else if (this.isPoint2Used) {
            this.unsaveLoc(2)
            return true
        } else if (this.isPoint1Used) {
            this.unsaveLoc(1)
            return true
        }

        return false
    }

    redoLastAction = (): boolean => {
        if (this.isPoint1Saved && !this.isPoint1Used) {
            this.saveLoc(this.x1, this.y1)
            return true
        } else if (this.isPoint2Saved && !this.isPoint2Used) {
            this.saveLoc(this.x2, this.y2)
            return true
        } else if (this.isPoint3Saved && !this.isPoint3Used) {
            this.saveLoc(this.x3, this.y3)
            return true
        }

        return false
    }

    doActions = () => {
        if (super.doBaseActions()) {
            this.saveLoc(this.orderX, this.orderY)
        }
    }
}
