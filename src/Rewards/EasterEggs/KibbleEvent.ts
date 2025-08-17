import { PROD } from 'src/env'
import { Kibble } from 'src/Game/Items/Kibble'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { GC } from 'src/Utility/GC'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { Utility } from 'src/Utility/Utility'
import { Timer, TimerDialog } from 'w3ts'
import { ItemSpawnerTrackKibbles } from '../../Game/Items/ItemSpawnerTrackKibbles'
import { Challenges } from '../Challenges/Challenges'

export class KibbleEvent {
    private static EventActive: boolean = false
    private static EventPlayed: boolean = false
    private static EventKibblesCollected = 0
    private static TotalEventKibbles = 200
    private static EventExtraKibbles = 5 // a little extra, the previous ones also don't despawn if theres any left.
    private static EventTimer: Timer
    private static EventTimerDialog: TimerDialog
    private static EventLength = 300.0 // 5 minutes to collect 200 kibble xd

    public static StartKibbleEvent(chance: number) {
        let adjustedChance = !PROD ? 5 : 1
        if (chance > adjustedChance || this.EventPlayed) return

        this.EventActive = true
        this.EventPlayed = true // only once per game.
        this.EventKibblesCollected = 0

        this.EventTimer = Timer.create()
        this.EventTimerDialog = TimerDialog.create(this.EventTimer)!
        this.EventTimerDialog.setTitle('Event: Kibble')
        this.EventTimerDialog.display = true
        this.EventTimer.start(
            this.EventLength,
            false,
            ErrorHandler.Wrap(() => this.EndKibbleEvent())
        )
        Utility.TimedTextToAllPlayers(
            10.0,
            `${Colors.COLOR_YELLOW}A Kibble event has started! Collect ${this.TotalEventKibbles} kibbles to earn an award!${Colors.COLOR_RESET}`
        )

        // Spawn event kibbles
        for (let i = 0; i < this.TotalEventKibbles + this.EventExtraKibbles; i++) {
            let kibble = MemoryHandler.getEmptyObject<Kibble>()
            kibble.SpawnKibble() // Last error i recieved here was nil value (method 'SpawnKibble') ... MemoryHandler issue ig
            ItemSpawnerTrackKibbles.active.push(kibble)
        }

        this.UpdateEventProgress()
    }

    private static EndKibbleEvent() {
        this.EventActive = false
        GC.RemoveTimerDialog(this.EventTimerDialog.handle) // TODO; Cleanup:         GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(this.EventTimer) // TODO; Cleanup:         GC.RemoveTimer(ref EventTimer);

        for (let i = 0; i < ItemSpawnerTrackKibbles.active.length; i++) {
            let kibble = ItemSpawnerTrackKibbles.active[i]
            if (kibble.Item === null) continue
            kibble.dispose()
        }

        ItemSpawnerTrackKibbles.active = []

        Utility.TimedTextToAllPlayers(
            10.0,
            `${Colors.COLOR_YELLOW}The kibble collecting event has ended! ${Colors.COLOR_TURQUOISE}${KibbleEvent.EventKibblesCollected}|r/${Colors.COLOR_LAVENDER}${KibbleEvent.TotalEventKibbles}|r were collected.${Colors.COLOR_RESET}`
        )
    }

    private static UpdateEventProgress() {
        this.EventTimerDialog.setTitle(
            `Kibble Collected: ${Colors.COLOR_TURQUOISE}${KibbleEvent.EventKibblesCollected}|r/${Colors.COLOR_LAVENDER}${KibbleEvent.TotalEventKibbles}|r`
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
