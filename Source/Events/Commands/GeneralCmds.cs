using System;
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
            case "-commands":
            case "-help":
                DisplayCommands(p);
                break;
            case "-team":
                if (Gamemode.CurrentGameModeType != Globals.TEAM_MODES[0]) return;
                HandleTeamCommand(p, args);
                break;
            case "-save":
                Globals.SaveSystem.Save(p);
                p.DisplayTextTo(Colors.COLOR_GOLD + "Stats have been saved.");
                break;
            case "-clear":
                Utility.ClearScreen(p);
                break;
            case "-color":
                Colors.SetPlayerColor(p, args[1]);
                break;
            case "-sc":
            case "-setcolor":
                Colors.SetPlayerVertexColor(p, args);
                break;
            case "-wild":
                Colors.SetPlayerRandomVertexColor(p);
                break;
            case "-hidenames":
            case "-hn":
                FloatingNameTag.HideAllNameTags(p);
                break;
            case "-shownames":
            case "-sn":
                FloatingNameTag.ShowAllNameTags(p);
                break;
            case "-zoom":
            case "-cam":
                HandleZoomCommand(p, args);
                break;
            case "-oldcode":
                Savecode.LoadString();
                break;
            default:
                p.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Unknown command: " + Colors.COLOR_GOLD + args[0]);
                break;
        }
    }

    private static void DisplayCommands(player p)
    {
        string commandList = string.Join("\n", new string[]
        {
            "-team [#] - Switches to #'d team. (Team Mode Free Pick Only)",
            "-save - Save your current game stats",
            "-clear - Clear your screen",
            "-color [color] - Set your player color",
            "-sc [rgb] | -setcolor [rgb] - Set your player vertex color",
            "-wild - Set a random vertex color",
            "-hidenames | -hn - Hide all floating name tags",
            "-shownames | -sn - Show all floating name tags",
            "-zoom [xxxx] | -cam [xxxx] - Adjust the camera zoom level",
            "-oldcode - Load the previous save code (works once)"
        });

        p.DisplayTextTo(Colors.COLOR_YELLOW + "Available Commands:\n" + Colors.COLOR_YELLOW_ORANGE + commandList);
    }

    private static void HandleZoomCommand(player p, string[] args)
    {
        if (args.Length < 2)
        {
            p.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Incorrect usage: -zoom (xxxx) or -cam (xxxx)|r");
            return;
        }

        float zoom = float.Parse(args[1]);
        if (!p.IsLocal) return;
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0f);
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
        {
            CmdInfo = CommandManager.GetCommandInfo(parts[0] + " " + parts[1]);
        }
    }
}
