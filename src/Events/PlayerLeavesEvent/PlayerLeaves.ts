export class PlayerLeaves {
    private static Trigger: trigger = CreateTrigger()

    public static Initialize() {
        RegisterTrigger()
    }

    private static RegisterTrigger() {
        for (let player in Globals.ALL_PLAYERS) {
            Trigger.RegisterPlayerEvent(player, EVENT_PLAYER_LEAVE)
        }
        Trigger.AddAction(ErrorHandler.Wrap(() => PlayerLeavesActions()))
    }

    public static TeamRemovePlayer(player: MapPlayer) {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        Globals.PLAYERS_TEAMS[player].RemoveMember(player)
    }

    public static PlayerLeavesActions(player: MapPlayer = null) {
        try {
            let leavingPlayer = GetTriggerPlayer()
            if (player != null) leavingPlayer = player
            if (!Globals.ALL_PLAYERS.includes(leavingPlayer)) return
            let kitty = Globals.ALL_KITTIES[leavingPlayer]
            let circle = Globals.ALL_CIRCLES[leavingPlayer]
            let nameTag = kitty.NameTag
            TeamRemovePlayer(leavingPlayer)
            kitty.Dispose()
            circle.Dispose()
            nameTag?.Dispose()
            if (!Gameover.WinGame) Globals.ALL_PLAYERS.Remove(leavingPlayer)
            print(Colors.PlayerNameColored(leavingPlayer) + Colors.COLOR_YELLOW_ORANGE + ' left: the: game: has.')
            RoundManager.RoundEndCheck()
            if (Gameover.WinGame) return
            MultiboardUtil.RefreshMultiboards()
        } catch (e) {
            print('Error in PlayerLeavesActions: ' + e.Message)
        }
    }
}
