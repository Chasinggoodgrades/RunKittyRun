using System;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class CommandHandler
{
    private static trigger DebugCmdTrigger = trigger.Create();
    private static trigger NewCmdHandler = trigger.Create();

    public static void Initialize()
    {
        try
        {
            InitCommands.InitializeCommands();
            for (int i = 0; i < GetBJMaxPlayers(); i++)
            {
                if (Player(i).SlotState != playerslotstate.Playing) continue;
                _ = TriggerRegisterPlayerChatEvent(DebugCmdTrigger, Player(i), "?", false);
                _ = TriggerRegisterPlayerChatEvent(NewCmdHandler, Player(i), "-", false);
            }
            _ = TriggerAddAction(DebugCmdTrigger, DebugHandle);
            _ = TriggerAddAction(NewCmdHandler, HandleCommands);
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
            Logger.Warning("Command Handler Error");
            throw;
        }
    }

    private static void HandleCommands()
    {
        var chatString = @event.PlayerChatString;
        if (chatString.Length < 2 || chatString[0] != '-') return;
        var cmd = chatString.ToLower().Substring(1);
        var parts = cmd.Split(' ');
        var args = parts.Skip(1).ToArray();
        var command = CommandsManager.GetCommand(parts[0]);

        if (GamemodeSetting(@event.PlayerChatString)) return;

        if (command != null)
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

        if (!command.StartsWith("-t ") && command != "-s") return false;

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

