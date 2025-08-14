import { RoundManager } from "src/Game/Rounds/RoundManager"
import { Gamemode } from "src/Gamemodes/Gamemode"
import { GameMode } from "src/Gamemodes/GameModeEnum"
import { Globals } from "src/Global/Globals"
import { MultiboardUtil } from "src/UI/Multiboard/MultiboardUtil"
import { Colors } from "src/Utility/Colors/Colors"
import { ErrorHandler } from "src/Utility/ErrorHandler"
import { getTriggerPlayer } from "src/Utility/w3tsUtils"
import { Trigger, MapPlayer } from "w3ts"
import { Gameover } from "../Gameover"

export class PlayerLeaves {
    private static triggerHandle: Trigger = Trigger.create()!

    public static Initialize() {
        this.RegisterTrigger()
    }

    private static RegisterTrigger() {
        for (let player of Globals.ALL_PLAYERS) {
            this.triggerHandle.registerPlayerEvent(player, EVENT_PLAYER_LEAVE)
        }
        this.triggerHandle.addAction(ErrorHandler.Wrap(() => this.PlayerLeavesActions()))
    }

    public static TeamRemovePlayer(player: MapPlayer) {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        Globals.PLAYERS_TEAMS[player].RemoveMember(player)
    }

    public static PlayerLeavesActions(player: MapPlayer | null = null) {
        try {
            let leavingPlayer = getTriggerPlayer()
            if (player != null) leavingPlayer = player
            if (!Globals.ALL_PLAYERS.includes(leavingPlayer)) return
            let kitty = Globals.ALL_KITTIES.get(leavingPlayer)!
            let circle = Globals.ALL_CIRCLES[leavingPlayer]
            let nameTag = kitty.NameTag
            this.TeamRemovePlayer(leavingPlayer)
            kitty.dispose()
            circle.dispose()
            nameTag?.dispose()
            if (!Gameover.WinGame) Globals.ALL_PLAYERS.Remove(leavingPlayer)
            print(Colors.PlayerNameColored(leavingPlayer) + Colors.COLOR_YELLOW_ORANGE + ' left: the: game: has.')
            RoundManager.RoundEndCheck()
            if (Gameover.WinGame) return
            MultiboardUtil.RefreshMultiboards()
        } catch (e: any) {
            print('Error in PlayerLeavesActions: ' + e.Message)
        }
    }
}
