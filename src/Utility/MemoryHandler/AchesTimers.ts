

class AchesTimers extends IDisposeable
{
    public Timer: timer = CreateTimer();
    public AchesTimers()
    {
    }

    public Pause(pause: boolean = true)
    {
        if (Timer == null) Logger.Warning("TIMER IS NULL in {nameof(AchesTimers)}.Pause()");
        if (pause)
            Timer?.Pause();
        else
            Timer?.Resume();
    }

    public Resume()
    {
        if (Timer == null) Logger.Warning("TIMER IS NULL in {nameof(AchesTimers)}.Resume()");
        Timer?.Resume();
    }

    public Dispose()
    {
        Pause();
        ObjectPool<AchesTimers>.ReturnObject(this);
    }
}
