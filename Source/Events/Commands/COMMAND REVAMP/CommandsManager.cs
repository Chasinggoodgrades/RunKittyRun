﻿using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Commands
{
    public string Name { get; set; }
    public string[] Alias { get; set; }
    public string Group { get; set; } // "all", "vip", "admin", "dev" "some other shit? naw prolly good", "oh yeah, i should put red lmao"
    public string ArgDesc { get; set; }
    public string Description { get; set; }
    public Action<player, string[]> Action { get; set; }
}

public static class CommandsManager
{
    public static int Count = 0;
    private static Dictionary<string, Commands> AllCommands = new();
    private static List<Commands> CommandsList = new List<Commands>();

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
        Count = Count + 1;
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

        if (arg == "") // no arg for self
        {
            kitties.Add(Globals.ALL_KITTIES[GetTriggerPlayer()]);
        }
        else if (larg == "a" || larg == "all")
        {
            foreach (var kitty in Globals.ALL_KITTIES)
            {
                kitties.Add(kitty.Value);
            }
        }
        else if (larg == "ai" || larg == "computer" || larg == "computers")
        {
            foreach (var kitty in Globals.ALL_KITTIES)
            {
                if (kitty.Key.SlotState != playerslotstate.Playing || kitty.Key.Controller == mapcontrol.Computer)
                {
                    kitties.Add(kitty.Value); // add all AI players
                }
            }
        }
        else if (larg == "s" || larg == "sel" || larg == "select" || larg == "selected")
        {
            var selectedUnit = CustomStatFrame.SelectedUnit[GetTriggerPlayer()];
            if (selectedUnit != null)
            {
                var kitty = Globals.ALL_KITTIES.TryGetValue(selectedUnit.Owner, out var k) ? k : null;
                if (kitty != null)
                {
                    kitties.Add(kitty);
                }
            }
        }
        else if (int.TryParse(arg, out int playerId))
        {
            if (Globals.ALL_KITTIES.TryGetValue(Player(playerId - 1), out var kitty)) // assume player ids 1-24
            {
                kitties.Add(kitty);
            }
        }
        else if (Utility.GetPlayerByName(larg) is player p)
        {
            if (Globals.ALL_KITTIES.TryGetValue(p, out var kitty))
            {
                kitties.Add(kitty);
            }
        }
        else if (Colors.GetPlayerByColor(larg) is player pl)
        {
            if (Globals.ALL_KITTIES.TryGetValue(pl, out var kitty))
            {
                kitties.Add(kitty);
            }
        }
        else
        {
            GetTriggerPlayer().DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}Invalid player ID:|r {arg}.{Colors.COLOR_RESET}");
        }
        return kitties;
    }

    public static void ResolvePlayerId(string arg, Action<Kitty> action)
    {
        var kittyArray = ResolvePlayerIdArray(arg);

        for (int i = 0; i < kittyArray.Count; i++)
        {
            action(kittyArray[i]);
        }
        GC.RemoveList(ref kittyArray);
    }

    public static bool GetBool(string arg)
    {
        if (string.IsNullOrEmpty(arg)) return false;
        var lower = arg.ToLower();
        return lower == "true" || lower == "on" || lower == "1";
    }

    public static void HelpCommands(player player, string arg = "")
    {
        var filter = string.IsNullOrEmpty(arg) ? "" : arg.ToLower();
        CommandsList.Clear(); // instead of creating a new list each time, just use 1 and clear it
        var playerGroup = GetPlayerGroup(player);

        foreach (var command in AllCommands)
        {
            var cmd = command.Value;
            if (CommandsList.Contains(cmd)) continue; // already got cmd / alias
            if (cmd.Group == playerGroup || cmd.Group == "all" || playerGroup == "admin") // admins get ALL DUH
            {
                if (string.IsNullOrEmpty(arg) || arg.Length == 0)
                {
                    CommandsList.Add(cmd);
                }
                else
                {
                    if (cmd.Name.ToLower().Contains(filter) || Array.Exists(cmd.Alias, alias => alias.ToLower().Contains(filter)) || cmd.Description.ToLower().Contains(filter))
                    {
                        CommandsList.Add(cmd);
                    }
                }
            }
        }
        if (CommandsList.Count == 0)
        {
            player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}No commands found for filter: {Colors.COLOR_GOLD}{filter}|r");
            return;
        }

        var commandList = "";
        foreach (var cmd in CommandsList)
        {
            commandList += $"{Colors.COLOR_YELLOW}( {cmd.Name} | {string.Join(", ", cmd.Alias)} )|r{Colors.COLOR_RED}[{cmd.ArgDesc}]{Colors.COLOR_RESET} - {Colors.COLOR_GOLD}{cmd.Description}|r\n";
        }

        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_TURQUOISE}Available Commands:|r\n{commandList}", 0, 0);
    }

    public static string GetPlayerGroup(player player)
    {
        return Globals.VIPLISTUNFILTERED.Contains(player) ? "admin" : player.Id == 0 ? "red" : "all";
    }
}
