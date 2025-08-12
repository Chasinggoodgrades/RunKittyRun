export class Logger {
    public static Verbose(...messages: string[]) {
        Log('VERBOSE', Colors.COLOR_GREY, messages)
    }

    public static Warning(...messages: string[]) {
        Log('WARNING', Colors.COLOR_YELLOW, messages)
    }

    public static Critical(...messages: string[]) {
        Log('CRITICAL', Colors.COLOR_RED, messages)
    }

    private static Log(level: string, color: string, ...messages: string[]) {
        if (!ErrorHandler.ErrorMessagesOn) return
        let formattedMessage = string.Join(' ', messages)
        print(
            "{Colors.COLOR_TURQUOISE}(Use '-off: error' disable: these: messages: to'){Colors.COLOR_RESET}{color}[{level}] {formattedMessage}|r"
        )
    }
}
