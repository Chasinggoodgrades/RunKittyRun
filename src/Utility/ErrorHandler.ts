import { Logger } from 'src/Events/Logger/Logger'
import { ErrorMessagesOn } from './ErrorMessagesOn'

export class ErrorHandler {
    private static callbackMap = new Map<() => unknown, () => unknown>()

    public static Wrap<T>(cb: () => T, errorCb?: (e: unknown) => void): () => unknown {
        if (ErrorHandler.callbackMap.has(cb)) {
            return ErrorHandler.callbackMap.get(cb)!
        }

        const wrapped = () => {
            const [ok, result] = pcall(cb)

            if (ok) {
                return result
            } else {
                if (ErrorMessagesOn.active) {
                    Logger.Warning(`Error caught: ${result}`)
                }
                errorCb?.(result)
            }
        }

        ErrorHandler.callbackMap.set(cb, wrapped)
        return wrapped
    }
}
