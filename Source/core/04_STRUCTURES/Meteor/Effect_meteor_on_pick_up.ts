import { createEvent } from 'Utils/mapUtils'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { METEOR_NORMAL } from './Meteor'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Effect_meteor_on_pick_up = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_PICKUP_ITEM)],
        conditions: [
            () => {
                const item = Natives.UUnitItemInSlotBJ(Natives.UGetTriggerUnit(), 1)
                return item && GetItemTypeId(item) === METEOR_NORMAL
            },
        ],
        actions: [() => Hero2Escaper(Natives.UGetTriggerUnit())?.addEffectMeteor()],
    })
}
