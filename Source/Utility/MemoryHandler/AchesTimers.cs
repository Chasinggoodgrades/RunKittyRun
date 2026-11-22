using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class AchesTimers : IDisposable
{
    public timer Timer { get; set; } = CreateTimer();
    public AchesTimers()
    {
    }

    public void Pause(bool pause = true)
    {
        if (Timer == null) Logger.Warning($"TIMER IS NULL in {nameof(AchesTimers)}.Pause()");
        if (pause)
            Timer?.Pause();
        else
            Timer?.Resume();
    }

    public void Resume()
    {
        if (Timer == null) Logger.Warning($"TIMER IS NULL in {nameof(AchesTimers)}.Resume()");
        Timer?.Resume();
    }

    public void Dispose()
    {
        Pause();
        if (!PoolConfig.Enabled)
        {
            // not being recycled, so the native timer has to be destroyed here or it leaks
            Timer?.Dispose();
            Timer = null;
            return;
        }
        ObjectPool<AchesTimers>.ReturnObject(this);
    }
}
