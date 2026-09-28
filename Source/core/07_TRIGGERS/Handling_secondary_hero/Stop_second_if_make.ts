import { createEvent } from '../../../Utils/mapUtils'
import { GetMirrorEscaper, Hero2Escaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { IsIssuedOrder, StopUnit } from '../../01_libraries/Basic_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'

/**
 * Prevent secondary hero to move if the player is in "Make" mode
 */

export const init_StopSecondIfMake = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER)],
        actions: [
            () => {
                if (IsIssuedOrder('smart')) {
                    const unit = Natives.UGetTriggerUnit()
                    const escaper = Hero2Escaper(unit)
                    if (escaper?.isEscaperSecondary()) {
                        const mainEscaper = GetMirrorEscaper(escaper)

                        if (mainEscaper?.getMake()) {
                            StopUnit(unit)
                        }
                    }
                }
            },
        ],
    })
}
