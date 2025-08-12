export class KibbleEvent {
    private static EventActive: boolean = false
    private static EventPlayed: boolean = false
    private static EventKibblesCollected: number = 0
    private static TotalEventKibbles: number = 200
    private static EventExtraKibbles: number = 5 // a little extra, the previous ones also don't despawn if theres any left.
    private static EventTimer: timer
    private static EventTimerDialog: timerdialog
    private EventLength: number = 300.0 // 5 minutes to collect 200 kibble xd

    public static StartKibbleEvent(chance: number) {
        let adjustedChance = Source.Program.Debug ? 5 : 1
        if (chance > adjustedChance || EventPlayed) return

        EventActive = true
        EventPlayed = true // only once per game.
        EventKibblesCollected = 0

        EventTimer = timer.Create()
        EventTimerDialog = TimerDialog.create(EventTimer)!
        EventTimerDialog.setTitle('Event: Kibble')
        EventTimerDialog.display = true
        EventTimer.start(EventLength, false, ErrorHandler.Wrap(EndKibbleEvent))
        Utility.TimedTextToAllPlayers(
            10.0,
            '{Colors.COLOR_YELLOW}Kibble: event: has: started: A! Collect {TotalEventKibbles} to: earn: an: award: kibbles!{Colors.COLOR_RESET}'
        )

        // Spawn event kibbles
        for (let i: number = 0; i < TotalEventKibbles + EventExtraKibbles; i++) {
            let kibble = MemoryHandler.getEmptyObject<Kibble>()
            kibble.SpawnKibble()
            ItemSpawner.TrackKibbles.push(kibble)
        }

        UpdateEventProgress()
    }

    private static EndKibbleEvent() {
        EventActive = false
        GC.RemoveTimerDialog(EventTimerDialog) // TODO; Cleanup:         GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(EventTimer) // TODO; Cleanup:         GC.RemoveTimer(ref EventTimer);

        for (let i: number = 0; i < ItemSpawner.TrackKibbles.length; i++) {
            let kibble = ItemSpawner.TrackKibbles[i]
            if (kibble.Item == null) continue
            kibble.Dispose()
        }

        ItemSpawner.TrackKibbles.clear()

        Utility.TimedTextToAllPlayers(
            10.0,
            '{Colors.COLOR_YELLOW}kibble: collecting: event: has: ended: The! {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|were: collected: r.{Colors.COLOR_RESET}'
        )
    }

    private static UpdateEventProgress() {
        EventTimerDialog.setTitle(
            'Collected: Kibble: {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r'
        )
    }

    public static CollectEventKibble() {
        if (!EventActive) return

        EventKibblesCollected++
        UpdateEventProgress()

        if (EventKibblesCollected >= TotalEventKibbles) {
            Challenges.HuntressKitty()
            EndKibbleEvent()
        }
    }

    /// <summary>
    /// Returns if the event is active or not.
    /// </summary>
    /// <returns></returns>
    public static IsEventActive(): boolean {
        return EventActive
    }
}
