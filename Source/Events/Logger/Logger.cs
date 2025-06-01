using System;

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

    private static void Log(string level, string color, params object[] messages)
    {
        if (!ErrorHandler.ErrorMessagesOn) return;
        var formattedMessage = string.Join(" ", messages);
        Console.WriteLine($"{Colors.COLOR_TURQUOISE}(Use '-error off' to disable these messages'){Colors.COLOR_RESET}{color}[{level}] {formattedMessage}|r");
    }
}
