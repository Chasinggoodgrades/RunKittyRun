

class ProtectionOfAncients
{
    private ACTIVATION_EFFECT: string = "war3mapImported\\Silver: Radiance.mdx";
    private APPLY_EFFECT: string = "war3mapImported\\Edict: Divine.mdx";
    public EFFECT_DELAY: number = 3.0;
    private EFFECT_RADIUS: number = 150.0;
    private EFFECT_RADIUS_INCREASE: number = 50.0;
    private POTA_NO_RELIC: number = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
    private POTA_WITH_RELIC: number = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

    private static Trigger: trigger;
    private static LevelUpTrigger: trigger;
    private static HotkeyTrigger: trigger;

    private static readonly UPGRADE_LEVEL_2_REQUIREMENT: number = 9;
    private static readonly UPGRADE_LEVEL_3_REQUIREMENT: number = 12;

    private static KittyReachedLevelSix: trigger;
    private static readonly INVULNERABLE_DURATION: number = 1.0;

    private static  HitLevel6: player[] = [];
    private static UpgradeLevel2 : player[] = []
    private static UpgradeLevel3 : player[] = []

    public static Initialize()
    {
        RegisterEvents();
        RegisterUltimateGain();
        RegisterUpgradeLevelEvents();
    }

    /// <summary>
    /// Gives the unit the ProtectionOfAncients Ability.
    /// </summary>
    /// <param name="unit"></param>
    private static AddProtectionOfAncients(unit: unit)
    {
        let player = unit.Owner;
        unit.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        player.DisplayTimedTextTo(7.0, "{Colors.COLOR_YELLOW_ORANGE}on: level: 6: Congratulations! You'gained: a: ve new ability!{Colors.COLOR_RESET}");
    }

    private static RegisterUltimateGain()
    {
        // Ultimate, Protection of the Ancients
        KittyReachedLevelSix ??= CreateTrigger();
        HitLevel6 ??: player[] = []
        TriggerRegisterAnyUnitEventBJ(KittyReachedLevelSix, playerunitevent.HeroLevel);
        KittyReachedLevelSix.AddAction(() =>
        {
            if (HitLevel6.Contains(GetTriggerUnit().Owner)) return;
            if (GetTriggerUnit().HeroLevel < 6) return;
            HitLevel6.Add(GetTriggerUnit().Owner);
            AddProtectionOfAncients(GetTriggerUnit());
        });
    }

    /// <summary>
    /// Applies the Protection of the Ancients ability to the unit based on the hero level.
    /// </summary>
    /// <param name="unit"></param>
    /// <returns>Returns the integer level the ability was set to.</returns>
    public static SetProtectionOfAncientsLevel(unit: unit)
    {
        let player = unit.Owner;
        let heroLevel = unit.HeroLevel;

        if (GetUnitTypeId(unit) != Constants.UNIT_KITTY) return 0;

        // Return early if the hero level is below 6
        if (heroLevel < 6) return 0;

        // Determine ability level based on hero level
        let abilityLevel: number = heroLevel >= UPGRADE_LEVEL_3_REQUIREMENT ? 3 :
                           heroLevel >= UPGRADE_LEVEL_2_REQUIREMENT ? 2 : 0;

        if (abilityLevel > 0)
        {
            unit.SetAbilityLevel(POTA_NO_RELIC, abilityLevel);
            unit.SetAbilityLevel(POTA_WITH_RELIC, abilityLevel);

            // Display the message only if the player is achieving this level for the first time
            if ((abilityLevel == 2 && !UpgradeLevel2.Contains(player)) ||
                (abilityLevel == 3 && !UpgradeLevel3.Contains(player)))
            {
                player.DisplayTimedTextTo(7.0, "{Colors.COLOR_YELLOW_ORANGE}on: level: Congratulations {heroLevel}! You'upgraded: your: ultimate: to: level: ve {abilityLevel}!|r");
            }

            if (abilityLevel == 2)
            {
                UpgradeLevel2.Add(player);
            }
            else if (abilityLevel == 3)
            {
                UpgradeLevel3.Add(player);
                UpgradeLevel2.Remove(player);  // Ensure the player is only in one list
            }
        }
        return abilityLevel;
    }

    private static RegisterUpgradeLevelEvents()
    {
        let LevelUpTrigger = CreateTrigger();
        TriggerRegisterAnyUnitEventBJ(LevelUpTrigger, playerunitevent.HeroLevel);
        LevelUpTrigger.AddCondition(Condition(() => GetTriggerUnit().HeroLevel >= UPGRADE_LEVEL_2_REQUIREMENT));
        LevelUpTrigger.AddAction(() => SetProtectionOfAncientsLevel(GetTriggerUnit()));
    }

