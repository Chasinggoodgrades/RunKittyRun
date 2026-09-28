import { createEvent } from '../../../Utils/mapUtils'
import { Hero2Escaper, IsHero } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { globals } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const initTrig_Autorevive = () => {
    globals.autoreviveDelay = 4

    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_DEATH)],
        conditions: [() => IsHero(Natives.UGetTriggerUnit())],
        actions: [
            () => {
                const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

                if (!escaper) {
                    return
                }

                if (escaper.hasAutorevive()) {
                    globals.autoreviveDelay !== undefined && TriggerSleepAction(globals.autoreviveDelay)
                    escaper.reviveAtStart()
                    escaper.selectHero()
                }
            },
        ],
    })
}
