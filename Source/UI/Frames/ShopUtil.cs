using WCSharp.Api;

public static class ShopUtil
{

    public static bool IsPlayerInWolfLane(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var currentZone = kitty.ProgressZone;
        var region = RegionList.WolfRegions[currentZone];
        if (region.Contains(kitty.Unit.X, kitty.Unit.Y)) return true;
        return false;
    }

}