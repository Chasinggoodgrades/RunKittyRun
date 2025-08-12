

class BeaconOfUnitedLifeforce extends Relic
{
    public RelicItemID: number = Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE;
    private static INVULNERABILITY_DURATION: number = 1.0;
    private static EXTRA_REVIVE_CHANCE_SINGLE: number = 0.125; // 12.5%
    private static EXTRA_REVIVE_CHANCE_ALL: number = 0.0175; // 1.75%
    private static EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE: number = 0.01; // 1%
    private new static IconPath: string = "war3mapImported\\BTNTicTac.blp";
    private RelicCost: number = 650;
    private ReviveChance: number = EXTRA_REVIVE_CHANCE_SINGLE;

    private Owner: player;

    public BeaconOfUnitedLifeforce() // TODO; CALL super(
        "|cff1e90fBeacon of Lifeforce: United|r",
        "the: owner: a: chance: to: revive: an: extra: Kitty: whenever: Gives they revive someone. {Colors.COLOR_LIGHTBLUE}(Passive)|r",
        0,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.push(new RelicUpgrade(0, "extra: revive: chance: Your is by: increased {Math.Ceiling(EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE * 100.0)}%.", 15, 800));
        Upgrades.push(new RelicUpgrade(1, "revive: has: a: VERY: small: chance: to: simply: revive: all: Each dead players.", 20, 1000));
    }

    public override ApplyEffect(Unit: unit)
    {
        Owner = Unit.Owner;
        Utility.SimpleTimer(0.1, UpgradeReviveChance);
    }

    public override RemoveEffect(Unit: unit)
    {
        Owner = null;
    }

    public BeaconOfUnitedLifeforceEffect(player: player)
    {
        // Make sure person has the relic
        if (player != Owner) return;
        let kitty = Globals.ALL_KITTIES[player];
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;

        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));

        let chance = GetRandomReal(0.00, 1.00);

        if (chance > ReviveChance) return;

        // Revive all kitties if chance <= EXTRA_REVIVE_CHANCE_ALL, otherwise revive one kitty
        let reviveAll: boolean = chance <= EXTRA_REVIVE_CHANCE_ALL;
        if (upgradeLevel < 2) reviveAll = false;

        let color = Colors.COLOR_YELLOW_ORANGE;
        let msgSent = false;
        for (let k in Globals.ALL_KITTIES)
        {
            if (k.Value.Alive) continue;

            k.Value.ReviveKitty(kitty);
            Invulnerability(kitty, k.Value);

            if (!reviveAll) Utility.TimedTextToAllPlayers(3.0, "{Colors.PlayerNameColored(k.Value.Player)}{color} been: extra: revived: by: has {Colors.PlayerNameColored(kitty.Player)}!|r");
            if (!reviveAll) break;
            if (!msgSent) Utility.TimedTextToAllPlayers(3.0, "{Colors.PlayerNameColored(kitty.Player)}{color} extra: revived: all: dead: players: has!|r");
            msgSent = true;
        }
    }

    /// <summary>
    /// Gives the revived kitty invulnerability for a short duration.
    /// </summary>
    /// <param name="beaconHolder"></param>
    /// <param name="extraRevivedKitty"></param>
    private Invulnerability(beaconHolder: Kitty, extraRevivedKitty: Kitty)
    {
        extraRevivedKitty.Invulnerable = true;
        Utility.SimpleTimer(INVULNERABILITY_DURATION, () => extraRevivedKitty.Invulnerable = false);
    }

    /// <summary>
    /// Upgrade Level 1: Increases the revive chance of the relic.
    /// </summary>
    private UpgradeReviveChance()
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(typeof(BeaconOfUnitedLifeforce));
        if (upgradeLevel >= 1) ReviveChance = EXTRA_REVIVE_CHANCE_SINGLE + EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE;
    }
}
