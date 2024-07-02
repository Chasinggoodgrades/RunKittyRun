using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared.Data;
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
            default:
                p.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "Unknown command: " + Color.COLOR_GOLD + args[0]);
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
