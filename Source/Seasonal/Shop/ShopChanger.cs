using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public static class ShopChanger
{
    public static void Initialize() => Apply(SeasonalManager.CurrentTheme);

    /// <summary>Re-skins every vendor to match the given theme. Replaces the old season switch.</summary>
    public static void Apply(SeasonTheme theme)
    {
        var tempGroup = group.Create();
        tempGroup.EnumUnitsInRect(Globals.WORLD_BOUNDS, Filter(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY_VENDOR));
        while (true)
        {
            var vendor = tempGroup.First;
            if (vendor == null) break;
            tempGroup.Remove(vendor);
            vendor.Skin = theme.VendorSkin;
        }
        GC.RemoveGroup(ref tempGroup);
    }

    // Compatibility wrapper - remove once you've confirmed nothing outside
    // these files calls it directly.
    public static void SetSeasonalShop() => Apply(SeasonalManager.CurrentTheme);
}
