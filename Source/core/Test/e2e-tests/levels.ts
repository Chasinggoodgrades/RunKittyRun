import { getUdgLevels } from '../../../../globals'
import { Text } from '../../01_libraries/Text'
import { E2EAction, E2ETest } from './base/e2e-tests-base'

/**
 * Both tests below leave the game in the state they just set: they are made to be watched and
 * played with, and each one is the way back from the other.
 */

const activateAllLevelsActions: E2EAction[] = [
    {
        function: () => {
            const levels = getUdgLevels()
            const nbLevels = levels.getLastInstanceId()

            Text.mkA_timed(-1, `\nActivating the ${nbLevels} levels, from the first one to the last one`)

            for (let levelId = 0; levelId < nbLevels; levelId++) {
                levels.get(levelId)?.activate(true)
            }
        },
    },
]

const activateFirstLevelOnlyActions: E2EAction[] = [
    {
        function: () => {
            const levels = getUdgLevels()
            const nbLevels = levels.getLastInstanceId()

            Text.mkA_timed(-1, `\nDeactivating the ${nbLevels} levels but the first one, which we activate`)

            for (let levelId = nbLevels - 1; levelId > 0; levelId--) {
                levels.get(levelId)?.activate(false)
            }

            levels.get(0)?.activate(true)
        },
    },
]

export const activateAllLevels: E2ETest = {
    shortName: 'activateAllLevels',
    name: 'Activation of every level',
    actions: activateAllLevelsActions,
}

export const activateFirstLevelOnly: E2ETest = {
    shortName: 'activateFirstLevelOnly',
    name: 'Activation of the first level only',
    actions: activateFirstLevelOnlyActions,
}
