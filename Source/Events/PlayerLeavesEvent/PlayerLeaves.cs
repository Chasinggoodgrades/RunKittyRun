using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class PlayerLeaves
{
    private static trigger Trigger;
    public static void Initialize()
    {
        Trigger = CreateTrigger();
        RegisterTrigger();
    }

    private static void RegisterTrigger()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerEvent(player, EVENT_PLAYER_LEAVE);
        }
        Trigger.AddAction(PlayerLeavesActions);
    }

    private static void TeamRemovePlayer(player player)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        Globals.PLAYERS_TEAMS[player].RemoveMember(player);
    }

    private static void PlayerLeavesActions()
    {
        var leavingPlayer = @event.Player;
        var kitty = Globals.ALL_KITTIES[leavingPlayer];
        var circle = Globals.ALL_CIRCLES[leavingPlayer];
        var nameTag = FloatingNameTag.PlayerNameTags[leavingPlayer];
        TeamRemovePlayer(leavingPlayer);
        kitty.RemoveKitty();
        circle.RemoveCircle();
        nameTag.Dispose();
        Globals.ALL_PLAYERS.Remove(leavingPlayer);
        Console.WriteLine(Colors.PlayerNameColored(leavingPlayer) + Colors.COLOR_YELLOW_ORANGE + " has left the game.");
        RoundManager.RoundEndCheck();
    }
}