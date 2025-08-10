class ShopChanger {
    private static SantaSkin: number = Constants.UNIT_SANTA
    private static HalloweenSkin: number
    private static ValentinesSkin: number
    private static EasterSkin: number
    private static NormalSkin: number = Constants.UNIT_KITTY_VENDOR

    public static Initialize() {
        if (SeasonalManager.Season == HolidaySeasons.None) return
        SetSeasonalShop()
    }

    public static SetSeasonalShop() {
        switch (SeasonalManager.Season) {
            case HolidaySeasons.None:
                SetShopsToSkin(NormalSkin)
                break

            case HolidaySeasons.Christmas:
                SetShopsToSkin(SantaSkin)
                break
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

    private static SetShopsToSkin(skinType: number) {
        let tempGroup = group.Create()
        tempGroup.EnumUnitsInRect(
            Globals.WORLD_BOUNDS,
            Filter(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY_VENDOR)
        )
        while (true) {
            let vendor = tempGroup.First
            if (vendor == null) break
            tempGroup.Remove(vendor)
            vendor.Skin = skinType
        }
        GC.RemoveGroup(tempGroup) // TODO; Cleanup:         GC.RemoveGroup(ref tempGroup);
    }
}
