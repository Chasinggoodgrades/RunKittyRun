using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class BeaconOfUnitedLifeforce : Relic
{
    public const int RelicItemID = Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE;
    private static float INVULNERABILITY_DURATION = 1.0f;
    private static float EXTRA_REVIVE_CHANCE_SINGLE = 0.125f; // 12.5%
    private static float EXTRA_REVIVE_CHANCE_ALL = 0.0175f; // 1.75%
    private static float EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE = 0.01f; // 1%
    private static new string IconPath = "war3mapImported\\BTNTicTac.blp";
    private const int RelicCost = 650;
    private float ReviveChance = EXTRA_REVIVE_CHANCE_SINGLE;

    private player Owner;

    public BeaconOfUnitedLifeforce() : base(
        "|cff1e90ffBeacon of United Lifeforce|r",
        $"Gives the owner a chance to revive an extra Kitty whenever they revive someone. {Colors.COLOR_LIGHTBLUE}(Passive)|r",
        0,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Your extra revive chance is increased by {(int)Math.Ceiling(EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE * 100.0f)}%.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Each revive has a VERY small chance to simply revive all dead players.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        Owner = Unit.Owner;
        Utility.SimpleTimer(0.1f, () => UpgradeReviveChance());
    }

    public override void RemoveEffect(unit Unit)
    {
        Owner = null;
    }

    public void BeaconOfUnitedLifeforceEffect(player player)
    {
        // Make sure person has the relic
        if (player != Owner) return;
        var kitty = Globals.ALL_KITTIES[player];
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;

        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));

        var chance = GetRandomReal(0.00f, 1.00f);

        if (chance > ReviveChance) return;

        // Revive all kitties if chance <= EXTRA_REVIVE_CHANCE_ALL, otherwise revive one kitty
        bool reviveAll = chance <= EXTRA_REVIVE_CHANCE_ALL;
        if (upgradeLevel < 2) reviveAll = false;

        var color = Colors.COLOR_YELLOW_ORANGE;
        var msgSent = false;
        foreach (var k in Globals.ALL_KITTIES)
        {
            if (k.Value.Alive) continue;

            k.Value.ReviveKitty(kitty);
            Invulnerability(kitty, k.Value);

            if (!reviveAll) Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(k.Value.Player)}{color} has been extra revived by {Colors.PlayerNameColored(kitty.Player)}!|r");
            if (!reviveAll) break;
            if (!msgSent) Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(kitty.Player)}{color} has extra revived all dead players!|r");
            msgSent = true;
        }
    }

    /// <summary>
    /// Gives the revived kitty invulnerability for a short duration.
    /// </summary>
    /// <param name="beaconHolder"></param>
    /// <param name="extraRevivedKitty"></param>
    private void Invulnerability(Kitty beaconHolder, Kitty extraRevivedKitty)
    {
        extraRevivedKitty.Invulnerable = true;
        Utility.SimpleTimer(INVULNERABILITY_DURATION, () => extraRevivedKitty.Invulnerable = false);
    }

    /// <summary>
    /// Upgrade Level 1: Increases the revive chance of the relic.
    /// </summary>
    private void UpgradeReviveChance()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));
        if (upgradeLevel >= 1) ReviveChance = EXTRA_REVIVE_CHANCE_SINGLE + EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE;
    }



}