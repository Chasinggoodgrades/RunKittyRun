import { Constants } from 'core/01_libraries/Constants'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { Level } from './Level'

export const IsLevelBeingMade = (level: Level): boolean => {
    for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
        const escaper = getUdgEscapers().get(i)
        if (escaper) {
            if (escaper.getMakingLevel() == level) {
                return true
            }
        }
    }
    return getUdgLevels().getCurrentLevel() == level
}
