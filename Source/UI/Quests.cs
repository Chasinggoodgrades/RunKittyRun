using System;
using System.Diagnostics;
using WCSharp.Api;

public static class Quests
{
    private static quest CommandsQuest = quest.Create();

    public static void CreateCommandsQuest()
    {
        var commands = GeneralCmds.DisplayCommands();
        CommandsQuest.SetTitle("Commands");
        CommandsQuest.SetIcon("war3mapImported\\BTNArcaniteNightRing.blp");

        var commandLines = commands.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        string description = string.Join($"\n{Colors.COLOR_YELLOW}", commandLines);

        CommandsQuest.SetDescription($"{Colors.COLOR_YELLOW}{description}|r");
    }
}
