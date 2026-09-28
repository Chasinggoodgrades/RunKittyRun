import { GetMirrorEscaper, Hero2Escaper, IsHero } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { errorHandler } from '../../Utils/mapUtils'
import { udg_doubleHeroesEnabled } from './double_heroes_config'
import { Natives } from '../wc3_natives_unsecured/Natives'

export const init_doubleKill = () => {
    let triggerDoubleKill = CreateTrigger()
    TriggerRegisterAnyUnitEventBJ(triggerDoubleKill, EVENT_PLAYER_UNIT_DEATH)
    TriggerAddAction(
        triggerDoubleKill,
        errorHandler(() => {
            if (udg_doubleHeroesEnabled && IsHero(Natives.UGetTriggerUnit())) {
                GetMirrorEscaper(Hero2Escaper(Natives.UGetTriggerUnit()))?.kill()
            }
        })
    )
}
