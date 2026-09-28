import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { DrawLine } from '../../01_libraries/Draw_lines'
import { udg_colorStrings } from '../../01_libraries/Init_colorCodes'
import { Natives } from '../../wc3_natives_unsecured/Natives'

const LANDMARK_UNIT_ID = FourCC('e001') //à remplacer par l'id de l'unité choisie (need couleur variable)
const LIGHTNING_FORM: 'plus' | 'cross' = 'cross'
const LIGHTNING_LENGTH = 45
const LIGHTNING_WIDTH = 2

export class LandmarkForMake {
    private unit?: unit // for old system with a unit
    private lightnings?: lightning[]
    private escaper: Escaper
    private x: number
    private y: number

    constructor(escaper: Escaper, x: number, y: number) {
        this.x = x
        this.y = y
        this.escaper = escaper

        if (!this.tryAndDrawLightnings()) {
            this.createUnit()
        }
    }

    private tryAndDrawLightnings() {
        let l1x1: number
        let l1y1: number
        let l1x2: number
        let l1y2: number
        let l2x1: number
        let l2y1: number
        let l2x2: number
        let l2y2: number

        if (LIGHTNING_FORM === 'plus') {
            l1x1 = this.x - LIGHTNING_LENGTH / 2
            l1y1 = this.y
            l1x2 = this.x + LIGHTNING_LENGTH / 2
            l1y2 = this.y

            l2x1 = this.x
            l2y1 = this.y - LIGHTNING_LENGTH / 2
            l2x2 = this.x
            l2y2 = this.y + LIGHTNING_LENGTH / 2
        } else if (LIGHTNING_FORM === 'cross') {
            const delta = LIGHTNING_LENGTH / 2 / Math.SQRT2

            l1x1 = this.x - delta
            l1y1 = this.y - delta
            l1x2 = this.x + delta
            l1y2 = this.y + delta

            l2x1 = this.x - delta
            l2y1 = this.y + delta
            l2x2 = this.x + delta
            l2y2 = this.y - delta
        } else {
            return false
        }

        const colorName = udg_colorStrings[this.escaper.getEscaperId()].name

        const firstLightning = DrawLine(l1x1, l1y1, l1x2, l1y2, colorName, LIGHTNING_WIDTH)
        const secondLightning = DrawLine(l2x1, l2y1, l2x2, l2y2, colorName, LIGHTNING_WIDTH)

        if (!!firstLightning && !!secondLightning) {
            this.lightnings = [firstLightning, secondLightning]
            return true
        }

        return false
    }

    private createUnit() {
        this.unit = Natives.UCreateUnit(
            this.escaper.getPlayer(),
            LANDMARK_UNIT_ID,
            this.x,
            this.y,
            GetRandomDirectionDeg()
        )
    }

    public move(x: number, y: number) {
        this.x = x
        this.y = y

        if (this.lightnings) {
            for (const lightning of this.lightnings) {
                DestroyLightning(lightning)
            }
            delete this.lightnings
        }

        if (!this.tryAndDrawLightnings()) {
            if (this.unit) {
                SetUnitPosition(this.unit, x, y)
            } else {
                this.createUnit()
            }
        } else if (this.unit) {
            RemoveUnit(this.unit)
            delete this.unit
        }
    }

    public destroy() {
        if (this.lightnings) {
            for (const lightning of this.lightnings) {
                DestroyLightning(lightning)
            }
            delete this.lightnings
        }

        if (this.unit) {
            RemoveUnit(this.unit)
            delete this.unit
        }
    }
}
