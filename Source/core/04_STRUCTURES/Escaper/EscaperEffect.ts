import { EffectUtils } from 'Utils/EffectUtils'

export class EscaperEffect {
    private ef?: effect
    private efStr: string
    private bodyPart: string

    constructor(efStr: string, u: unit, bodyPart: string) {
        this.efStr = efStr
        this.bodyPart = bodyPart
        this.ef = EffectUtils.addSpecialEffectTarget(efStr, u, bodyPart)
    }

    recreate = (u: unit) => {
        this.destroy()
        this.ef = EffectUtils.addSpecialEffectTarget(this.efStr, u, this.bodyPart)
    }

    toJson = () => ({
        //useless but mandatory due to BaseArray implementation
    })

    destroy = () => {
        EffectUtils.destroyEffect(this.ef)
    }
}
