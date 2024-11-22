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
        // Check if the kitty has the Beacon of United Lifeforce item
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;

        // Retrieve the upgrade level for the Beacon of United Lifeforce
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));

        // Generate a random chance
        var chance = GetRandomReal(0.00f, 1.00f);

        // Check if the random chance is greater than the single revive chance
        if (chance > EXTRA_REVIVE_CHANCE_SINGLE) return;

        // Revive all kitties if chance <= EXTRA_REVIVE_CHANCE_ALL, otherwise revive one kitty
        bool reviveAll = chance <= EXTRA_REVIVE_CHANCE_ALL;

        var color = Colors.COLOR_YELLOW_ORANGE;

        foreach (var k in Globals.ALL_KITTIES.Values)
        {
            if (k.Alive) continue;

            k.ReviveKitty(kitty);
            UpgradeInvulnerability(kitty, k);

            if (!reviveAll) Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(k.Player)}{color} has been extra revived by {Colors.PlayerNameColored(kitty.Player)}!|r");
            if (!reviveAll) break;
            Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(kitty.Player)}{color} has extra revived all dead players!|r");
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