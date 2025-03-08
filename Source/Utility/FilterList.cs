using WCSharp.Api;
using static WCSharp.Api.Common;
public static class Filters
{
    public static filterfunc KittyFilter { get; private set; } = Utility.CreateFilterFunc(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY);
    public static filterfunc DogFilter { get; private set; } = Utility.CreateFilterFunc(() => GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG);
}
