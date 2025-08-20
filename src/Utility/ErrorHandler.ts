import { Logger } from 'src/Events/Logger/Logger'
import { ErrorMessagesOn } from './ErrorMessagesOn'

export class ErrorHandler {
    public static Wrap = <T>(cb: () => T, errorCb?: (e: unknown) => void) => {
        return () => {
            const [a, b] = pcall(cb)

            if (a) {
                return b
            } else {
                if (ErrorMessagesOn.active) {
                    Logger.Warning(`Error caught: ${b}`)
                }

                errorCb?.(b)
            }
        }
    }
}
