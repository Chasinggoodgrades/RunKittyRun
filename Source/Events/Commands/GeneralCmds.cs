﻿using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class GeneralCmds
{
    private static CommandInfo CmdInfo = null;
    public static void Handle(player p, string command)
    {
        var args = command.Split(' ');
        CommandInfoCheck(args);
        switch (args[0])
        {
            case "-help":
                break;
            case "-team":
                if (Gamemode.CurrentGameModeType != Globals.TEAM_MODES[0]) return;
                HandleTeamCommand(p, args);
                break;
            case "-save":
                SaveManager.Save(p);
                p.DisplayTextTo(Colors.COLOR_GOLD + "Stats have been saved.");
                break;
            case "-clear":
                if(p == GetLocalPlayer()) ClearTextMessages();
                break;
            case "-color":
                Colors.SetPlayerColor(p, args[1]);
                break;
            case "-sc":
                Colors.SetPlayerVertexColor(p, args);
                break;
            case "-wild":
                Colors.SetPlayerRandomVertexColor(p);
                break;
            default:
                p.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Unknown command: " + Colors.COLOR_GOLD + args[0]);
                break;
        }
    }

    private static void HandleTeamCommand(player p, string[] args)
    {
        if (args.Length == 1)
        {
            p.DisplayTextTo(CmdInfo.Error + CmdInfo.Usage);
            return;
        }

        if (int.TryParse(args[1], out int teamNumber))
        {
            if (teamNumber < 1 || teamNumber > Globals.MAX_TEAM_SIZE)
            {
                p.DisplayTextTo(CmdInfo.Error + CmdInfo.Usage);
                return;
            }
            TeamHandler.Handler(p, teamNumber);
        }
        else
        {
            p.DisplayTextTo(CmdInfo.Error + CmdInfo.Usage);
        }
    }

    private static void CommandInfoCheck(string[] parts)
    {
        if (parts.Length == 1)
        {
            CmdInfo = CommandManager.GetCommandInfo(parts[0]);
        }
        else if (parts.Length == 2)
            CmdInfo = CommandManager.GetCommandInfo(parts[0] + " " + parts[1]);
    }

}