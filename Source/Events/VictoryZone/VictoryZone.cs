using WCSharp.Api;
using static WCSharp.Api.Common;

public static class VictoryZone
{
    private static trigger InVictoryArea;
    public static bool VictoryAreaActive = true;

    public static void Initialize()
    {
        InVictoryArea = trigger.Create();
        VictoryAreaTrigger();
    }

    private static void VictoryAreaTrigger()
    {
        var VictoryArea = Regions.Victory_Area.Region;
        InVictoryArea.RegisterEnterRegion(VictoryArea, Filter(() => Gamemode.Current.CanTriggerVictory(GetFilterUnit())));
        InVictoryArea.AddAction(ErrorHandler.Wrap(VictoryAreaActions));
    }

    private static void VictoryAreaActions()
    {
        var u = @event.Unit;
        var player = u.Owner;
        if (!VictoryAreaActive)
        {
            player.DisplayTimedTextTo(1.5f, $"{Colors.COLOR_TURQUOISE}Victory Area is currently deactivated!{Colors.COLOR_RESET}");
            return;
        }

        if (u.UnitType != Constants.UNIT_KITTY) return;
        if (!Globals.GAME_ACTIVE) return;

        var kitty = Globals.ALL_KITTIES[player];
        Gamemode.Current.OnVictoryZoneEntered(kitty);
        MultiboardUtil.RefreshMultiboards();
    }

    /// <summary>
    /// Whether a unit currently counts as "in" the victory area, for modes
    /// (Team) that need to check this for other units besides the one that
    /// just triggered the region-enter event.
    /// </summary>
    public static bool IsUnitInVictoryContainer(unit u)
    {
        return Regions.Victory_Area.Region.Contains(u) || Regions.safe_Area_14.Region.Contains(u);
    }
}
