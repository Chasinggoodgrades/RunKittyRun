using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class GeneralCmds
{
    private static CommandInfo CmdInfo = null;

    public static void Handle(player p, string command)
    {
        var args = command.Split(' ');
        var kitty = Globals.ALL_KITTIES[p];
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
                break;
            case "-clear":
                Utility.ClearScreen(p);
                break;
            case "-colors":
                Colors.ListColorCommands(p);
                break;
            case "-color":
                Colors.SetPlayerColor(p, args[1]);
                break;
            case "-kick":
                Votekick.InitiateVotekick(p, args[1]);
                break;
            case "-endround":
                VoteEndRound.InitiateVote(p);
                break;
            case "-yes":
                Votekick.IncrementTally();
                VoteEndRound.IncrementVote(p);
                break;
            case "-affixinfo":
                var affixes = AffixFactory.CalculateAffixes();
                p.DisplayTextTo(Colors.COLOR_GOLD + "Current Affixes:\n" + string.Join("\n", affixes));
                break;
            case "-sc":
            case "-setcolor":
            case "-vc":
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
                CameraUtil.HandleZoomCommand(p, args);
                break;
            case "-lc":
            case "-lockcamera":
            case "&f":
                CameraUtil.LockCamera(p);
                break;
            case "-reset":
                CameraUtil.UnlockCamera(p);
                FrameManager.InitalizeButtons();
                break;
            case "-kc":
                PlayerLeaves.PlayerLeavesActions(p);
                p.Remove(playergameresult.Defeat);
                break;
            case "-oldcode":
                Savecode.LoadString();
                break;
            case "-obs":
            case "-observer":
                Utility.MakePlayerSpectator(p);
                break;
            case "-overheadcam":
                CameraUtil.OverheadCamera(p, 280f);
                break;
            default:
                p.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Unknown command: " + Colors.COLOR_GOLD + args[0]);
                break;
        }
    }

    public static string DisplayCommands(player p = null)
    {
        string commandList = string.Join("\n", new string[]
        {
            "-team [#] - Switches to #'d team. (Team Mode Free Pick Only)",
            "-save - Save your current game stats",
            "-affixInfo - Displays current round affixes",
            "-clear - Clear your screen",
            "-color [color] - Set your player color",
            "-colors - Display all available colors",
            "-sc [rgb] | -setcolor [rgb] | -vc [rgb] - Set your player vertex color",
            "-wild - Set a random vertex color",
            "-hidenames | -hn - Hide all floating name tags",
            "-shownames | -sn - Show all floating name tags",
            "-kick [playerNumber] - Initiate a votekick against a player",
            "-zoom [xxxx] | -cam [xxxx] - Adjust the camera zoom level",
            "-oldcode - Loads a previous save from RKR 4.2.0+",
            "-endround - Initiate a vote to end the round (Solo Tournament Only)",
            "-lc | -lockcamera - Locks your camera to your unit",
            "-reset - Resets your camera to default",
            "-kc - Kicks yourself from the game",
            "-overheadcam - Gives an overhead view",
            "-obs | -observer - Removes all units from game and you become an observer/spectator."
        });

        if(p != null) p.DisplayTimedTextTo(15.0f, Colors.COLOR_TURQUOISE + "Available Commands:\n" + Colors.COLOR_YELLOW + commandList, 0, 10);
        return commandList;
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
