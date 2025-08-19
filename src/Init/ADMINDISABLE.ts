import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { MapPlayer } from 'w3ts'
import { EncodingBase64 } from '../SaveSystem2.0/Base64'

export class ADMINDISABLE {
    public static AdminOnly: boolean = false // enable if restricted to admins/VIPs only.

    public static AdminsGame(): boolean {
        if (!ADMINDISABLE.AdminOnly) return true
        for (const player of Globals.ALL_PLAYERS) {
            if (IsDeveloper(player)) return true
        }
        for (const player of Globals.ALL_PLAYERS) {
            player.DisplayTimedTextTo(
                60.0,
                `${Colors.COLOR_RED}This map is in the testing phase. Only Admins... Coming out soon.${Colors.COLOR_RESET}`
            )
            CustomDefeatBJ(player.handle, 'Admin only game!')
        }
        return false
    }
}

export const IsDeveloper = (p: MapPlayer) => {
    try {
        for (let i = 0; i < Globals.VIPLIST.length; i++) {
            if (p.name === EncodingBase64.Decode(Globals.VIPLIST[i])) {
                return true
            }
        }
        return false
    } catch (e) {
        if (e instanceof Error) {
            Logger.Warning(e.stack || '')
        } else {
            Logger.Warning('' + e)
        }

        return false
    }
}
