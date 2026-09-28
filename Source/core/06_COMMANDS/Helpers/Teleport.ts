import { IsIssuedOrder, StopUnit } from '../../01_libraries/Basic_functions'
import { getUdgEscapers } from '../../../../globals'
import { errorHandler } from '../../../Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'

let teleTriggers: trigger[] = []
let onceOnly: boolean[] = []

export const ActivateTeleport = (hero: unit, onceOnlyB: boolean) => {
    let escaperId = GetUnitUserData(hero)
    DestroyTrigger(teleTriggers[escaperId])
    teleTriggers[escaperId] = CreateTrigger()
    TriggerAddAction(
        teleTriggers[escaperId],
        errorHandler(() => {
            const escaper = getUdgEscapers().get(escaperId)

            if (!escaper) {
                return
            }

            let hero: unit | null = Natives.UGetTriggerUnit()

            if (!IsIssuedOrder('smart')) {
                return
            }

            StopUnit(hero)
            escaper.moveHero(GetOrderPointX(), GetOrderPointY())

            if (onceOnly[GetUnitUserData(hero)]) {
                DestroyTrigger(Natives.UGetTriggeringTrigger())
            }

            hero = null
        })
    )
    TriggerRegisterUnitEvent(teleTriggers[escaperId], hero, EVENT_UNIT_ISSUED_POINT_ORDER)
    onceOnly[escaperId] = onceOnlyB
}

export const DisableTeleport = (hero: unit) => {
    let escaperId = GetUnitUserData(hero)
    DestroyTrigger(teleTriggers[escaperId])
}
