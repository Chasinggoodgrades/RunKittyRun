using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class AchesTimers : IDisposable
{
    public timer Timer { get; set; }
    public AchesTimers()
    {
        Timer = CreateTimer();
    }

    public void Pause(bool pause = true)
    {
        if (Timer == null) Console.WriteLine("TIMER IS NULL");
        if (pause)
            Timer?.Pause();
        else
            Timer?.Resume();
    }

    public void Resume()
    {
        if (Timer == null) Console.WriteLine("TIMER IS NULL");
        Timer?.Resume();
    }

    public void Dispose()
    {
        Pause();
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
