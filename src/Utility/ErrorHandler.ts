import { Logger } from 'src/Events/Logger/Logger'
import { ErrorMessagesOn } from './ErrorMessagesOn'

export class ErrorHandler {
    public static Wrap(cb: () => void, errorCb?: (e: unknown) => void): () => void {
        return () => {
            try {
                cb()
            } catch (e) {
                if (ErrorMessagesOn.active) {
                    Logger.Warning(`Error caught: ${e}`)
                }
                errorCb?.(e)
            }
        }
    }
}
