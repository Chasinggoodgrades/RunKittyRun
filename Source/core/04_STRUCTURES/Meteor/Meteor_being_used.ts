import { ServiceManager } from 'Services'
import { createEvent } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../../globals'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { METEOR_NORMAL, udg_meteors } from './Meteor'
import { allowNormalMeteorUsage, preventNormalMeteorUsage } from './On_using_normal_meteor'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_Meteor_being_used = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_USE_ITEM)],
        actions: [
            () => {
                SetUnitAnimation(Natives.UGetTriggerUnit(), 'attack')

                if (GetItemTypeId(Natives.UGetManipulatedItem()) === METEOR_NORMAL) {
                    DisableTrigger(Natives.UGetTriggeringTrigger())
                    preventNormalMeteorUsage() //todomax fix the bug that sometimes the hero runs towards the target after launching the ball

                    udg_meteors[GetItemUserData(Natives.UGetManipulatedItem())].removeMeteorItem()
                    Hero2Escaper(Natives.UGetTriggerUnit())?.removeEffectMeteor()

                    TriggerSleepAction(1)

                    EnableTrigger(Natives.UGetTriggeringTrigger())
                    allowNormalMeteorUsage()

                    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
                    escaper && ServiceManager.getService('Multiboard').onPlayerMeteorCompleted(escaper)
                }
            },
        ],
    })
}
