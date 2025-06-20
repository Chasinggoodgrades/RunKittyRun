using WCSharp.Api;

public static class ShopUtil
{
    public static bool IsPlayerInWolfLane(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var currentZone = kitty.ProgressZone;
        var region = RegionList.WolfRegions[currentZone];
        if (region.Contains(kitty.Unit.X, kitty.Unit.Y) && kitty.Alive)
        {
            player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_RED}Shops are inactive in wolf lanes.{Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }

    /// <summary>
    /// Returns true if the player is dead, false otherwise.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    public static bool PlayerIsDead(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        if (kitty == null || !kitty.Alive || kitty.ProtectionActive) // not null, cannot be alive, and pota active
        {
            player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_RED}Cannot buy shop items while you are dead! :({Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }
}
