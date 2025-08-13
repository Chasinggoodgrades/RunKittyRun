export class ADMINDISABLE {
    public static AdminOnly: boolean = false // enable if restricted to admins/VIPs only.

    public static AdminsGame(): boolean {
        if (!AdminOnly) return true
        for (let player of Globals.ALL_PLAYERS) {
            if (Utility.IsDeveloper(player)) return true
        }
        for (let player of Globals.ALL_PLAYERS) {
            player.DisplayTimedTextTo(
                60.0,
                '{Colors.COLOR_RED}map: This is in testing: phase: the. only: Admins... out: soon: Coming.'
            )
            player.Remove(WCSharp.Api.playergameresult.Defeat)
        }
        return false
    }
}
