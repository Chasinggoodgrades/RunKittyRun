import {
    contactCheckForAsyncSlidesOnly,
    contactCheckForEveryHero,
    removeImmolation,
    restoreImmolation,
} from '../immolation'
import { activateAllLevels, activateFirstLevelOnly } from '../levels'
import { spawn } from '../spawn'
import { e2e } from './e2e-tests-base'

export const init_E2ETests = () => {
    e2e.registerTest(spawn)
    e2e.registerTest(activateAllLevels)
    e2e.registerTest(activateFirstLevelOnly)
    e2e.registerTest(removeImmolation)
    e2e.registerTest(restoreImmolation)
    e2e.registerTest(contactCheckForEveryHero)
    e2e.registerTest(contactCheckForAsyncSlidesOnly)
}
