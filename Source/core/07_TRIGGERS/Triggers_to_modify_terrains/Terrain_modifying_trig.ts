import { Constants } from 'core/01_libraries/Constants'
import { Escaper } from 'core/04_STRUCTURES/Escaper/Escaper'
import { getUdgEscapers } from '../../../../globals'

export let gg_trg_Terrain_modifying_trig: trigger

const initTerrainModifyingTrig = () => {
    let y: number
    let wasCheckTerrainTriggerOn: boolean[] = []
    //constant integer TERRAIN_MODIFYING_NB_LINES_TO_DO = 5
    //maintenant on fait ligne par ligne (--> 1)

    gg_trg_Terrain_modifying_trig = CreateTrigger()
    DisableTrigger(gg_trg_Terrain_modifying_trig)
    TriggerRegisterTimerEvent(gg_trg_Terrain_modifying_trig, Constants.LOW_PERIOD_FOR_WORK, true)

    const StopEnabledCheckTerrainTriggers = () => {
        let escaper: Escaper | null
        let i = 0
        while (true) {
            if (i >= Constants.NB_ESCAPERS) break
            escaper = getUdgEscapers().get(i)
            if (escaper !== null) {
                if (escaper.doesCheckTerrain()) {
                    wasCheckTerrainTriggerOn[i] = true
                    escaper.enableCheckTerrain(false)
                } else {
                    wasCheckTerrainTriggerOn[i] = false
                }
            }
            i = i + 1
        }
    }

    const RestartEnabledCheckTerrainTriggers = () => {
        let escaper: Escaper | null
        let i = 0
        while (true) {
            if (i >= Constants.NB_ESCAPERS) break
            escaper = getUdgEscapers().get(i)
            if (escaper !== null) {
                if (wasCheckTerrainTriggerOn[i]) {
                    escaper.enableCheckTerrain(true)
                }
            }
            i = i + 1
        }
    }

    return { gg_trg_Terrain_modifying_trig, StopEnabledCheckTerrainTriggers, RestartEnabledCheckTerrainTriggers }
}

export const TerrainModifyingTrig = initTerrainModifyingTrig()
