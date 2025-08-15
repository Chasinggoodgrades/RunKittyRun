import { Logger } from 'src/Events/Logger/Logger'
import { ErrorMessagesOn } from './ErrorMessagesOn'

export class ErrorHandler {
    public static Wrap(cb: () => void, errorCb?: (e: Error) => void): () => void {
        return () => {
            try {
                cb()
            } catch (e: any) {
                if (ErrorMessagesOn.active) {
                    Logger.Warning(`Error caught: ${e.message}\n${e.stack}`)
                }
                errorCb?.(e)
            }
        }
    }
}
