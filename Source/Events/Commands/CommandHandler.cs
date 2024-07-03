using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;


public static class CommandHandler
{
    private static trigger DebugCmdTrigger = CreateTrigger();

    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, player, "-", false);
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, player, "?", false);
        }
        TriggerAddAction(DebugCmdTrigger, HandleCommand);
    }

    private static void HandleCommand()
    {
        var player = GetTriggerPlayer();
        var command = GetEventPlayerChatString().ToLower(); // all commands are sent to lower case

        if (command.StartsWith("-t ") || command == "-s")
        {
            GamemodeCmd.Handle(player, command);
        }
        else if (command.StartsWith("?") && Utility.IsDeveloper(player))
        {
            DebugCmd.Handle(player, command);
        }
        else
        {
            GeneralCmds.Handle(player, command);
        }
    }
}

