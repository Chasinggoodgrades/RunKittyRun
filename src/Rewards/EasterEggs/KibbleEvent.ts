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
        const adjustedChance = !PROD ? 5 : 1
        if (chance > adjustedChance || KibbleEvent.EventPlayed) return

        KibbleEvent.EventActive = true
        KibbleEvent.EventPlayed = true // only once per game.
        KibbleEvent.EventKibblesCollected = 0

        KibbleEvent.EventTimer = Timer.create()
        KibbleEvent.EventTimerDialog = TimerDialog.create(KibbleEvent.EventTimer)!
        KibbleEvent.EventTimerDialog.setTitle('Event: Kibble')
        KibbleEvent.EventTimerDialog.display = true
        KibbleEvent.EventTimer.start(
            KibbleEvent.EventLength,
            false,
            ErrorHandler.Wrap(() => KibbleEvent.EndKibbleEvent())
        )
        Utility.TimedTextToAllPlayers(
            10.0,
            `${Colors.COLOR_YELLOW}A Kibble event has started! Collect ${KibbleEvent.TotalEventKibbles} kibbles to earn an award!${Colors.COLOR_RESET}`
        )

        // Spawn event kibbles
        for (let i = 0; i < KibbleEvent.TotalEventKibbles + KibbleEvent.EventExtraKibbles; i++) {
            const kibble = MemoryHandler.getEmptyObject<Kibble>()
            kibble.SpawnKibble() // Last error i recieved here was nil value (method 'SpawnKibble') ... MemoryHandler issue ig
            ItemSpawnerTrackKibbles.active.push(kibble)
        }

        KibbleEvent.UpdateEventProgress()
    }

    private static EndKibbleEvent = () => {
        KibbleEvent.EventActive = false
        GC.RemoveTimerDialog(KibbleEvent.EventTimerDialog.handle) // TODO; Cleanup:         GC.RemoveTimerDialog(ref EventTimerDialog);
        GC.RemoveTimer(KibbleEvent.EventTimer) // TODO; Cleanup:         GC.RemoveTimer(ref EventTimer);

        for (let i = 0; i < ItemSpawnerTrackKibbles.active.length; i++) {
            const kibble = ItemSpawnerTrackKibbles.active[i]
            if (kibble.Item === null) continue
            kibble.dispose()
        }

        ItemSpawnerTrackKibbles.active = []

        Utility.TimedTextToAllPlayers(
            10.0,
            `${Colors.COLOR_YELLOW}The kibble collecting event has ended! ${Colors.COLOR_TURQUOISE}${KibbleEvent.EventKibblesCollected}|r/${Colors.COLOR_LAVENDER}${KibbleEvent.TotalEventKibbles}|r were collected.${Colors.COLOR_RESET}`
        )
    }

    private static UpdateEventProgress = () => {
        KibbleEvent.EventTimerDialog.setTitle(
            `Kibble Collected: ${Colors.COLOR_TURQUOISE}${KibbleEvent.EventKibblesCollected}|r/${Colors.COLOR_LAVENDER}${KibbleEvent.TotalEventKibbles}|r`
        )
    }

    public static CollectEventKibble = () => {
        if (!KibbleEvent.EventActive) return

        KibbleEvent.EventKibblesCollected++
        KibbleEvent.UpdateEventProgress()

        if (KibbleEvent.EventKibblesCollected >= KibbleEvent.TotalEventKibbles) {
            Challenges.HuntressKitty()
            KibbleEvent.EndKibbleEvent()
        }
    }

    /// <summary>
    /// Returns if the event is active or not.
    /// </summary>
    /// <returns></returns>
    public static IsEventActive(): boolean {
        return KibbleEvent.EventActive
    }
}
