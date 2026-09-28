import { createEvent } from 'Utils/mapUtils'

export const InitTrig_Start_sound = () => {
    createEvent({
        events: [t => TriggerRegisterTimerEventSingle(t, 2.0)],
        actions: [() => PlaySoundBJ(gg_snd_start)],
    })
}
