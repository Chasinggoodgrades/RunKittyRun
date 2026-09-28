import { MakeMECRegion } from './MakeMECRegion'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'

export class MakeDebugMECRegion extends MakeMECRegion {
    onMECRegionCreated(mecRegion: MECRegion) {
        mecRegion.debugRects(true)

        mecRegion.onUnitEnters(function (this: any, unit) {
            SetUnitColor(unit, PLAYER_COLOR_BLUE)
        })
        mecRegion.onUnitLeaves(function (this: any, unit) {
            SetUnitColor(unit, PLAYER_COLOR_RED)
        })

        this.maker && mecRegion.watchUnit(this.maker)
    }
}
