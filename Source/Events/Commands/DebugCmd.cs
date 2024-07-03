using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Json;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        switch (command)
        {
            case "?ab":
                Console.WriteLine("Activating Barrier");
                BarrierSetup.ActivateBarrier();
                break;
            case "?db":
                Console.WriteLine("Deactivating Barrier");
                BarrierSetup.DeactivateBarrier();
                break;
            case "?testing":
                Console.WriteLine("testing");
                var someTeam = new Team(2);
                someTeam.AddMember(Player(1));
                someTeam.AddMember(Player(5));
                Multiboard.UpdateTeamsMultiboard();
                break;
            case "?gold":
                player.Gold += 1000;
                break;
            case "?blink":
                var kitty = Globals.ALL_KITTIES[player];
                kitty.Unit.AddItem(FourCC("desc"));
                break;
            case "?share":
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                }
                break;
            default:
                player.DisplayTimedTextTo(10.0f, "Unknown command.");
                break;
        }
    }
}
