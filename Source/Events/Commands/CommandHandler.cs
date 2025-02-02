using WCSharp.Api;
using static WCSharp.Api.Common;


public static class CommandHandler
{
    private static trigger DebugCmdTrigger = CreateTrigger();

    public static void Initialize()
    {

        for (int i = 0; i < GetBJMaxPlayers(); i++)
        {
            if (Player(i).SlotState != playerslotstate.Playing) continue;
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, Player(i), "-", false);
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, Player(i), "?", false);
        }
        TriggerAddAction(DebugCmdTrigger, HandleCommand);
    }

    private static void HandleCommand()
    {
        var player = @event.Player;
        var command = @event.PlayerChatString.ToLower();

        if (command.StartsWith("-t ") || command == "-s")
        {
            GamemodeCmd.Handle(player, command);
        }
        else if (command.StartsWith("?") && Utility.IsDeveloper(player))
        {
            DebugCmd.Handle(player, command);
        }
        else if (command.StartsWith("-"))
        {
            GeneralCmds.Handle(player, command);
        }
    }
}

