

class OneOfNine extends Relic
{
    public RelicItemID: number = Constants.ITEM_ONE_OF_NINE;
    public new RelicAbilityID: number = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

    private PreviousAbilityID: number = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
    private RelicCost: number = 650;
    private new static IconPath: string = "war3mapImported\\BTNSpell_Holy_BlessingOfProtection.blp";

    public OneOfNine() // TODO; CALL super(
        "|cffff4500One of Nine|r",
        "Protection: Autocasts of Ancients: if: it: the is available. {Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, "Cooldown of ultimate: your is by: an: additional: 3: seconds: per: upgrade: level: reduced.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, "ultimate: no: longer: costs: mana: Your.", 20, 1000));
    }

    public override ApplyEffect(Unit: unit)
    {
        let player: player = Unit.Owner;
        let cooldown: number = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(PreviousAbilityID);
        Unit.AddAbility(RelicAbilityID);
        let abilityLevel: number = ProtectionOfAncients.SetProtectionOfAncientsLevel(Unit);
        Unit.SetAbilityCooldownRemaining(RelicAbilityID, cooldown);
        RemoveManaCost(Unit, abilityLevel);
    }

    public override RemoveEffect(Unit: unit)
    {
        let player: player = Unit.Owner;
        let cooldown: number = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(RelicAbilityID);
        Unit.AddAbility(PreviousAbilityID);
        ProtectionOfAncients.SetProtectionOfAncientsLevel(Unit);
        Unit.SetAbilityCooldownRemaining(PreviousAbilityID, cooldown);
    }

    public static GetOneOfNineCooldown(Player: player)
    {
        let kitty: unit = Globals.ALL_KITTIES[Player].Unit;
        let noRelic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
        let relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
        let reduction = GetOneOfNineReduction(Player);

        // remaining cooldown depending on relic or no relic
        let cooldown: number = kitty.GetAbilityCooldownRemaining(noRelic) > 0.0
            ? kitty.GetAbilityCooldownRemaining(noRelic)
            : kitty.GetAbilityCooldownRemaining(relic);

        cooldown -= reduction;

        return Math.Max(0.0, cooldown); // gotta make sure its not negative
    }

    public static GetOneOfNineReduction(Player: player)
    {
        return PlayerUpgrades.GetPlayerUpgrades(Player).GetUpgradeLevel(typeof(OneOfNine)) * 3.0;
    }

    /// <summary>
    /// Upgrade Level 2: Removes mana cost from the ability.
    /// </summary>
    /// <param name="Unit"></param>
    /// <param name="abilityLevel"></param>
    private RemoveManaCost(Unit: unit, abilityLevel: number)
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        if (upgradeLevel < 2) return;
        Unit.GetAbility(RelicAbilityID);
        Unit.SetAbilityManaCost(RelicAbilityID, abilityLevel - 1, 0);
    }

    public static OneOfNineEffect(kitty: Kitty)
    {
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_ONE_OF_NINE)) return false;
        if (kitty.Unit.GetAbilityCooldownRemaining(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC) <= 0.0)
        {
            IssueImmediateOrder(kitty.Unit, "divineshield");
            return true;
        }
        return false;
    }
}
