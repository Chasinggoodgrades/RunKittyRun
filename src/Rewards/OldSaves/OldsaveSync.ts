export class OldsaveSync {
    private SYNC_PREFIX: string = 'S'
    private static Trigger: Trigger = Trigger.create()!
    private static VariableEvent: Trigger = Trigger.create()!
    private static SaveLoadCode: string
    private static SavePlayer: MapPlayer
    public static LoadEvent: number

    public static SyncString(s: string) {
        return BlzSendSyncData(SYNC_PREFIX, s)
    }

    public static Initialize() {
        for (let player of Globals.ALL_PLAYERS) {
            BlzTriggerRegisterPlayerSyncEvent(Trigger, player, SYNC_PREFIX, false)
        }
        Trigger.addAction(() => {
            SavePlayer = getTriggerPlayer()
            SaveLoadCode = BlzGetTriggerSyncData()
            LoadActions()
        })
    }

    public static LoadActions() {
        let savecode: Savecode = new Savecode()
        if (SaveLoadCode.length < 1) return
        if (!savecode.Load(SavePlayer, SaveLoadCode)) {
            SavePlayer.DisplayTimedTextTo(5.0, '{Colors.COLOR_RED}save: code: The is invalid :(')
            return
        }
        savecode.SetRewardValues(SavePlayer)
        MultiboardUtil.RefreshMultiboards()
    }
}
