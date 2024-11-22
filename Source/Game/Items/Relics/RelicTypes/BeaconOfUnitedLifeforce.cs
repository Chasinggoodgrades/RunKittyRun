using static WCSharp.Api.Common;
using WCSharp.Api;
using System;

public class BeaconOfUnitedLifeforce : Relic
{
    public const int RelicItemID = Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE;
    private static float INVULNERABILITY_DURATION = 1.0f;
    private static float EXTRA_REVIVE_CHANCE_SINGLE = 0.125f; // 12.5%
    private static float EXTRA_REVIVE_CHANCE_ALL = 0.02f; // 2%
    private static new string IconPath = "war3mapImported\\BTNTicTac.blp";
    private const int RelicCost = 650;

    public BeaconOfUnitedLifeforce() : base(
        "|cff1e90ffBeacon of United Lifeforce|r",
        $"Gives the owner a chance to revive an extra Kitty whenever they revive someone. {Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Extra revived teammates will have {INVULNERABILITY_DURATION} second immunity when they're revived.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Each revive has a very small chance to simply revive all dead players.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {

    }

    public override void RemoveEffect(unit Unit)
    {

    }

    public static void BeaconOfUnitedLifeforceEffect(Kitty kitty)
    {
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));
        var chance = GetRandomReal(0.00f, 1.00f);
        if (chance > EXTRA_REVIVE_CHANCE_SINGLE) return;
        foreach (var k in Globals.ALL_KITTIES.Values)
        {
            if (k.Alive) continue;
            k.ReviveKitty(kitty);
            UpgradeInvulnerability(kitty, k);
            if (upgradeLevel < 2) break;
            Console.WriteLine("Chance for Reviving Dead Players Works as intended");
            if (chance > EXTRA_REVIVE_CHANCE_ALL) break;
        }
    }

    private static void UpgradeInvulnerability(Kitty beaconHolder, Kitty extraRevivedKitty)
    {
        if (PlayerUpgrades.GetPlayerUpgrades(beaconHolder.Player).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce)) < 1) return;
        extraRevivedKitty.Invulnerable = true;
        Console.WriteLine(extraRevivedKitty.Unit.Name + " is invulnerable for " + INVULNERABILITY_DURATION + " seconds.");
        Utility.SimpleTimer(INVULNERABILITY_DURATION, () => extraRevivedKitty.Invulnerable = false);
    }



}