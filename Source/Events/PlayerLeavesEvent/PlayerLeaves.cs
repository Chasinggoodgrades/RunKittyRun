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

    private static void PlayerLeavesActions()
    {
        var leavingPlayer = GetTriggerPlayer();
        var team = Globals.PLAYERS_TEAMS[leavingPlayer];
        var kitty = Globals.ALL_KITTIES[leavingPlayer];
        var circle = Globals.ALL_CIRCLES[leavingPlayer];
        team.RemoveMember(leavingPlayer);
        kitty.RemoveKitty();
        circle.RemoveCircle();
        Globals.ALL_PLAYERS.Remove(leavingPlayer);
        Console.WriteLine(Color.PlayerNameColored(leavingPlayer) + Color.COLOR_YELLOW_ORANGE + " has left the game.");
        RoundManager.RoundEndCheck();
    }
}