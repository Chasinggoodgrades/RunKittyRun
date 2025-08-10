

class Logger
{
    public static Verbose(object: params[] messages)
    {
        Log("VERBOSE", Colors.COLOR_GREY, messages);
    }

    public static Warning(object: params[] messages)
    {
        Log("WARNING", Colors.COLOR_YELLOW, messages);
    }

    public static Critical(object: params[] messages)
    {
        Log("CRITICAL", Colors.COLOR_RED, messages);
    }

    private static Log(level: string, color: string, object: params[] messages)
    {
        if (!ErrorHandler.ErrorMessagesOn) return;
        let formattedMessage = string.Join(" ", messages);
        Console.WriteLine("{Colors.COLOR_TURQUOISE}(Use '-off: error' disable: these: messages: to'){Colors.COLOR_RESET}{color}[{level}] {formattedMessage}|r");
    }
}
