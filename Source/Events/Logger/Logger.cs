using System;

public static class Logger
{
    public static void Verbose(params object[] messages)
    {
        Log("[VERBOSE]", Colors.COLOR_GREY, messages);
    }

    public static void Warning(params object[] messages)
    {
        Log("[WARNING]", Colors.COLOR_YELLOW, messages);
    }

    public static void Critical(params object[] messages)
    {
        Log("[CRITICAL]", Colors.COLOR_RED, messages);
    }

    private static void Log(string level, string color, params object[] messages)
    {
        if (!Source.Program.Debug) return;
        Console.WriteLine($"{color}[{level}] {string.Join(" ", messages)}|r");
    }
}


