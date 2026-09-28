import { BaseArray } from '../BaseArray'
import { EscaperEffect } from './EscaperEffect'

const NB_EFFECTS_LIMIT = 20

export class EscaperEffectArray extends BaseArray<EscaperEffect> {
    constructor() {
        super(true)
    }

    new = (efStr: string, u: unit, bodyPart: string) => {
        if (this.lastInstanceId >= NB_EFFECTS_LIMIT - 1) {
            this.data[0].destroy()

            for (let i = 0; i < 19; i++) {
                this.data[i] = this.data[i + 1]
            }
        } else {
            this.lastInstanceId++
        }

        this.data[this.lastInstanceId] = new EscaperEffect(efStr, u, bodyPart)
    }

    destroyLastEffects = (numEfToDestroy: number) => {
        let i = numEfToDestroy

        while (i > 0 && this.lastInstanceId >= 0) {
            this.data[this.lastInstanceId] && this.data[this.lastInstanceId].destroy()
            delete this.data[this.lastInstanceId]
            this.lastInstanceId--
            i--
        }
    }

    hideEffects = () => {
        for (const [_, ef] of pairs(this.data)) {
            ef.destroy()
        }
    }

    showEffects = (u: unit) => {
        for (const [_, ef] of pairs(this.data)) {
            ef.recreate(u)
        }
    }
}
