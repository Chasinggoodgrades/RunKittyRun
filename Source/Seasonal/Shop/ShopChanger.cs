using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public static class ShopChanger
{
    private static int SantaSkin = Constants.UNIT_SANTA;
    private static int HalloweenSkin;
    private static int ValentinesSkin;
    private static int EasterSkin;
    private static int NormalSkin = Constants.UNIT_KITTY_VENDOR;

    public static void Initialize()
    {
        if (SeasonalManager.Season == HolidaySeasons.None) return;
        SetSeasonalShop();
    }

    public static void SetSeasonalShop()
    {
        switch (SeasonalManager.Season)
        {
            case HolidaySeasons.None:
                SetShopsToSkin(NormalSkin);
                break;

            case HolidaySeasons.Christmas:
                SetShopsToSkin(SantaSkin);
                break;
                /*            case HolidaySeasons.Halloween:
                                HalloweenShop();
                                break;

                            case HolidaySeasons.Easter:
                                EasterShop();
                                break;

                            case HolidaySeasons.Valentines:
                                ValentinesShop();
                                break;*/
        }
    }

    private static void SetShopsToSkin(int skinType)
    {
        var tempGroup = group.Create();
        tempGroup.EnumUnitsInRect(Globals.WORLD_BOUNDS, Filter(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY_VENDOR));
        var tempList = tempGroup.ToList();
        foreach (var vendor in tempList)
            vendor.Skin = skinType;
        GC.RemoveList(ref tempList);
        GC.RemoveGroup(ref tempGroup);
    }
}
