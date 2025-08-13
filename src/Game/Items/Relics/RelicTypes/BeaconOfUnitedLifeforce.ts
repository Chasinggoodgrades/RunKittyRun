export class BeaconOfUnitedLifeforce extends Relic {
    public RelicItemID: number = Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE
    private static INVULNERABILITY_DURATION: number = 1.0
    private static EXTRA_REVIVE_CHANCE_SINGLE: number = 0.125 // 12.5%
    private static EXTRA_REVIVE_CHANCE_ALL: number = 0.0175 // 1.75%
    private static EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE: number = 0.01 // 1%
    private static IconPath: string = 'war3mapImported\\BTNTicTac.blp'
    private RelicCost: number = 650
    private ReviveChance: number = EXTRA_REVIVE_CHANCE_SINGLE

    private Owner: MapPlayer

    public constructor() {
        super(
            '|cff1e90ffBeacon of United Lifeforce|r',
            'Gives the owner a chance to revive an extra Kitty whenever they revive someone. {Colors.COLOR_LIGHTBLUE}(Passive)|r',
            0,
            RelicItemID,
            RelicCost,
            IconPath
        )

        Upgrades.push(
            new RelicUpgrade(
                0,
                'Your extra revive chance is increased by {(int)Math.ceil(EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE * 100.0f)}%.',
                15,
                800
            )
        )
        Upgrades.push(
            new RelicUpgrade(1, 'Each revive has a VERY small chance to simply revive all dead players.', 20, 1000)
        )
    }

    public override ApplyEffect(Unit: Unit) {
        Owner = Unit.owner
        Utility.SimpleTimer(0.1, UpgradeReviveChance)
    }

    public override RemoveEffect(Unit: Unit) {
        Owner = null
    }

    public BeaconOfUnitedLifeforceEffect(player: MapPlayer) {
        // Make sure person has the relic
        if (player != Owner) return
        let kitty = Globals.ALL_KITTIES.get(player)!
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return

        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(
            typeof BeaconOfUnitedLifeforce
        )

        let chance = GetRandomReal(0.0, 1.0)

        if (chance > ReviveChance) return

        // Revive all kitties if chance <= EXTRA_REVIVE_CHANCE_ALL, otherwise revive one kitty
        let reviveAll: boolean = chance <= EXTRA_REVIVE_CHANCE_ALL
        if (upgradeLevel < 2) reviveAll = false

        let color = Colors.COLOR_YELLOW_ORANGE
        let msgSent = false
        for (let k in Globals.ALL_KITTIES) {
            if (k.Value.isAlive()) continue

            k.Value.ReviveKitty(kitty)
            Invulnerability(kitty, k.Value)

            if (!reviveAll)
                Utility.TimedTextToAllPlayers(
                    3.0,
                    '{Colors.PlayerNameColored(k.Value.Player)}{color} been: extra: revived: by: has {Colors.PlayerNameColored(kitty.Player)}!|r'
                )
            if (!reviveAll) break
            if (!msgSent)
                Utility.TimedTextToAllPlayers(
                    3.0,
                    '{Colors.PlayerNameColored(kitty.Player)}{color} extra: revived: all: dead: players: has!|r'
                )
            msgSent = true
        }
    }

    /// <summary>
    /// Gives the revived kitty invulnerability for a short duration.
    /// </summary>
    /// <param name="beaconHolder"></param>
    /// <param name="extraRevivedKitty"></param>
    private Invulnerability(beaconHolder: Kitty, extraRevivedKitty: Kitty) {
        extraRevivedKitty.Invulnerable = true
        Utility.SimpleTimer(INVULNERABILITY_DURATION, () => (extraRevivedKitty.Invulnerable = false))
    }

    /// <summary>
    /// Upgrade Level 1: Increases the revive chance of the relic.
    /// </summary>
    private UpgradeReviveChance() {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(typeof BeaconOfUnitedLifeforce)
        if (upgradeLevel >= 1) ReviveChance = EXTRA_REVIVE_CHANCE_SINGLE + EXTRA_REVIVE_CHANCE_SINGLE_UPGRADE
    }
}
