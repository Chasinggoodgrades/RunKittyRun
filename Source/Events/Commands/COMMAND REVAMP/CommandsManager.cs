using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class Commands
{
    public string Name { get; set; }
    public string[] Alias { get; set; }
    public string Group { get; set; } // "all", "vip", "admin", "dev" "some other shit? naw prolly good"
    public string ArgDesc { get; set; }
    public string Description { get; set; }
    public Action<player, string[]> Action { get; set; }
}

public static class CommandsManager
{
    private static Dictionary<string, Commands> AllCommands = new();
    public static void RegisterCommand(string name, string alias, string group, string argDesc, string description, Action<player, string[]> action)
    {
        var command = new Commands
        {
            Name = name,
            Alias = alias.Split(','),
            Group = group,
            ArgDesc = argDesc,
            Description = description,
            Action = action
        };

        AllCommands[name] = command;
        foreach (var al in command.Alias)
        {
            AllCommands[al] = command;
        }
    }

    public static Commands GetCommand(string name)
    {
        return AllCommands.TryGetValue(name, out var command) ? command : null;
    }


    private static List<Kitty> ResolvePlayerIdArray(string arg)
    {
        var kitties = new List<Kitty>();
        var larg = arg.ToLower();

        if (larg == "a" || larg == "all")
        {
            foreach (var kitty in Globals.ALL_KITTIES)
            {
                kitties.Add(kitty.Value);
            }
        }
        else if (int.TryParse(arg, out int playerId))
        {
            if (Globals.ALL_KITTIES.TryGetValue(Player(playerId), out var kitty))
            {
                kitties.Add(kitty);
            }
        }
        else
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Invalid player ID:|r {arg}");
        }

        return kitties;
    }

    public static void ResolvePlayerIds(string arg, Action<Kitty> action)
    {
        var kittyArray = ResolvePlayerIdArray(arg);
        foreach (var k in kittyArray)
        {
            action(k);
        }
        GC.RemoveList(ref kittyArray);
    }

    public static void HelpCommands(player player, string arg = "")
    {
        var filter = string.IsNullOrEmpty(arg) ? "" : arg.ToLower();
        var commands = new List<Commands>();
        var playerGroup = GetPlayerGroup(player);

        foreach (var command in AllCommands)
        {
            var cmd = command.Value;
            if (commands.Contains(cmd)) continue; // already got cmd / alias
            if (cmd.Group == playerGroup || cmd.Group == "all")
            {
                if (string.IsNullOrEmpty(arg) || arg.Length == 0)
                {
                    commands.Add(cmd);
                }
                else
                {
                    if (cmd.Name.ToLower().Contains(filter) || Array.Exists(cmd.Alias, alias => alias.ToLower().Contains(filter)))
                    {
                        commands.Add(cmd);
                    }
                }

            }
        }
        if (commands.Count == 0)
        {
            player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}No commands found for filter: {Colors.COLOR_GOLD}{filter}");
            return;
        }

        var commandList = "";
        foreach (var cmd in commands)
        {
            commandList += $"{Colors.COLOR_YELLOW}( {cmd.Name} | {string.Join(", ", cmd.Alias)} ){Colors.COLOR_RED}[{cmd.ArgDesc}]{Colors.COLOR_RESET} - {Colors.COLOR_GOLD}{cmd.Description}\n";
        }

        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_TURQUOISE}Available Commands:\n{commandList}", 0, 0);
    }

    private static string GetPlayerGroup(player player)
    {
        return Utility.IsDeveloper(player) ? "admin" : "all";
    }
}