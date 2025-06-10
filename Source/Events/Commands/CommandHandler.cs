using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class CommandHandler
{
    private static trigger DebugCmdTrigger = trigger.Create();
    private static trigger NewCmdHandler = trigger.Create();
    private static readonly string[] EmptyStringArray = new string[] { "" };

    public static void Initialize()
    {
        InitCommands.InitializeCommands();
        for (int i = 0; i < GetBJMaxPlayers(); i++)
        {
            if (Player(i).SlotState != playerslotstate.Playing) continue;
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, Player(i), "?", false);
            TriggerRegisterPlayerChatEvent(NewCmdHandler, Player(i), "-", false);
        }
        TriggerAddAction(DebugCmdTrigger, DebugHandle);
        TriggerAddAction(NewCmdHandler, HandleCommands);
    }

    private static void HandleCommands()
    {
        if (!Globals.GAME_INITIALIZED) return;
        var chatString = @event.PlayerChatString;
        if (chatString.Length < 2 || chatString[0] != '-')
            return;

        var cmd = chatString.Substring(1);
        var spaceIndex = cmd.IndexOf(' ');

        string commandName;
        string[] args;

        if (spaceIndex < 0)
        {
            commandName = cmd;
            args = EmptyStringArray;
        }
        else
        {
            commandName = cmd.Substring(0, spaceIndex);
            var remainder = cmd.Substring(spaceIndex + 1);
            var split = remainder.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            args = split.Length > 0 ? split : EmptyStringArray;
        }

        if (GamemodeSetting(@event.PlayerChatString))
            return;

        try
        {

            var command = CommandsManager.GetCommand(commandName.ToLower());
            var playerGroup = CommandsManager.GetPlayerGroup(@event.Player);
            if (command != null && (command.Group == playerGroup || command.Group == "all" || playerGroup == "admin"))
            {
                command.Action?.Invoke(@event.Player, args);
            }
            else
            {
                @event.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_YELLOW_ORANGE}Command not found.|r");
            }
        }
        catch (Exception ex)
        {
            @event.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_YELLOW_ORANGE}Error executing command:{Colors.COLOR_RESET} {Colors.COLOR_RED}{ex.Message} {ex.StackTrace}{Colors.COLOR_RESET}");
            return;
        }
    }

    private static bool GamemodeSetting(string chatString)
    {
        var player = @event.Player;
        var command = chatString.ToLower();

        if (!command.StartsWith("-t ") && command != "-s" && !command.StartsWith("-dev")) return false;

        GamemodeCmd.Handle(player, command);
        return true;
    }

    private static void DebugHandle()
    {
        var player = @event.Player;
        var chatString = @event.PlayerChatString;
        var command = chatString.ToLower();

        if (command.StartsWith("?") && Globals.VIPLISTUNFILTERED.Contains(player))
        {
            if (command.ToLower().StartsWith("?exec")) ExecuteLua.LuaCode(player, chatString);
        }
    }
}
