export class PlayerLeaves {
    private static Trigger: Trigger = Trigger.create()!

    public static Initialize() {
        RegisterTrigger()
    }

    private static RegisterTrigger() {
        for (let player of Globals.ALL_PLAYERS) {
            Trigger.RegisterPlayerEvent(player, EVENT_PLAYER_LEAVE)
        }
        Trigger.addAction(ErrorHandler.Wrap(() => PlayerLeavesActions()))
    }

    public static TeamRemovePlayer(player: MapPlayer) {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        Globals.PLAYERS_TEAMS[player].RemoveMember(player)
    }

    public static PlayerLeavesActions(player: MapPlayer = null) {
        try {
            let leavingPlayer = getTriggerPlayer()
            if (player != null) leavingPlayer = player
            if (!Globals.ALL_PLAYERS.includes(leavingPlayer)) return
            let kitty = Globals.ALL_KITTIES.get(leavingPlayer)!
            let circle = Globals.ALL_CIRCLES[leavingPlayer]
            let nameTag = kitty.NameTag
            TeamRemovePlayer(leavingPlayer)
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
