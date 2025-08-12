

class AchesTimers
{
    public Timer: timer = CreateTimer();
    public AchesTimers()
    {
    }

    public Pause(pause: boolean = true)
    {
        if (this.Timer == null) Logger.Warning("TIMER IS NULL in {nameof(AchesTimers)}.Pause()");
        if (pause)
            PauseTimerBJ(true, this.Timer);
        else
            PauseTimerBJ(false, this.Timer);
    }

    public Start(delay: number, repeat: boolean, callback: () => void)
    {
        if (this.Timer == null) Logger.Warning("TIMER IS NULL in {nameof(AchesTimers)}.Start()");
        TimerStart(this.Timer, delay, repeat, callback);
    }

    public Resume()
    {
        if (this.Timer == null) Logger.Warning("TIMER IS NULL in {nameof(AchesTimers)}.Resume()");
        PauseTimerBJ(false, this.Timer);
    }

    public Remaining()
    {
        return TimerGetRemaining(this.Timer);
    }

    public Dispose()
    {
        this.Pause();
        ObjectPool<AchesTimers>.ReturnObject(this);
    }
}
