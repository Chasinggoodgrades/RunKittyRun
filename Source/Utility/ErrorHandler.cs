using System;

public static class ErrorHandler
{
    public static bool ErrorMessagesOn = true;
    public static Action Wrap(Action cb, Action<Exception>? errorCb = null)
    {
        return () =>
        {
            try
            {
                cb();
            }
            catch (Exception e)
            {
                if (ErrorMessagesOn) Logger.Warning("Error caught: " + e.Message + "\n" + e.StackTrace);
                errorCb?.Invoke(e);
            }
        };
    }
}
