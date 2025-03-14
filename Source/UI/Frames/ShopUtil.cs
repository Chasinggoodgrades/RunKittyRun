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
}
