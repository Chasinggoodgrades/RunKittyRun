using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public enum CommandTier
{
    All = 0,
    Red = 1,
    VIP = 2,
    Admin = 3,
    Developer = 4
}

public class Commands
{
    public string Name { get; set; }
    public string[] Alias { get; set; }
    public CommandTier Tier { get; set; }
    public string ArgDesc { get; set; }
    public string Description { get; set; }
    public Action<player, string[]> Action { get; set; }
}

public static class CommandsManager
{
    public static int Count = 0;
    private static Dictionary<string, Commands> AllCommands = new();
    private static List<Commands> CommandsList = new List<Commands>();
    private static List<Kitty> KittiesList = new List<Kitty>();

    public static void RegisterCommand(string name, string alias, CommandTier tier, string argDesc, string description, Action<player, string[]> action)
    {
        var command = new Commands
        {
            Name = name,
            Alias = alias.Split(','),
            Tier = tier,
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
        KittiesList.Clear();
        var kitties = KittiesList;
        var larg = arg.ToLower();

        if (arg == "") // no arg for self
        {
            kitties.Add(Globals.ALL_KITTIES[GetTriggerPlayer()]);
        }
        else if (larg == "a" || larg == "all")
        {
            for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
            {
                var kitty = Globals.ALL_KITTIES_LIST[i];
                kitties.Add(kitty); // add all players
            }
        }
        else if (larg == "ai" || larg == "computer" || larg == "computers")
        {
            for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
            {
                var kitty = Globals.ALL_KITTIES_LIST[i];
                if ( ( kitty.Player.SlotState == playerslotstate.Playing && kitty.Player.Controller == mapcontrol.Computer) // Slotted Comp Players
                    || ( kitty.Player.SlotState == playerslotstate.Empty && kitty.Player.Controller == mapcontrol.User) )  // Ingame added comp players
                {
                    kitties.Add(kitty); // add all AI players
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
        var playerTier = GetPlayerTier(player);

        foreach (var command in AllCommands)
        {
            var cmd = command.Value;
            if (CommandsList.Contains(cmd)) continue; // already got cmd / alias
            if (playerTier >= cmd.Tier)
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
            var aliasText = cmd.Alias.Length > 0 && cmd.Alias[0] != ""
                ? $" {Colors.COLOR_GREY}({string.Join(", ", cmd.Alias)}){Colors.COLOR_RESET}"
                : "";
            var argText = string.IsNullOrEmpty(cmd.ArgDesc) ? "" : $" {Colors.COLOR_RED}{cmd.ArgDesc}{Colors.COLOR_RESET}";

            commandList += $"[{Colors.GetColoredCommandTier(cmd.Tier)}] {Colors.COLOR_YELLOW}{cmd.Name}{Colors.COLOR_RESET}{aliasText}{argText} - {Colors.COLOR_GOLD}{cmd.Description}{Colors.COLOR_RESET}\n";
        }

        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_TURQUOISE}Available Commands:|r\n{commandList}", 0, 0);
    }

    public static CommandTier GetPlayerTier(player player)
    {
        if (Globals.ALL_KITTIES.TryGetValue(player, out var kitty))
        {
            return kitty.CommandTier;
        }

        if (Globals.DEVELOPER_LIST.Contains(player)) return CommandTier.Developer;
        if (Globals.ADMIN_LIST.Contains(player)) return CommandTier.Admin;
        if (Globals.VIP_LIST.Contains(player)) return CommandTier.VIP;
        return player.Id == 0 ? CommandTier.Red : CommandTier.All;
    }

    public static CommandTier InitCommandTier(Kitty k)
    {
        if (Globals.DEVELOPER_LIST.Contains(k.Player))
        {
            k.CommandTier = CommandTier.Developer;
        }
        else if (Globals.ADMIN_LIST.Contains(k.Player))
        {
            k.CommandTier = CommandTier.Admin;
        }
        else if (Globals.VIP_LIST.Contains(k.Player))
        {
            k.CommandTier = CommandTier.VIP;
        }
        else if (k.Player.Id == 0)
        {
            k.CommandTier = CommandTier.Red;
        }
        else
        {
            k.CommandTier = CommandTier.All;
        }
        return k.CommandTier;
    }
}
