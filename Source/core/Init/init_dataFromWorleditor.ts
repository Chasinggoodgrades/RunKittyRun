import { Constants } from '../01_libraries/Constants'
import { Natives } from '../wc3_natives_unsecured/Natives'
import { globals } from '../../../globals'

export const init_dataFromWorleditor = () => {
    // Hero base scale
    const dummyHero = Natives.UCreateUnit(Natives.UPlayer(PLAYER_NEUTRAL_PASSIVE), Constants.HERO_TYPE_ID, 0, 0, 0)
    globals.heroBaseScale = BlzGetUnitRealField(dummyHero, UNIT_RF_SCALING_VALUE)
    RemoveUnit(dummyHero)
}
