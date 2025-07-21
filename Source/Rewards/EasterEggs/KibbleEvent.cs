using WCSharp.Api;

public static class KibbleEvent
{
    private static bool EventActive = false;
    private static bool EventPlayed = false;
    private static int EventKibblesCollected = 0;
    private static int TotalEventKibbles = 200;
    private static int EventExtraKibbles = 5; // a little extra, the previous ones also don't despawn if theres any left.
    private static timer EventTimer;
    private static timerdialog EventTimerDialog;
    private const float EventLength = 300.0f; // 5 minutes to collect 200 kibble xd

    public static void StartKibbleEvent(float chance)
    {
        var adjustedChance = Source.Program.Debug ? 5 : 1;
        if (chance > adjustedChance || EventPlayed) return;

        EventActive = true;
        EventPlayed = true; // only once per game.
        EventKibblesCollected = 0;

        EventTimer = timer.Create();
        EventTimerDialog = timerdialog.Create(EventTimer);
        EventTimerDialog.SetTitle("Kibble Event");
        EventTimerDialog.IsDisplayed = true;
        EventTimer.Start(EventLength, false, ErrorHandler.Wrap(EndKibbleEvent));
        Utility.TimedTextToAllPlayers(10.0f, $"{Colors.COLOR_YELLOW}A Kibble event has started! Collect {TotalEventKibbles} kibbles to earn an award!{Colors.COLOR_RESET}");

        // Spawn event kibbles
        for (int i = 0; i < TotalEventKibbles + EventExtraKibbles; i++)
        {
            var kibble = ObjectPool<Kibble>.GetEmptyObject();
            kibble.SpawnKibble();
            ItemSpawner.TrackKibbles.Add(kibble);
        }

        UpdateEventProgress();
    }

    private static void EndKibbleEvent()
    {
        EventActive = false;
        GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(ref EventTimer);

        for (int i = 0; i < ItemSpawner.TrackKibbles.Count; i++)
        {
            var kibble = ItemSpawner.TrackKibbles[i];
            if (kibble.Item == null) continue;
            kibble.Dispose();
        }

        ItemSpawner.TrackKibbles.Clear();

        Utility.TimedTextToAllPlayers(10.0f, $"{Colors.COLOR_YELLOW}The kibble collecting event has ended! {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r were collected.{Colors.COLOR_RESET}");
    }

    private static void UpdateEventProgress()
    {
        EventTimerDialog.SetTitle($"Kibble Collected: {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r");
    }

    public static void CollectEventKibble()
    {
        if (!EventActive) return;

        EventKibblesCollected++;
        UpdateEventProgress();

        if (EventKibblesCollected >= TotalEventKibbles)
        {
            Challenges.HuntressKitty();
            EndKibbleEvent();
        }
    }

    /// <summary>
    /// Returns if the event is active or not.
    /// </summary>
    /// <returns></returns>
    public static bool IsEventActive()
    {
        return EventActive;
    }
}
