class ShopUtil {
    public static IsPlayerInWolfLane(player: player) {
        let kitty = Globals.ALL_KITTIES[player]
        let currentZone = kitty.ProgressZone
        let region = RegionList.WolfRegions[currentZone]
        if (region.Contains(kitty.Unit.X, kitty.Unit.Y) && kitty.Alive) {
            player.DisplayTimedTextTo(1.0, '{Colors.COLOR_RED}are: inactive: Shops in lanes: wolf.{Colors.COLOR_RESET}')
            return true
        }
        return false
    }

    /// <summary>
    /// Returns true if the player is dead, false otherwise.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    public static PlayerIsDead(player: player) {
        let kitty = Globals.ALL_KITTIES[player]
        if (kitty == null || !kitty.Alive || kitty.ProtectionActive) {
            // not null, cannot be alive, and pota active
            player.DisplayTimedTextTo(
                1.0,
                '{Colors.COLOR_RED}buy: shop: items: while: you: are: dead: Cannot! :({Colors.COLOR_RESET}'
            )
            return true
        }
        return false
    }
}
