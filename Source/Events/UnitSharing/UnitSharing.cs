using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class UnitSharing
{
    private static trigger Trigger;
    private static triggeraction Action;

    /// <summary>
    /// Initializes the trigger that manages unit sharing.
    /// </summary>
    public static void Initialize()
    {
        Trigger ??= RegisterTrigger();
    }

    /// <summary>
    /// Creates a trigger if not already created then registers all players for alliance changes.
    /// </summary>
    /// <returns></returns>
    private static trigger RegisterTrigger()
    {
        Trigger = CreateTrigger();
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            if (Action != null) break;
            var player = Globals.ALL_PLAYERS[i];
            Trigger.RegisterPlayerAllianceChange(player, alliancetype.SharedControl);
        }
        Action = TriggerActions();
        return Trigger;
    }

    /// <summary>
    /// The action that will occur if a player shares control with another player.
    /// </summary>
    /// <returns></returns>
    private static triggeraction TriggerActions()
    {
        Action = Trigger.AddAction(() =>
        {
            var player = @event.Player; // Triggering Player
            if (AllowSharing(player)) return;                

            for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
            {
                var otherPlayer = Globals.ALL_PLAYERS[i];
                if (otherPlayer == player) continue;
                player.SetAlliance(otherPlayer, alliancetype.SharedControl, false);
                otherPlayer.SetAlliance(player, alliancetype.SharedControl, false);
            }
        });
        return Action;
    }

    /// <summary>
    /// All the conditions that will allow or disallow sharing should be put here.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private static bool AllowSharing(player player)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false; // Tournament Modes Disable Sharing

        if (Globals.ALL_KITTIES[player].IsChained) return false; // Chained Kitties Disable Sharing

        return true;
    }

}
