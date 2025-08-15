import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorMessagesOn } from '../../Utility/ErrorMessagesOn'

export class Logger {
    public static Verbose(...messages: string[]) {
        Logger.Log('VERBOSE', Colors.COLOR_GREY, ...messages)
    }

    public static Warning(...messages: string[]) {
        Logger.Log('WARNING', Colors.COLOR_YELLOW, ...messages)
    }

    public static Critical(...messages: string[]) {
        Logger.Log('CRITICAL', Colors.COLOR_RED, ...messages)
    }

    private static Log(level: string, color: string, ...messages: string[]) {
        if (!ErrorMessagesOn.active) return
        let formattedMessage = messages.join(' ')
        print(
            `${Colors.COLOR_TURQUOISE}(Use '-error off' to disable these messages')${Colors.COLOR_RESET}${color}[${level}] ${formattedMessage}|r`
        )
    }
}
