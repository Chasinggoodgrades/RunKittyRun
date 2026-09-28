import { ServiceManager } from 'Services'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { ChangeAllTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Change_all_terrains'
import { Natives } from '../../wc3_natives_unsecured/Natives'

let udg_gameIsLost = false

export const loseALifeAndRes = (escaperIds: number[]) => {
    if (getUdgLevels().getLevelProgression() === 'all') {
        ServiceManager.getService('Lives').loseALife()
    }

    if (ServiceManager.getService('Lives').get() < 0) {
        if (!udg_gameIsLost) {
            udg_gameIsLost = true
            DisplayTextToForce(Natives.UGetPlayersAll(), 'You have no more lives !')
            TriggerSleepAction(2)
            DisplayTextToForce(Natives.UGetPlayersAll(), 'The game will restart in 10 seconds.')
            TriggerSleepAction(10.0)
            getUdgLevels().restartTheGame()
            udg_gameIsLost = false
        }
    } else {
        if (ChangeAllTerrains.udg_changeAllTerrainsAtRevive) {
            TriggerSleepAction(2.0)
            ChangeAllTerrains.ChangeAllTerrains('normal')
            TriggerSleepAction(2.0)
        } else {
            TriggerSleepAction(4.0)
        }

        const clonedEscaperIds = MemoryHandler.getEmptyArray<number>()

        for (const i of escaperIds) {
            arrayPush(clonedEscaperIds, i)
        }

        for (const i of clonedEscaperIds) {
            getUdgEscapers().get(i)?.reviveAtStart()
        }

        MemoryHandler.destroyArray(clonedEscaperIds)

        if (getUdgLevels().getLevelProgression() === 'all') {
            Text.A('|cff5c2e2eYou have lost a life ! (' + I2S(ServiceManager.getService('Lives').get()) + ')')
        }
    }
}
