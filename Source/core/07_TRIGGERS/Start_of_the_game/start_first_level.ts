import { getUdgLevels } from '../../../../globals'
import { createTimer } from '../../../Utils/mapUtils'
import { applyDefaultAutoTurnMode } from '../../06_COMMANDS/Helpers/commands-helpers'

export const init_startFirstLevel = () => {
    createTimer(0, false, () => {
        getUdgLevels().get(0)?.activate(true)
        getUdgLevels().refreshVisibilities()

        // on every machine at once, as the command would: every player starts steering with the mouse
        applyDefaultAutoTurnMode()
    })
}
