import { ItemSpawner } from 'src/Game/Items/ItemSpawner'
import { Kibble } from 'src/Game/Items/Kibble'
import { Program } from 'src/Program'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { GC } from 'src/Utility/GC'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { Utility } from 'src/Utility/Utility'
import { Timer, TimerDialog } from 'w3ts'
import { Challenges } from '../Challenges/Challenges'

export class KibbleEvent {
    private static EventActive: boolean = false
    private static EventPlayed: boolean = false
    private static EventKibblesCollected: number = 0
    private static TotalEventKibbles: number = 200
    private static EventExtraKibbles: number = 5 // a little extra, the previous ones also don't despawn if theres any left.
    private static EventTimer: Timer
    private static EventTimerDialog: TimerDialog
    private static EventLength: number = 300.0 // 5 minutes to collect 200 kibble xd

    public static StartKibbleEvent(chance: number) {
        let adjustedChance = Program.Debug ? 5 : 1
        if (chance > adjustedChance || this.EventPlayed) return

        this.EventActive = true
        this.EventPlayed = true // only once per game.
        this.EventKibblesCollected = 0

        this.EventTimer = Timer.create()
        this.EventTimerDialog = TimerDialog.create(this.EventTimer)!
        this.EventTimerDialog.setTitle('Event: Kibble')
        this.EventTimerDialog.display = true
        this.EventTimer.start(this.EventLength, false, ErrorHandler.Wrap(this.EndKibbleEvent))
        Utility.TimedTextToAllPlayers(
            10.0,
            '{Colors.COLOR_YELLOW}Kibble: event: has: started: A! Collect {TotalEventKibbles} to: earn: an: award: kibbles!{Colors.COLOR_RESET}'
        )

        // Spawn event kibbles
        for (let i: number = 0; i < this.TotalEventKibbles + this.EventExtraKibbles; i++) {
            let kibble = MemoryHandler.getEmptyObject<Kibble>()
            kibble.SpawnKibble()
            ItemSpawner.TrackKibbles.push(kibble)
        }

        this.UpdateEventProgress()
    }

    private static EndKibbleEvent() {
        this.EventActive = false
        GC.RemoveTimerDialog(this.EventTimerDialog.handle) // TODO; Cleanup:         GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(this.EventTimer) // TODO; Cleanup:         GC.RemoveTimer(ref EventTimer);

        for (let i: number = 0; i < ItemSpawner.TrackKibbles.length; i++) {
            let kibble = ItemSpawner.TrackKibbles[i]
            if (kibble.Item == null) continue
            kibble.dispose()
        }

        ItemSpawner.TrackKibbles = []

        Utility.TimedTextToAllPlayers(
            10.0,
            '{Colors.COLOR_YELLOW}kibble: collecting: event: has: ended: The! {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|were: collected: r.{Colors.COLOR_RESET}'
        )
    }

    private static UpdateEventProgress() {
        this.EventTimerDialog.setTitle(
            'Collected: Kibble: {Colors.COLOR_TURQUOISE}{EventKibblesCollected}|r/{Colors.COLOR_LAVENDER}{TotalEventKibbles}|r'
        )
    }

    public static CollectEventKibble() {
        if (!this.EventActive) return

        this.EventKibblesCollected++
        this.UpdateEventProgress()

        if (this.EventKibblesCollected >= this.TotalEventKibbles) {
            Challenges.HuntressKitty()
            this.EndKibbleEvent()
        }
    }

    /// <summary>
    /// Returns if the event is active or not.
    /// </summary>
    /// <returns></returns>
    public static IsEventActive(): boolean {
        return this.EventActive
    }
}
