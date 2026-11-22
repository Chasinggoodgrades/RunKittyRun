using System;
using static WCSharp.Api.Common;
using WCSharp.Api;

public static class Logger
{
    public static void Verbose(params object[] messages)
    {
        Log("VERBOSE", Colors.COLOR_GREY, messages);
    }

    public static void Warning(params object[] messages)
    {
        Log("WARNING", Colors.COLOR_YELLOW, messages);
    }

    public static void Critical(params object[] messages)
    {
        Log("CRITICAL", Colors.COLOR_RED, messages);
    }

    public static void Debug(params object[] messages)
    {
        if (!Source.Program.Debug) return;
        Log("DEBUG", Colors.COLOR_LIGHTBLUE, messages);
    }
    private static void Log(string level, string color, params object[] messages)
    {
        var formattedMessage = string.Join(" ", messages);
        var text = $"{Colors.COLOR_TURQUOISE}(Use '-error off' to disable these messages'){Colors.COLOR_RESET}{color}[{level}] {formattedMessage}|r";
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            if (!ErrorHandler.ShouldShowErrors(player)) continue; // new players are skipped by default; -error on/off overrides per player
            player.DisplayTimedTextTo(10.0f, text);
        }
    }
}
