using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;


public static class DebugCmd
{
    private static trigger DebugCmdTrigger = CreateTrigger();
    public static void Initialize()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, player, "-", false);
        }
        TriggerAddAction(DebugCmdTrigger, CommandHandler);
    }

    private static void CommandHandler()
    {
        var player = GetTriggerPlayer();
        var cmd = GetEventPlayerChatString();
        if (cmd == "-AB")
        {
            Console.WriteLine("Activating Barrier");
            BarrierSetup.ActivateBarrier();
        }
        if (cmd == "-DB")
        {
            Console.WriteLine("Deactivating Barrier");
            BarrierSetup.DeactivateBarrier();
        }
        if (cmd == "-gold")
        {
            player.Gold += 1000;
        }
        if (cmd == "-mb")
        {
            Team.SetupTeams();
        }

    }

}

