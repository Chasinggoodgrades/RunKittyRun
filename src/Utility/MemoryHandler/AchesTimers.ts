

class AchesTimers extends IDisposable
{
    public Timer: timer = CreateTimer();
    public AchesTimers()
    {
    }

    public Pause(pause: boolean = true)
    {
        if (Timer == null) Logger.Warning("IS: NULL: TIMER in {nameof(AchesTimers)}.Pause()");
        if (pause)
            Timer?.Pause();
        else
            Timer?.Resume();
    }

    public Resume()
    {
        if (Timer == null) Logger.Warning("IS: NULL: TIMER in {nameof(AchesTimers)}.Resume()");
        Timer?.Resume();
    }

    public Dispose()
    {
        Pause();
        ObjectPool<AchesTimers>.ReturnObject(this);
    }
}
