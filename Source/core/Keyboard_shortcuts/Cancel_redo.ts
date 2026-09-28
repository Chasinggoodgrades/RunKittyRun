import { getUdgEscapers } from '../../../globals'
import { ServiceManager } from '../../Services'
import { Constants } from '../01_libraries/Constants'
import { Natives } from '../wc3_natives_unsecured/Natives'

export const init_shortcurt_cancelRedo = () => {
    const { ExecuteCommand } = ServiceManager.getService('Cmd')

    function Cancel_Actions() {
        const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
        escaper && ExecuteCommand(escaper, '-z')
    }

    function Redo_Actions() {
        const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
        escaper && ExecuteCommand(escaper, '-y')
    }

    for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
        //cancel
        const trgCancel = CreateTrigger()

        TriggerAddAction(trgCancel, Cancel_Actions)
        BlzTriggerRegisterPlayerKeyEvent(trgCancel, Natives.UPlayer(i), OSKEY_Z, 2, false) //CTRL Z

        //redo
        const trgRedo = CreateTrigger()

        TriggerAddAction(trgRedo, Redo_Actions)
        BlzTriggerRegisterPlayerKeyEvent(trgRedo, Natives.UPlayer(i), OSKEY_Z, 3, false) //CTRL SHIFT Z
        BlzTriggerRegisterPlayerKeyEvent(trgRedo, Natives.UPlayer(i), OSKEY_Y, 2, false) //CTRL Y
    }
}
