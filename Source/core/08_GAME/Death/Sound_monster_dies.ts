import { createEvent } from 'Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Sound_monster_dies = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_DEATH)],
        conditions: [
            () => {
                if (!(GetOwningPlayer(Natives.UGetTriggerUnit()) === Natives.UPlayer(PLAYER_NEUTRAL_AGGRESSIVE))) {
                    return false
                }
                return true
            },
        ],
        actions: [() => PlaySoundBJ(gg_snd_goodJob)],
    })
}
