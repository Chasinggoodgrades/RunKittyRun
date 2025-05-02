using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class AchesTimers : IDisposable
{
    public timer Timer { get; set; } = timer.Create();
    public AchesTimers()
    {

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
        Timer?.Pause();
        ObjectPool.ReturnObject(this);
    }
}

public class AchesActions : IDisposable
{

    public Action Action { get; set; }
    public AchesActions()
    {
    }
    public void Dispose()
    {
        Action = null;
        ObjectPool.ReturnObject(this);
    }
}
