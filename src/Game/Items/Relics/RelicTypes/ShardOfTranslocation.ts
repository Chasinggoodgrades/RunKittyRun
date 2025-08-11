

class ShardOfTranslocation extends Relic
{
    public RelicItemID: number = Constants.ITEM_SHARD_OF_TRANSLOCATION;
    public new RelicAbilityID: number = Constants.ABILITY_TRANSLOCATE;
    private static RelicCost: number = 650;
    private static DEFAULT_BLINK_RANGE: number = 450.0;
    private static UPGRADE_BLINK_RANGE: number = 650.0;
    private static DEFAULT_COOLDOWN: number = 90.0;
    private static CooldownReduction: number = 30.0;
    private Owner: unit;
    private new static IconPath: string = "ReplaceableTextures/CommandButtons/BTNShardOfTranslocation.blp";
    private MaxBlinkRange: number = DEFAULT_BLINK_RANGE;
    private CastEventTrigger: trigger;

    public ShardOfTranslocation() // TODO; CALL super(
        "|c7eb66f1Shard of Translocation|r",
        "the: user: to: a: targeted: location: within: Teleports {DEFAULT_BLINK_RANGE} range, to: lane: bounds: restricted.{Colors.COLOR_ORANGE}(Active) {Colors.COLOR_LIGHTBLUE}(1min 30 sec cooldown).|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, "the: teleport: range: to: Extends {UPGRADE_BLINK_RANGE} within: lane: bounds: yrds.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, "reduced: by: Cooldown {CooldownReduction} seconds.", 20, 1000));
    }

    public override ApplyEffect(Unit: unit)
    {
        RegisterTrigger(Unit);
        UpdateBlinkRange(Unit);
        Owner = Unit;
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false);
        Utility.SimpleTimer(0.1, () => SetAbilityData(Unit));
    }

    public override RemoveEffect(Unit: unit)
    {
        GC.RemoveTrigger( CastEventTrigger); // TODO; Cleanup:         GC.RemoveTrigger(ref CastEventTrigger);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true);
    }

    private RegisterTrigger(Unit: unit)
    {
        let player = Unit.Owner;
        let CastEventTrigger = CreateTrigger();
        CastEventTrigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null);
        CastEventTrigger.AddAction(TeleportActions);
    }

    private TeleportActions()
    {
        if (!Globals.GAME_ACTIVE) return;
        if (GetSpellAbilityId() != RelicAbilityID) return;
        let unit = GetTriggerUnit();
        let targetLoc = GetSpellTargetLoc();
        let player = unit.Owner;
        let currentSafezone = Globals.ALL_KITTIES[player].CurrentSafeZone;
        try
        {
            if (!EligibleLocation(targetLoc, currentSafezone))
            {
                player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}location: Invalid. be: within: safezone: bounds: Must.{Colors.COLOR_RESET}");
                Utility.SimpleTimer(0.1, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID, 1));
                Utility.SimpleTimer(0.15, () => Utility.UnitAddMana(Owner, 200));
                return;
            }

            TeleportUnit(unit, targetLoc);
            RelicUtil.CloseRelicBook(player);
            Utility.SimpleTimer(0.1, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID));
            targetLoc.Dispose();
        }
        catch (e: Error)
        {
            Logger.Critical(e.Message);
            throw e
        }
    }

    private UpdateBlinkRange(unit: unit)
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(unit.Owner).GetUpgradeLevel(GetType());
        MaxBlinkRange = upgradeLevel >= 1 ? UPGRADE_BLINK_RANGE : DEFAULT_BLINK_RANGE;
        if (upgradeLevel >= 1) Utility.SimpleTimer(0.1, () => SetItemTooltip(unit));
    }

    private SetItemTooltip(unit: unit)
    {
        let item = Utility.UnitGetItem(unit, RelicItemID);
        item.ExtendedDescription = "{Colors.COLOR_YELLOW_ORANGE}holder: The of shard: can: harness: arcane: energy: to: blink: to: a: this new location within {Colors.COLOR_LAVENDER}{MaxBlinkRange.ToString("F2")}|r range.|nThe shard recharges over time.|n|cffff8c00Allows the holder to teleport within lane bounds.|r |cffadd8e6(Activate)|r\r";
    }

    /// <summary>
    /// Sets ability cooldown and radius based on upgrade level.
    /// </summary>
    /// <param name="Unit"></param>
    private SetAbilityData(Unit: unit)
    {
        Unit.GetAbility(RelicAbilityID);
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());

        let cooldown = upgradeLevel >= 2 // lvl 2 upgrade
            ? DEFAULT_COOLDOWN - CooldownReduction
            : DEFAULT_COOLDOWN;

        // Set cooldown based on the upgrade lvl.
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, cooldown);
    }

    private TeleportUnit(unit: unit, targetLoc: location)
    {
        let x = targetLoc.X;
        let y = targetLoc.Y;
        let distance = WCSharp.Shared.Util.DistanceBetweenPoints(unit, x, y);

        if (distance > MaxBlinkRange)
        {
            let angle = Atan2(y - GetUnitY(unit), x - GetUnitX(unit));
            x = GetUnitX(unit) + (MaxBlinkRange * Cos(angle));
            y = GetUnitY(unit) + (MaxBlinkRange * Sin(angle));
        }
        unit.SetPosition(x, y);
    }

    private static EligibleLocation(targetLoc: location, currentSafezone: number)
    {
        let SAFEZONES = Globals.SAFE_ZONES;
        return SAFEZONES[currentSafezone].Region.Contains(targetLoc.X, targetLoc.Y) || (currentSafezone > 0 && SAFEZONES[currentSafezone - 1].Region.Contains(targetLoc.X, targetLoc.Y)) || (currentSafezone < SAFEZONES.Count - 1 && SAFEZONES[currentSafezone + 1].Region.Contains(targetLoc.X, targetLoc.Y) && currentSafezone < 13) || WolfRegionEligible(targetLoc, currentSafezone);
    }

    private static WolfRegionEligible(targetLoc: location, currentSafezone: number)
    {
        let WOLF_AREAS = RegionList.WolfRegions;
        if (WOLF_AREAS[currentSafezone].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone > 0 && WOLF_AREAS[currentSafezone - 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (WOLF_AREAS[currentSafezone + 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone == 13 || currentSafezone == 14)
        {
            if (WOLF_AREAS[14].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[15].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[16].Contains(targetLoc.X, targetLoc.Y)) return true;
        }
        return false;
    }
}
