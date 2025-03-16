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
        TriggerAddAction(DebugCmdTrigger, ErrorHandler.Wrap(DebugHandle));
        TriggerAddAction(NewCmdHandler, ErrorHandler.Wrap(HandleCommands));
    }

    private static void HandleCommands()
    {
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

        var command = CommandsManager.GetCommand(commandName.ToLower());
        if (command != null && (command.Group == CommandsManager.GetPlayerGroup(@event.Player) || command.Group == "all"))
        {
            command.Action?.Invoke(@event.Player, args);
        }

        else
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}Command not found.|r");
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

        if (command.StartsWith("?") && Utility.IsDeveloper(player))
        {
            if (command.ToLower().StartsWith("?exec")) ExecuteLua.LuaCode(player, chatString);
        }
    }
}
