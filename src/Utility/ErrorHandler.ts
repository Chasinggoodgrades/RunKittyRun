import { Logger } from 'src/Events/Logger/Logger'
import { ErrorMessagesOn } from './ErrorMessagesOn'

export class ErrorHandler {
    public static Wrap = (cb: () => void, errorCb?: (e: unknown) => void) => {
        return () => {
            const [a, b] = pcall(cb)

            if (!a) {
                if (ErrorMessagesOn.active) {
                    Logger.Warning(`Error caught: ${b}`)
                }

                errorCb?.(b)
            }
        }
    }
}
