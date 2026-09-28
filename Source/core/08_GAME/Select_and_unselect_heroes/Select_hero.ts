import { Constants } from 'core/01_libraries/Constants'
import { Hero2Escaper, IsHero } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { createEvent, forRange } from 'Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Select_hero = () => {
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
                    Hero2Escaper(Natives.UGetTriggerUnit())?.setIsHeroSelectedForPlayer(
                        Natives.UGetTriggerPlayer(),
                        true
                    )
                }
            },
        ],
    })
}
