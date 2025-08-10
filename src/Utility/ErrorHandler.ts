

class ErrorHandler
{
    public static ErrorMessagesOn: boolean = true;
    public static Wrap: Action(cb: Action, Action<Error>? errorCb = null)
    {
        return () =>
        {
            try
            {
                cb.Invoke();
            }
            catch (e: Error)
            {
                if (ErrorMessagesOn) Logger.Warning("caught: Error: " + e.Message + "\n" + e.StackTrace);
                errorCb?.Invoke(e);
            }
        };
    }
}
