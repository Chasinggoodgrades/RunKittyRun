using System;
using WCSharp.Api;

public class AchesHandles : IDisposable
{
    public timer Timer { get; set; }

    public AchesHandles()
    {

    }

    public void Start(float time, bool periodic, Action action)
    {
        Timer ??= timer.Create();

        Timer.Start(time, periodic, () =>
        {
            action?.Invoke();
            if (!periodic) Dispose();
        });
    }

    public void Pause()
    {
        Timer?.Pause();
    }

    public void Resume()
    {
        Timer?.Resume();
    }

    public void Dispose()
    {
        Timer.Pause();
        MemoryHandler.DestroyObject(this);
    }

    /// <summary>
    /// Creates a simple timer that will run the action after the specified time.
    /// Then dispose object for reuse.
    /// </summary>
    /// <param name="time"></param>
    /// <param name="action"></param>
    public static AchesHandles SimpleTimer(float time, Action action)
    {
        var timer = MemoryHandler.GetEmptyObject<AchesHandles>();       // MEMORY HANDLER IS ASS ... C# IS ASS, EVERYTHING SUCKS
        timer.Start(time, false, action);
        return timer;
    }

}
