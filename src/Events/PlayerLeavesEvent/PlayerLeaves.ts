import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { MultiboardUtil } from 'src/UI/Multiboard/MultiboardUtil'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'

export class PlayerLeaves {
    private static triggerHandle: Trigger = Trigger.create()!

    public static Initialize = () => {
        PlayerLeaves.RegisterTrigger()
    }

    private static RegisterTrigger = () => {
        for (const player of Globals.ALL_PLAYERS) {
            PlayerLeaves.triggerHandle.registerPlayerEvent(player, EVENT_PLAYER_LEAVE)
        }
        PlayerLeaves.triggerHandle.addAction(PlayerLeaves.PlayerLeavesActions)
    }

    public static TeamRemovePlayer = (player: MapPlayer) => {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        Globals.PLAYERS_TEAMS.get(player)?.RemoveMember(player)
    }

    public static PlayerLeavesActions = (player: MapPlayer | null = null) => {
        try {
            let leavingPlayer = getTriggerPlayer()
            if (player) leavingPlayer = player
            if (!Globals.ALL_PLAYERS.includes(leavingPlayer)) return
            const kitty = Globals.ALL_KITTIES.get(leavingPlayer)!
            const circle = Globals.ALL_CIRCLES.get(leavingPlayer)
            if (!circle) return
            const nameTag = kitty.NameTag
            PlayerLeaves.TeamRemovePlayer(leavingPlayer)
            kitty.dispose()
            circle.dispose()
            nameTag?.dispose()
            if (!Globals.WinGame) Globals.ALL_PLAYERS.splice(Globals.ALL_PLAYERS.indexOf(leavingPlayer), 1)
            print(ColorUtils.PlayerNameColored(leavingPlayer) + Colors.COLOR_YELLOW_ORANGE + ' has left the game.')
            RoundManager.RoundEndCheck()
            if (Globals.WinGame) return
            MultiboardUtil.RefreshMultiboards()
        } catch (e) {
            print('Error in PlayerLeavesActions: ' + e)
        }
    }
}
