using System.Collections.Generic;

public static class GamemodeManager
{
    private static Dictionary<string, GamemodeInfo> commands = new Dictionary<string, GamemodeInfo>();

    public static void InitializeCommands()
    {
        // Add commands here
        AddCommand(
            "-t solo",
            "Tournament Solo",
            "Usage: -t solo <prog | race >"
        );
        AddCommand(
            "-t team",
            "Tournament Team",
            "Usage: -t team <fp | freepick | r | random> <teamsize>"
        );
        AddCommand(
            "-team",
            "Pick A Team",
            "Usage: -team {team number}"
        );
    }

    private static void AddCommand(string cmd, string desc, string usage)
    {
        desc = Colors.COLOR_YELLOW_ORANGE + desc;
        usage = Colors.COLOR_GOLD + usage;
        GamemodeInfo command = new GamemodeInfo(cmd, desc, usage);
        commands.Add(cmd.ToLower(), command);
    }

    public static GamemodeInfo GetCommandInfo(string cmd)
    {
        return commands.ContainsKey(cmd.ToLower()) ? commands[cmd.ToLower()] : null;
    }
}

public class GamemodeInfo
{
    public string Cmd { get; }
    public string Desc { get; }
    public string Usage { get; }
    public string Error = Colors.COLOR_YELLOW_ORANGE + "Invalid command or usage " + Colors.COLOR_RESET;

    public GamemodeInfo(string cmd, string desc, string usage)
    {
        Cmd = cmd;
        Desc = desc;
        Usage = usage;
    }
}
