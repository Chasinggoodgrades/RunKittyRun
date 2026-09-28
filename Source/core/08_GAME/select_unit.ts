import { Constants } from 'core/01_libraries/Constants'
import { createEvent, forRange } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../globals'
import { Hero2Escaper, IsHero } from '../04_STRUCTURES/Escaper/Escaper_functions'
import { Natives } from '../wc3_natives_unsecured/Natives'

export const initSelectUnit = () => {
    createEvent({
        events: [
            t =>
                forRange(Constants.NB_ESCAPERS, i =>
                    TriggerRegisterPlayerSelectionEventBJ(t, Natives.UPlayer(i), true)
                ),
        ],
        actions: [
            () => {
                if (IsHero(Natives.UGetTriggerUnit())) {
                    const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

                    if (escaper) {
                        getUdgEscapers()
                            .get(GetPlayerId(Natives.UGetTriggerPlayer()))
                            ?.setSelectedPlayerId(GetPlayerId(escaper.getPlayer()))
                    }
                }
            },
        ],
    })
}
