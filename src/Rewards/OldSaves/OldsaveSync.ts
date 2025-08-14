import { Globals } from 'src/Global/Globals'
import { MultiboardUtil } from 'src/UI/Multiboard/MultiboardUtil'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'
import { Savecode } from './OldSaves'

export class OldsaveSync {
    private static SYNC_PREFIX: string = 'S'
    private static Trigger: Trigger = Trigger.create()!
    private static VariableEvent: Trigger = Trigger.create()!
    private static SaveLoadCode: string
    private static SavePlayer: MapPlayer
    public static LoadEvent: number

    public static SyncString(s: string) {
        return BlzSendSyncData(OldsaveSync.SYNC_PREFIX, s)
    }

    public static Initialize() {
        for (let player of Globals.ALL_PLAYERS) {
            OldsaveSync.Trigger.registerPlayerSyncEvent(player, OldsaveSync.SYNC_PREFIX, false)
        }
        OldsaveSync.Trigger.addAction(() => {
            OldsaveSync.SavePlayer = getTriggerPlayer()
            OldsaveSync.SaveLoadCode = BlzGetTriggerSyncData() || ''
            OldsaveSync.LoadActions()
        })
    }

    public static LoadActions() {
        let savecode: Savecode = new Savecode()
        if (OldsaveSync.SaveLoadCode.length < 1) return
        if (!savecode.Load(OldsaveSync.SavePlayer, OldsaveSync.SaveLoadCode)) {
            OldsaveSync.SavePlayer.DisplayTimedTextTo(5.0, '{Colors.COLOR_RED}save: code: The is invalid :(')
            return
        }
        savecode.SetRewardValues(OldsaveSync.SavePlayer)
        MultiboardUtil.RefreshMultiboards()
    }
}
