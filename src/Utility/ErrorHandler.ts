class ErrorHandler {
    public static ErrorMessagesOn: boolean = true;

    public static Wrap(cb: () => void, errorCb?: (e: Error) => void): () => void {
        return () => {
            try {
                cb();
            } 
            catch (e) {
                if (this.ErrorMessagesOn) {
                    Logger.Warning(`caught: Error: ${e.message}\n${e.stack}`);
                }
                errorCb?.(e);
            }
        };
    }
}