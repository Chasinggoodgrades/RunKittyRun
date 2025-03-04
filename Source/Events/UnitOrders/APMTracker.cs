/*

using WCSharp.Api;
public class APMTracker
{
    private const float CAPTURE_INTERVAL = 0.1f;
    public static trigger ClicksTrigger = trigger.Create();
    private timer Timer { get; set; } = timer.Create();
    private Kitty Kitty { get; set; }
    private bool Active { get; set; }

    public APMTracker(Kitty kitty)
    {
        Kitty = kitty;
        Init();
    }

    private void Init()
    {
        Timer.Start(CAPTURE_INTERVAL, true, RunningTime);
    }

    private void RunningTime()
    {
        // if not in safezone region && game is active


        // Active = true
    }

    private void DetectClicks()
    {
        // if != Active, return

        // Increment clicks with trigger
    }

}

*/