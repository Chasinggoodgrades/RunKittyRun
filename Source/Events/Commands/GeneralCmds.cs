using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class GeneralCmds
{
    private static CommandInfo CmdInfo = null;

    public static void Handle(player p, string command)
    {
        var args = command.Split(' ');
        Globals.ALL_KITTIES.TryGetValue(p, out var kitty);
        CommandInfoCheck(args);

        switch (args[0])
        {
            case "-commands":
            case "-help":
            case "-?":
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
            case "-clr":
            case "-c":
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
                p.DisplayTextTo(Colors.COLOR_GOLD + "Current Affixes:\n" + string.Join("\n", affixes) + $"\n{Colors.COLOR_LAVENDER}Total: {AffixFactory.AllAffixes.Count}");
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
            case "-fpc":
            case "-firstperson":
            case "-firstpersoncamera":
                FirstPersonCameraManager.ToggleFirstPerson(p);
                break;
            case "-reset":
                CameraUtil.UnlockCamera(p);
                FrameManager.InitalizeButtons();
                break;
            case "-kc":
                PlayerLeaves.PlayerLeavesActions(p);
                Blizzard.CustomDefeatBJ(p, $"{Colors.COLOR_RED}You kicked yourself!|r");
                break;
            case "-oldcode":
                Savecode.LoadString();
                break;
            case "-apm":
                p.DisplayTimedTextTo(10.0f, UnitOrders.CalculateAllAPM());
                break;
            case "-stats":
                AwardingCmds.GetAllGameStats(p);
                break;
            case "-kibble":
                var kibbleList = "";
                foreach (var playerx in Kibble.PickedUpKibble)
                {
                    if (playerx.Value == 0) continue;
                    kibbleList += $"{Colors.PlayerNameColored(playerx.Key)}: {playerx.Value}\n";
                }
                p.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_GOLD}Kibble Collected:\n{kibbleList}");
                break;
            case "-obs":
            case "-observer":
                Utility.MakePlayerSpectator(p);
                break;
            case "-overheadcam":
            case "-overhead":
            case "-topdown":
            case "-ohc":
                CameraUtil.OverheadCamera(p, 280f);
                break;
            case "-komotocam":
                CameraUtil.ToggleKomotoCam(p);
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
            "-clear | -c - Clears your screen",
            "-color [color] - Set your player color",
            "-colors - Display all available colors",
            "-sc [rgb] | -setcolor [rgb] | -vc [rgb] - Set your player vertex color",
            "-wild - Set a random vertex color",
            "-kibble - Displays the kibble collected by each player",
            "-hidenames | -hn - Hide all floating name tags",
            "-shownames | -sn - Show all floating name tags",
            "-kick [playerNumber] - Initiate a votekick against a player",
            "-zoom [xxxx] | -cam [xxxx] - Adjust the camera zoom level",
            "-oldcode - Loads a previous save from RKR 4.2.0+",
            "-apm - Displays your APM for ACTIVE game time. (not counting intermissions)",
            "-endround - Initiate a vote to end the round (Solo Tournament Only)",
            "-lc | -lockcamera - Locks your camera to your unit",
            "-stats - Displays game stats of whoever you currently have selected",
            "-reset - Resets your camera to default",
            "-kc - Kicks yourself from the game",
            "-overheadcam | -overhead | -ohc | -topdown - Gives an overhead view",
            "-obs | -observer - Removes all units from game and you become an observer/spectator."
        });

        if (p != null) p.DisplayTimedTextTo(15.0f, Colors.COLOR_TURQUOISE + "Available Commands:\n" + Colors.COLOR_YELLOW + commandList, 0, 10);
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
