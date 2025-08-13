export class UnitSharing {
    private static Trigger: Trigger
    private static Action: triggeraction

    /// <summary>
    /// Initializes the trigger that manages unit sharing.
    /// </summary>
    public static Initialize() {
        Trigger ??= RegisterTrigger()
    }

    /// <summary>
    /// Creates a trigger if not already created then registers all players for alliance changes.
    /// </summary>
    /// <returns></returns>
    private static RegisterTrigger(): Trigger {
        Trigger = Trigger.create()!
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            if (Action != null) break
            let player = Globals.ALL_PLAYERS[i]
            Trigger.RegisterPlayerAllianceChange(player, alliancetype.SharedControl)
        }
        Action = TriggerActions()
        return Trigger
    }

    /// <summary>
    /// The action that will occur if a player shares control with another player.
    /// </summary>
    /// <returns></returns>
    private static TriggerActions(): triggeraction {
        Action = Trigger.addAction(() => {
            let player = getTriggerPlayer() // Triggering Player
            if (AllowSharing(player)) return

            for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                let otherPlayer = Globals.ALL_PLAYERS[i]
                if (otherPlayer == player) continue
                player.setAlliance(otherPlayer, alliancetype.SharedControl, false)
                otherPlayer.setAlliance(player, alliancetype.SharedControl, false)
            }
        })
        return Action
    }

    /// <summary>
    /// All the conditions that will allow or disallow sharing should be put here.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private static AllowSharing(player: MapPlayer) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false // Tournament Modes Disable Sharing

        if (Globals.ALL_KITTIES.get(player)!.IsChained) return false // Chained Kitties Disable Sharing

        return true
    }
}