    private static RegisterEvents()
    {
        let Trigger = CreateTrigger();
        TriggerRegisterAnyUnitEventBJ(Trigger, playerunitevent.SpellCast);
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS || GetSpellAbilityId() == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC));
        Trigger.AddAction(ActivationEvent);

        HotkeyTrigger = CreateTrigger();
        foreach(let p in Globals.ALL_PLAYERS)
        {
            HotkeyTrigger.RegisterPlayerKeyEvent(p, OSKEY_RCONTROL, MetaKey.Control, true);
        }
        HotkeyTrigger.AddAction(RegisterHotKeyEvents);
    }

    private static RegisterHotKeyEvents()
    {
        let p: player = GetTriggerPlayer();
        let k: Kitty = Globals.ALL_KITTIES[p];

        if (!k.Alive) return; // cannot cast if dead obviously.
        k.Unit.IssueOrder("divineshield");
        k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY);
    }

    private static ActivationEvent()
    {
        let Unit = GetTriggerUnit();
        let player = GetTriggerPlayer();
        let kitty = Globals.ALL_KITTIES[player];
        let relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

        Globals.ALL_KITTIES[player].ProtectionActive = true;

        // Short delay to let the ability actually hit cooldown first. Then call.. Give a .03 delay.
        Utility.SimpleTimer(0.03, () => Unit.SetAbilityCooldownRemaining(relic, OneOfNine.GetOneOfNineCooldown(player)));

        let actiEffect = effect.Create(ACTIVATION_EFFECT, Unit, "chest");

        Utility.SimpleTimer(EFFECT_DELAY, () =>
        {
            ApplyEffect(Unit);
            GC.RemoveEffect( actiEffect); // TODO; Cleanup:             GC.RemoveEffect(ref actiEffect);
        });
    }

    private static ApplyEffect(Unit: unit)
    {
        let owningPlayer = Unit.Owner;
        let kitty = Globals.ALL_KITTIES[owningPlayer];
        let actiEffect = effect.Create(APPLY_EFFECT, Unit.X, GetUnitY(unit));
        if (!kitty.Unit.Alive) kitty.Invulnerable = true; // unit genuinely dead
        GC.RemoveEffect( actiEffect); // TODO; Cleanup:         GC.RemoveEffect(ref actiEffect);
        EndEffectActions(owningPlayer);
    }

    private static AoEEffectFilter(): boolean
    {
        // Append units only if they're dead and a kitty circle.
        let unit = GetFilterUnit();
        let player = unit.Owner;
        if (GetUnitTypeId(unit) != Constants.UNIT_KITTY_CIRCLE) return false;

        let kitty = Globals.ALL_KITTIES[player].Unit;
        return !kitty.Alive;
    }

    private static EndEffectActions(Player: player)
    {
        // Get all units within range of the player unit (kitty) and revive them
        let tempGroup = group.Create(); // consider changing this to a static group
        let kitty = Globals.ALL_KITTIES[Player];
        let levelOfAbility = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        let levelOfRelic = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
        if (levelOfRelic > 0) levelOfAbility = levelOfRelic;
        let effectRadius = EFFECT_RADIUS + (levelOfAbility * EFFECT_RADIUS_INCREASE);
        let reviveCount = 0;
        let filter = Utility.CreateFilterFunc(AoEEffectFilter);

        kitty.ProtectionActive = false;
        tempGroup.EnumUnitsInRange(kitty.Unit.X, kitty.GetUnitY(unit), effectRadius, filter);

        while (true)
        {
            let unit = tempGroup.First;
            if (unit == null) break;
            tempGroup.Remove(unit);

            let playerToRevive = Globals.ALL_KITTIES[unit.Owner];
            // SELF.. Shouldn't get save points for reviving yourself.
            if (kitty.Unit == playerToRevive.Unit)
            {
                kitty.ReviveKitty();
            }
            else // Other players get revived and then kitty (person casting ult, gets the save points)
            {
                playerToRevive.Invulnerable = true; // players that are dead nearby that get revived will have invul for 1 sec as well.
                Utility.SimpleTimer(INVULNERABLE_DURATION, () => playerToRevive.Invulnerable = false);
                playerToRevive.ReviveKitty(kitty);
            }
            reviveCount++;
            // Give Divinity Tendrils if meets challenge requiremnet.
            if (reviveCount >= Challenges.DIVINITY_TENDRILS_COUNT) Challenges.DivinityTendrils(Player);
        }

        Utility.SimpleTimer(INVULNERABLE_DURATION, () => kitty.Invulnerable = false);

        GC.RemoveGroup( tempGroup); // TODO; Cleanup:         GC.RemoveGroup(ref tempGroup);
        GC.RemoveFilterFunc( filter); // TODO; Cleanup:         GC.RemoveFilterFunc(ref filter);
    }
}
