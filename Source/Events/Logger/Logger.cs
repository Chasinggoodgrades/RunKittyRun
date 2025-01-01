using System;

public static class Logger
{
    public static void Verbose(params object[] messages)
    {
        Log("[VERBOSE]", messages);
    }

    public static void Warning(params object[] messages)
    {
        Log("[WARNING]", messages);
    }

    public static void Critical(params object[] messages)
    {
        Log("[CRITICAL]", messages);
    }

    private static void Log(string level, params object[] messages)
    {
        Console.WriteLine($"[{level}] {string.Join(" ", messages)}");
    }
}
