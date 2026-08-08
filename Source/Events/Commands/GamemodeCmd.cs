using System;
using WCSharp.Api;

public static class GamemodeCmd
{
    private static GamemodeInfo CmdInfo;

    public static void Handle(player player, string command)
    {
        try
        {
            if (player != Gamemode.HostPlayer && !Globals.VIP_LIST.Contains(player) && !Globals.ADMIN_LIST.Contains(player) && !Globals.DEVELOPER_LIST.Contains(player))
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
        catch (Exception ex)
        {
            Logger.Warning("Error handling gamemode command: " + ex.Message);
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
        Gamemode.SetGameMode(GameMode.Standard);
    }

    private static void HandleTeamOrSoloMode(player player, string[] parts)
    {
        if (parts.Length < 3)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> <NA | EU> OR -t team <fp | freepick | r | random> <teamsize> {av <on | off>} <NA | EU>");
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
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> <NA | EU> or -t team <fp | freepick | r | random> <teamsize> {av <on | off>} <NA | EU>");
                break;
        }
    }

    private static void HandleSoloMode(player player, string[] parts)
    {
        if (parts.Length != 4)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> <NA | EU>");
            return;
        }

        var mode = parts[2];
        var region = parts[3].ToUpper();

        if (region != "NA" && region != "EU")
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "Region must be NA or EU.");
            return;
        }

        TournamentSaver.Instance.SetRegion(region);

        switch (mode)
        {
            case "progression":
            case "progress":
            case "prog":
                Gamemode.SetGameMode(GameMode.Solo, Globals.SOLO_MODES[0]);
                break;

            case "race":
                Gamemode.SetGameMode(GameMode.Solo, Globals.SOLO_MODES[1]);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t solo <prog | race> <NA | EU>");
                break;
        }
    }

    private static void HandleTeamMode(player player, string[] parts)
    {
        const string usage = "-t team <fp | freepick | r | random> <teamsize> {av <on | off>} <NA | EU>";

        if (parts.Length < 4)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + usage);
            return;
        }

        var mode = parts[2];
        int teamSize = Globals.DEFAULT_TEAM_SIZE;
        bool autoRevive = false;
        int index = 3;

        // Optional <teamsize>
        if (index < parts.Length - 1 && int.TryParse(parts[index], out int parsedTeamSize))
        {
            if (parsedTeamSize > Globals.MAX_TEAM_SIZE || parsedTeamSize == 0)
            {
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "Team size must be between 1 and " + Globals.MAX_TEAM_SIZE);
                return;
            }

            teamSize = parsedTeamSize;
            index++;
        }

        // Optional {av <on | off>}
        if (index < parts.Length - 1 && parts[index].ToLower() == "av")
        {
            index++;
            if (index >= parts.Length - 1 || (parts[index].ToLower() != "on" && parts[index].ToLower() != "off"))
            {
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "av must be followed by on or off.");
                return;
            }

            autoRevive = parts[index].ToLower() == "on";
            index++;
        }

        if (index != parts.Length - 1)
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + usage);
            return;
        }

        var region = parts[index].ToUpper();

        if (region != "NA" && region != "EU")
        {
            player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "Region must be NA or EU.");
            return;
        }

        Gamemode.SetAutoRevive(autoRevive);
        TournamentSaver.Instance.SetRegion(region);

        switch (mode)
        {
            case "fp":
            case "freepick":
                Gamemode.SetGameMode(GameMode.Team, Globals.TEAM_MODES[0], teamSize);
                break;

            case "r":
            case "random":
                Gamemode.SetGameMode(GameMode.Team, Globals.TEAM_MODES[1], teamSize);
                break;

            default:
                player.DisplayTimedTextTo(10.0f, CmdInfo.Error + Colors.COLOR_GOLD + "-t team <fp | freepick | r | random> <teamsize> <NA | EU>");
                break;
        }
    }
}
