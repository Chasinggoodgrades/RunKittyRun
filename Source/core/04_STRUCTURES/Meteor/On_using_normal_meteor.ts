import { createEvent } from 'Utils/mapUtils'
import { StopUnit } from '../../01_libraries/Basic_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { hooks } from '../../API/GeneralHooks'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { udg_monsters } from '../../../../globals'

let preventedNormalMeteorUsage = false

export const InitTrig_On_using_normal_meteor = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_SPELL_CAST)],
        conditions: [
            () => {
                if (!(GetSpellAbilityId() === FourCC('A002'))) {
                    return false
                }

                return true
            },
        ],
        actions: [
            () => {
                if (preventedNormalMeteorUsage) {
                    StopUnit(Natives.UGetTriggerUnit())
                } else {
                    let preventedByHooks = false

                    let escaper = Hero2Escaper(Natives.UGetTriggerUnit())
                    if (escaper) {
                        let targetMonster = null
                        let monsterUnit = GetSpellTargetUnit()
                        if (monsterUnit) {
                            targetMonster = udg_monsters[GetUnitUserData(monsterUnit)]
                        }

                        if (targetMonster) {
                            for (const hook of hooks.hooks_onBeforeHeroUsingMeteor.getHooks()) {
                                if (!hook.execute2(escaper, targetMonster)) {
                                    preventedByHooks = true
                                }
                            }
                        }
                    }

                    if (preventedByHooks) {
                        StopUnit(Natives.UGetTriggerUnit())
                    }
                }
            },
        ],
    })
}

export const preventNormalMeteorUsage = () => {
    preventedNormalMeteorUsage = true
}

export const allowNormalMeteorUsage = () => {
    preventedNormalMeteorUsage = false
}
