import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'

export class UnitSharing {
    private static Trigger: Trigger
    private static Action: triggeraction

    /// <summary>
    /// Initializes the trigger that manages unit sharing.
    /// </summary>
    public static Initialize() {
        UnitSharing.Trigger ??= UnitSharing.RegisterTrigger()
    }

    /// <summary>
    /// Creates a trigger if not already created then registers all players for alliance changes.
    /// </summary>
    /// <returns></returns>
    private static RegisterTrigger(): Trigger {
        UnitSharing.Trigger = Trigger.create()!
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            if (UnitSharing.Action != null) break
            let player = Globals.ALL_PLAYERS[i]
            UnitSharing.Trigger.registerPlayerAllianceChange(player, ALLIANCE_SHARED_CONTROL)
        }
        UnitSharing.Action = UnitSharing.TriggerActions()
        return UnitSharing.Trigger
    }

    /// <summary>
    /// The action that will occur if a player shares control with another player.
    /// </summary>
    /// <returns></returns>
    private static TriggerActions(): triggeraction {
        UnitSharing.Action = UnitSharing.Trigger.addAction(() => {
            let player = getTriggerPlayer() // Triggering Player
            if (UnitSharing.AllowSharing(player)) return

            for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                let otherPlayer = Globals.ALL_PLAYERS[i]
                if (otherPlayer == player) continue
                player.setAlliance(otherPlayer, ALLIANCE_SHARED_CONTROL, false)
                otherPlayer.setAlliance(player, ALLIANCE_SHARED_CONTROL, false)
            }
        })
        return UnitSharing.Action
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
