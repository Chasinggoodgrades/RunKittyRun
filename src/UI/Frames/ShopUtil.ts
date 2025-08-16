import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Colors } from 'src/Utility/Colors/Colors'
import { MapPlayer } from 'w3ts'

export class ShopUtil {
    public static IsPlayerInWolfLane(player: MapPlayer) {
        let kitty = Globals.ALL_KITTIES.get(player)!
        let currentZone = kitty.ProgressZone
        let region = RegionList.WolfRegions[currentZone]
        if (region.includes(kitty.Unit.x, kitty.Unit.y) && kitty.isAlive()) {
            player.DisplayTimedTextTo(1.0, `${Colors.COLOR_RED}Shops are inactive in wolf lanes.${Colors.COLOR_RESET}`)
            return true
        }
        return false
    }

    /// <summary>
    /// Returns true if the player is dead, false otherwise.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    public static PlayerIsDead(player: MapPlayer) {
        let kitty = Globals.ALL_KITTIES.get(player)!
        if (kitty === null || !kitty.isAlive() || kitty.ProtectionActive) {
            // not null, cannot be alive, and pota active
            player.DisplayTimedTextTo(
                1.0,
                `${Colors.COLOR_RED}Cannot buy shop items while you are dead! :(${Colors.COLOR_RESET}`
            )
            return true
        }
        return false
    }
}
