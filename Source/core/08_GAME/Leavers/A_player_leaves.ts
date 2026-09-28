import { createEvent, forRange } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { udg_colorCode } from 'core/01_libraries/Init_colorCodes'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { runInTrigger } from '../../../Utils/mapUtils'
import { playerId2colorId } from '../../06_COMMANDS/Helpers/Command_functions'
import { AfkMode } from '../Afk_mode/Afk_mode'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const InitTrig_A_player_leaves = () => {
    createEvent({
        events: [t => forRange(Constants.NB_ESCAPERS, i => TriggerRegisterPlayerEventLeave(t, Natives.UPlayer(i)))],
        actions: [
            () => {
                let n = GetPlayerId(Natives.UGetTriggerPlayer())
                const displayName = getUdgEscapers().get(n)?.getDisplayName()

                getUdgEscapers().destroyEscaper(n)
                AfkMode.StopAfk(n)
                AfkMode.StopAfk(n + Constants.NB_PLAYERS_MAX)
                DisplayTextToForce(
                    Natives.UGetPlayersAll(),
                    `${
                        udg_colorCode[playerId2colorId(n)]
                    }This is too difficult for ${displayName}, (s)he has left the game.`
                )
                StartSound(gg_snd_noob)
                //NbPlayersMinimumThree_nbPlayers = NbPlayersMinimumThree_nbPlayers - 1

                // Delay it a bit
                runInTrigger(() => getUdgLevels().deactivateEmptyLevels())
            },
        ],
    })
}
