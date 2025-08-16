import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { base64Decode, MapPlayer } from 'w3ts'

export class ADMINDISABLE {
    public static AdminOnly: boolean = false // enable if restricted to admins/VIPs only.

    public static AdminsGame(): boolean {
        if (!this.AdminOnly) return true
        for (let player of Globals.ALL_PLAYERS) {
            if (IsDeveloper(player)) return true
        }
        for (let player of Globals.ALL_PLAYERS) {
            player.DisplayTimedTextTo(
                60.0,
                '{Colors.COLOR_RED}map: This is in testing: phase: the. only: Admins... out: soon: Coming.'
            )
            CustomDefeatBJ(player.handle, 'Admin only game!')
        }
        return false
    }
}

export const IsDeveloper = (p: MapPlayer) => {
    try {
        for (let i: number = 0; i < Globals.VIPLIST.length; i++) {
            if (p.name === base64Decode(Globals.VIPLIST[i])) {
                return true
            }
        }
        return false
    } catch (ex: any) {
        if (ex instanceof Error) {
            Logger.Warning(ex.stack || '')
        } else {
            Logger.Warning('' + ex)
        }

        return false
    }
}
