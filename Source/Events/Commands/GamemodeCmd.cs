using WCSharp.Api;

public static class GamemodeCmd
{
    private static GamemodeInfo CmdInfo;

    public static void Handle(player player, string command)
    {
        if (player != Gamemode.HostPlayer && !Globals.VIPLISTUNFILTERED.Contains(player))
        {
            player.DisplayTimedTextTo(10.0f, Colors.COLOR_YELLOW_ORANGE + "Only " + Colors.PlayerNameColored(Gamemode.HostPlayer) + Colors.COLOR_YELLOW_ORANGE + " can choose the gamemode.");
            return;
        }
        if (Gamemode.IsGameModeChosen)
        {
            player.DisplayTimedTextTo(10.0f, Colors.COLOR_YELLOW_ORANGE + "Gamemode has already been chosen. Cannot change gamemode.");
            return;
        }
        var parts = command.Split(' ');
        CommandInfoCheck(parts);

        switch (parts[0])
        {
            case "-s":
                HandleStandardMode(player);
                break;

            case "-t":
                HandleTeamOrSoloMode(player, parts);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "Use: -s, -t solo, -t team");
                break;
        }
    }

    private static void CommandInfoCheck(string[] parts)
    {
        if (parts[0] == "-s")
        {
            CmdInfo = GamemodeManager.GetCommandInfo(parts[0]);
            return;
        }
        else if (parts.Length < 2)
            return;
        else
        {
            var commandXD = parts[0] + " " + parts[1];
            CmdInfo = GamemodeManager.GetCommandInfo(commandXD);
        }
    }

    private static void HandleStandardMode(player player)
    {
        Gamemode.SetGameMode(Globals.GAME_MODES[0]);
    }

    private static void HandleTeamOrSoloMode(player player, string[] parts)
    {
        if (parts.Length < 2)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> or -t team <fp | freepick | r | random>");
            return;
        }

        switch (parts[1])
        {
            case "solo":
                HandleSoloMode(player, parts);
                break;

            case "team":
                HandleTeamMode(player, parts);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> or -t team <fp | freepick | r | random>");
                break;
        }
    }

    private static void HandleSoloMode(player player, string[] parts)
    {
        // var = parts [1] and 2

        if (parts.Length != 3)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
            return;
        }

        var mode = parts[2];
        switch (mode)
        {
            case "progression":
            case "progress":
            case "prog":
                Gamemode.SetGameMode(Globals.GAME_MODES[1], Globals.SOLO_MODES[0]);
                break;

            case "race":
                Gamemode.SetGameMode(Globals.GAME_MODES[1], Globals.SOLO_MODES[1]);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
                break;
        }
    }

    private static void HandleTeamMode(player player, string[] parts)
    {
        if (parts.Length < 3)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
            return;
        }

        var mode = parts[2];
        int teamSize = Globals.DEFAULT_TEAM_SIZE;
        if (parts.Length == 4 && !int.TryParse(parts[3], out _))
        {
            Globals.MAX_TEAM_SIZE.ToString();
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
            return;
        }
        else if (parts.Length == 4 && int.TryParse(parts[3], out int parsedTeamSize))
        {
            if (parsedTeamSize <= Globals.MAX_TEAM_SIZE && parsedTeamSize != 0)
            {
                teamSize = parsedTeamSize;
            }
            else
            {
                Globals.MAX_TEAM_SIZE.ToString();
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
                return;
            }
        }

        switch (mode)
        {
            case "fp":
            case "freepick":
                Gamemode.SetGameMode(Globals.GAME_MODES[2], Globals.TEAM_MODES[0], teamSize);
                break;

            case "r":
            case "random":
                Gamemode.SetGameMode(Globals.GAME_MODES[2], Globals.TEAM_MODES[1], teamSize);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + CmdInfo.Usage);
                break;
        }
    }
}
