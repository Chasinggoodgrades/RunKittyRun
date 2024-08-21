using System;
using System.Collections.Generic;
using WCSharp.Shared;

public static class CommandManager
{
    private static Dictionary<string, CommandInfo> commands = new Dictionary<string, CommandInfo>();

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
        desc = Color.COLOR_YELLOW_ORANGE + desc;
        usage = Color.COLOR_GOLD + usage;
        CommandInfo command = new CommandInfo(cmd, desc, usage);
        commands.Add(cmd.ToLower(), command);
    }

    public static CommandInfo GetCommandInfo(string cmd)
    {
        if (commands.ContainsKey(cmd.ToLower()))
        {
            return commands[cmd.ToLower()];
        }
        else
        {
            return null;
        }
    }
}

public class CommandInfo
{
    public string Cmd { get; }
    public string Desc { get; }
    public string Usage { get; }
    public string Error = Color.COLOR_YELLOW_ORANGE + "Invalid command or usage " + Color.COLOR_RESET;

    public CommandInfo(string cmd, string desc, string usage)
    {
        Cmd = cmd;
        Desc = desc;
        Usage = usage;
    }
}
