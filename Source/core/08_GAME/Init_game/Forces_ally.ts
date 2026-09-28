import { Constants } from 'core/01_libraries/Constants'
import { forRange } from 'Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Forces_ally = () => {
    forRange(Constants.NB_PLAYERS_MAX_REFORGED, i => {
        forRange(Constants.NB_PLAYERS_MAX_REFORGED, j => {
            if (i != j) {
                SetPlayerAllianceStateBJ(Natives.UPlayer(i), Natives.UPlayer(j), bj_ALLIANCE_ALLIED_VISION)
            }
        })
    })
}
