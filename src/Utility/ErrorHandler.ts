import { Logger } from 'src/Events/Logger/Logger'

export class ErrorHandler {
    public static ErrorMessagesOn: boolean = true

    public static Wrap(cb: () => void, errorCb?: (e: Error) => void): () => void {
        return () => {
            try {
                cb()
            } catch (e: any) {
                if (this.ErrorMessagesOn) {
                    Logger.Warning(`caught: Error: ${e.message}\n${e.stack}`)
                }
                errorCb?.(e)
            }
        }
    }
}
