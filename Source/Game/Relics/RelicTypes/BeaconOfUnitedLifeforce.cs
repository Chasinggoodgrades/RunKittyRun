using static WCSharp.Api.Common;
using WCSharp.Api;

public class BeaconOfUnitedLifeforce : Relic
{
    public const int RelicItemID = Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE;
    private static float EXTRA_REVIVE_CHANCE_SINGLE = 0.125f; // 12.5%
    private static float EXTRA_REVIVE_CHANCE_ALL = 0.02f; // 2%

    public BeaconOfUnitedLifeforce() : base(
        "Beacon of United Lifeforce",
        "A relic that has chance to revive other kitties",
        RelicItemID
        )
    { }

    public override void ApplyEffect(unit Unit)
    {

    }

    public override void RemoveEffect(unit Unit)
    {

    }

    public static void BeaconOfUnitedLifeforceEffect(Kitty kitty)
    {
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;
        var chance = GetRandomReal(0.00f, 1.00f);
        if (chance > EXTRA_REVIVE_CHANCE_SINGLE) return;
        foreach (var k in Globals.ALL_KITTIES.Values)
        {
            if (k.Alive) continue;
            k.ReviveKitty(kitty);
            if (chance > EXTRA_REVIVE_CHANCE_ALL) break;
        }
    }

}