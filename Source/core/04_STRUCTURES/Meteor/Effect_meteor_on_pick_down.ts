import { createEvent } from 'Utils/mapUtils'
import { Hero2Escaper, IsHero } from '../Escaper/Escaper_functions'
import { METEOR_CHEAT, METEOR_NORMAL } from './Meteor'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Effect_meteor_on_pick_down = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_DROP_ITEM)],
        actions: [
            () => {
                if (
                    !(
                        IsHero(Natives.UGetTriggerUnit()) &&
                        (GetItemTypeId(Natives.UGetManipulatedItem()) === METEOR_NORMAL ||
                            GetItemTypeId(Natives.UGetManipulatedItem()) === METEOR_CHEAT)
                    )
                ) {
                    return
                }

                Hero2Escaper(Natives.UGetTriggerUnit())?.removeEffectMeteor()
            },
        ],
    })
}
