import { ServiceManager } from 'Services'
import { progressionUtils } from 'Utils/ProgressionUtils'
import { PROD } from 'env'
import { getUdgEscapers } from '../../../globals'
import { makingRightsToAll } from '../06_COMMANDS/Rights/manage_rights'

export const init_Test = () => {
    const { ExecuteCommand } = ServiceManager.getService('Cmd')

    if (!PROD) {
        makingRightsToAll()

        const escaper = getUdgEscapers().get(0)

        if (escaper) {
            ExecuteCommand(
                escaper,
                "-va, news slide 'Nsnw', setta slide s, news reverse 5 -400, setta reverse rev, newd death 1 Abilities\\Spells\\NightElf\\EntanglingRoots\\EntanglingRootsTarget.mdl, setta death d, neww walk 97, setta walk w, crh"
            )

            ExecuteCommand(escaper, "-newm peasant 'hpea' 5, newm naga 'nnsw' 25, newm peon 'opeo' 5")
            ExecuteCommand(escaper, '-newCaster c naga peon')

            progressionUtils.init()
        }
    }
}
