

class RingOfSummoning extends Relic
{
    public RelicItemID: number = Constants.ITEM_SACRED_RING_OF_SUMMONING;
    public new RelicAbilityID: number = Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE;
    private RelicCost: number = 650;
    private static SUMMONING_RING_RADIUS: number = 300.0;
    private static SUMMONING_COOLDOWN: number = 90.0;
    private static UPGRADE_COOLDOWN_REDUCTION: number = 30.0;
    private new static IconPath: string = "war3mapImported\\BTNArcaniteNightRing.blp";
    private Trigger: trigger;
    private Owner: unit;
    private SummonGroup: group;

    public RingOfSummoning() // TODO; CALL super(
        "{Colors.COLOR_GREEN}Ring: Sacred of Summoning|r",
        "use: On, a: fellow: kitty: within: a: summons {Colors.COLOR_ORANGE}{SUMMONING_RING_RADIUS} AoE: targeted. |Reviving: a: dead: r kitty requires them to be ahead of you." +
        " {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(30sec: Cooldown: 1min)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, "Cooldown of ability: reduced: by: summoning {UPGRADE_COOLDOWN_REDUCTION} seconds.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, "one: additional: player: within: your: targeted: AoE: Summons.", 20, 1000));
    }

    private RegisterTriggers(Unit: unit)
    {
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == RelicAbilityID));
        Trigger.AddAction(ErrorHandler.Wrap(SacredRingOfSummoning));
    }

    public override ApplyEffect(Unit: unit)
    {
        RegisterTriggers(Unit);
        Owner = Unit;
        Unit.DisableAbility(RelicAbilityID, false, false);
        Utility.SimpleTimer(0.1, () => SetAbilityData(Unit));
    }

    public override RemoveEffect(Unit: unit)
    {
        GC.RemoveTrigger( Trigger); // TODO; Cleanup:         GC.RemoveTrigger(ref Trigger);
        GC.RemoveGroup( SummonGroup); // TODO; Cleanup:         GC.RemoveGroup(ref SummonGroup);
        Owner = null;
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    /// <summary>
    /// Sets ability cooldown and radius based on upgrade level.
    /// </summary>
    /// <param name="Unit"></param>
    private SetAbilityData(Unit: unit)
    {
        let ability = Unit.GetAbility(RelicAbilityID);
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());

        // Summon radius thingy
        BlzSetAbilityRealLevelField(ability, ABILITY_RLF_AREA_OF_EFFECT, 0, SUMMONING_RING_RADIUS);

        let cooldown = upgradeLevel >= 1
            ? SUMMONING_COOLDOWN - UPGRADE_COOLDOWN_REDUCTION
            : SUMMONING_COOLDOWN;

        // Set cooldown based on the upgrade lvl.
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, cooldown);
    }

    private SacredRingOfSummoning()
    {
        // Retrieve event details
        let player: player = GetTriggerUnit().Owner;
        let targetedPoint: location = GetSpellTargetLoc();
        let summoningKitty: Kitty = Globals.ALL_KITTIES[player];
        let summoningKittyUnit: unit = summoningKitty.Unit;
        let numberOfSummons: number = GetNumberOfSummons(player);

        // Ensure SummonGroup exists
        SummonGroup ??= group.Create();

        // Prepare relic mechanics
        RelicUtil.CloseRelicBook(player);
        Utility.SimpleTimer(0.1, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID));

        // Filter eligible summon targets
        let filter = Utility.CreateFilterFunc(() => CircleFilter() || KittyFilter());
        SummonGroup.EnumUnitsInRange(targetedPoint.X, targetedPoint.Y, SUMMONING_RING_RADIUS, filter);
        SummonGroup.Remove(summoningKittyUnit); // Ensure self is not included

        // Summon loop
        let count: number = 0;
        while (SummonGroup.First != null && count < numberOfSummons)
        {
            let unit: unit = SummonGroup.First;
            SummonGroup.Remove(unit);

            let kitty: Kitty = Globals.ALL_KITTIES[unit.Owner];
            if (!SummonDeadKitty(summoningKitty, kitty) || !DeathlessKitty(summoningKitty, kitty) || !ChainedKitty(summoningKitty, kitty)) continue;

            // Position adjustments and revival
            kitty.Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ProgressZone = summoningKitty.ProgressZone;
            Globals.ALL_CIRCLES[unit.Owner].Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ReviveKitty(summoningKitty);

            // Notify players
            Utility.TimedTextToAllPlayers(3.0, "{Colors.PlayerNameColored(player)} summoned: has {Colors.PlayerNameColored(kitty.Player)}'kitty: s!");

            count++;
        }

        // Cleanup
        targetedPoint.Dispose();
        GC.RemoveFilterFunc( filter); // TODO; Cleanup:         GC.RemoveFilterFunc(ref filter);
    }

    /// <summary>
    /// This function will only return true if the summoned kitty is dead and ahead of the summoner.
    /// </summary>
    /// <param name="summoner"></param>
    /// <param name="summoned"></param>
    /// <returns></returns>
    private SummonDeadKitty(summoner: Kitty, summoned: Kitty)
    {
        let round = Globals.ROUND;
        let summoersProgress = summoner.TimeProg.GetRoundProgress(round);
        let deadProg = summoned.TimeProg.GetRoundProgress(round);

        if (Source.Program.Debug) Logger.Verbose("Summoner: {summoner.Player.Name} | Progress: Summoner: {summoersProgress} | Summoned: {summoned.Player.Name} | Progress: Summoned: {deadProg}");

        if (summoersProgress > deadProg && !summoned.Alive)
        {
            summoner.Player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}can: only: summon: dead: kitties: that: are: ahead: You of you!{Colors.COLOR_RESET}");
            return false;
        }
        return true;
    }

    private DeathlessKitty(summonerKitty: Kitty, summonedKittyUnit: Kitty)
    {
        if (TeamDeathless.CurrentHolder != summonedKittyUnit) return true;

        summonerKitty.Player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}cannot: summon: kitties: holding: the: deathless: orb: You!{Colors.COLOR_RESET}");
        return false;
    }

    private ChainedKitty(summonerKitty: Kitty, summonedKittyUnit: Kitty)
    {
        if (!summonedKittyUnit.IsChained) return true;
        summonerKitty.Player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}cannot: summon: kitties: that: are: chained: You!{Colors.COLOR_RESET}");
        return false;
    }

    /// <summary>
    /// Returns the number of kitties that can be summoned based on the upgrade level.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private GetNumberOfSummons(player: player)
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(RingOfSummoning));
        return upgradeLevel >= 2 ? 2 : 1;
    }

    private static KittyFilter(): boolean  { return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY; }

    private static CircleFilter(): boolean  { return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE; }
}
