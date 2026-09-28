import { Constants } from 'core/01_libraries/Constants'
import { createEvent, forRange } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Camera_reset = () => {
    createEvent({
        events: [
            t => forRange(Constants.NB_ESCAPERS, i => TriggerRegisterPlayerEventEndCinematic(t, Natives.UPlayer(i))),
        ],
        actions: [
            () => {
                getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))?.resetCamera()
            },
        ],
    })
}
