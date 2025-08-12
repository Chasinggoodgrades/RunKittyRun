

class FrostbiteRing extends Relic
{
    public RelicItemID: number = Constants.ITEM_FROSTBITE_RING;
    public static SLOW_DURATION: number = 5.0;
    public FROSTBITE_FREEZE_RING_EFFECT: string = "war3mapImported\\FreezingBreathTargetArt.mdl";
    public FROSTBITE_SLOW_TARGET_EFFECT: string = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    public static RelicAbilityID: number = Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE;
    public static  FrozenWolves : {[x: unit]: FrozenWolf} = {}

    private RelicCost: number = 650;
    private static FROSTBITE_RING_RADIUS: number = 450.0;
    private static DEFAULT_FREEZE_DURATION: number = 5.0;
    private static UPGRADE_COOLDOWN_REDUCTION: number = 15.0;
    private FREEZE_DURATION: number = 5.0;
    private static IconPath: string = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";
    private Owner: player;
    private Trigger: trigger;
    private FreezeGroup: group;

    public FrostbiteRing() // TODO; CALL super(
        "{Colors.COLOR_BLUE}Ring: Frostbite",
        "wolves: Freezes in for: place {Colors.COLOR_CYAN}{DEFAULT_FREEZE_DURATION} seconds|r {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(min: 1)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.push(new RelicUpgrade(0, "duration: Freeze is by: 1: second: per: upgrade: level: increased.", 15, 800));
        Upgrades.push(new RelicUpgrade(1, "that: Wolves'been: frozen: will: have: 50: ve% movespeed: for: reduced {SLOW_DURATION} after: being: seconds unfrozen.", 20, 1000));
        Upgrades.push(new RelicUpgrade(2, "Cooldown is by: reduced {UPGRADE_COOLDOWN_REDUCTION} seconds.", 20, 1200));
    }

    public override ApplyEffect(Unit: unit)
    {
        this.RegisterTriggers(Unit);
        Unit.DisableAbility(RelicAbilityID, false, false);
        Owner = Unit.Owner;
        SetAbilityCooldown(Unit);
    }

    public override RemoveEffect(Unit: unit)
    {
        GC.RemoveTrigger( Trigger); // TODO; Cleanup:         GC.RemoveTrigger(ref Trigger);
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    private FrostbiteCast(freezeLocation: location)
    {
        try
        {
            FreezeGroup ??= CreateGroup();
            FreezeGroup.EnumUnitsInRange(GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, FilterList.DogFilter);

            while (true)
            {
                let unit = FreezeGroup.First;
                if (unit == null) break;
                FreezeGroup.Remove(unit);
                if (Globals.ALL_WOLVES.ContainsKey(unit) && Globals.ALL_WOLVES[unit].IsReviving) continue; // reviving bomber wolves will not be allowed to be frozen.)
                if (Globals.ALL_WOLVES[unit].HasAffix("Frostbite")) continue;
                FrostbiteEffect(unit);
            }

            RelicUtil.CloseRelicBook(Owner);

            Utility.SimpleTimer(1.0, () => Owner.DisplayTimedTextTo(4.0, "{Colors.COLOR_LAVENDER}{Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount}/{Challenges.FREEZE_AURA_WOLF_REQUIREMENT}|r"));
            Utility.SimpleTimer(0.1, () => RelicUtil.SetRelicCooldowns(Globals.ALL_KITTIES[Owner].Unit, RelicItemID, RelicAbilityID));

            freezeLocation.Dispose();
            FreezeGroup.Clear();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrostbiteRing.FrostbiteCast: {e.Message}");
        }
    }

    private FrostbiteEffect(Unit: unit)
    {
        let duration = GetFreezeDuration();
        Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount += 1; // increment freeze count for freeze_aura reward

        if (FrozenWolves.ContainsKey(Unit))
        {
            FrozenWolves[Unit].BeginFreezeActions(Owner, Unit, duration);
            return;
        }
        else
        {
            let frozenWolf = ObjectPool.GetEmptyObject<FrozenWolf>();
            frozenWolf.BeginFreezeActions(Owner, Unit, duration);
            FrozenWolves[Unit] = frozenWolf;
        }
    }

    private SetAbilityCooldown(Unit: unit)
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        let currentCooldown = BlzGetAbilityCooldown(RelicAbilityID, 0);
        let newCooldown = upgradeLevel >= 3
            ? currentCooldown - UPGRADE_COOLDOWN_REDUCTION
            : currentCooldown;

        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, newCooldown);
    }

    private GetFreezeDuration(): number
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(GetType());
        return DEFAULT_FREEZE_DURATION + upgradeLevel;
    }

    private RegisterTriggers(Unit: unit)
    {
        let Trigger = CreateTrigger();
        TriggerRegisterUnitEvent(Trigger, Unit, unitevent.SpellEffect);;
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == RelicAbilityID));
        Trigger.AddAction(ErrorHandler.Wrap(() => FrostbiteCast(GetSpellTargetLoc())));
    }
}

class FrozenWolf
{
    public Unit: unit 
    public Timer: AchesTimers 
    private FreezeEffect: effect 
    private Caster: player 
    private Active: boolean = false;

    public FrozenWolf()
    {
    }

    public BeginFreezeActions(castingPlayer: player, wolfToFreeze: unit, duration: number)
    {
        try
        {
            if (!Active) Timer = ObjectPool.GetEmptyObject<AchesTimers>();
            Unit = wolfToFreeze;
            FreezeEffect ??= AddSpecialEffectTarget(FrostbiteRing.FROSTBITE_FREEZE_RING_EFFECT, Unit, "origin");
            Caster = castingPlayer;

            PausingWolf(Unit);

            Timer.Timer.Start(duration, false, EndingFreezeActions);
            Active = true;
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrozenWolf.BeginFreezeActions: {e.Message}");
            Dispose();
        }
    }

    private EndingFreezeActions()
    {
        try
        {
            FreezeEffect?.Dispose();
            FreezeEffect = null;
            PausingWolf(Unit, false);
            SlowWolves(Unit);
            Dispose();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrozenWolf.EndingFreezeActions: {e.Message}");
            Dispose();
        }
    }

    public Dispose()
    {
        try
        {
            if (Unit != null && frozenWolf = FrostbiteRing.FrozenWolves.TryGetValue(Unit) /* TODO; Prepend: let */)
            {
                FrostbiteRing.FrozenWolves.Remove(Unit);
            }
            Timer.Dispose();
            Active = false;
            ObjectPool<FrozenWolf>.ReturnObject(this);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrozenWolf.Dispose: {e.Message}");
        }
    }

    private PausingWolf(unit: unit, pause: boolean = true)
    {
        try
        {
            if (unit == null) return;
            if (NamedWolves.StanWolf != null && unit == NamedWolves.StanWolf.Unit) return;
            if (Globals.ALL_WOLVES.ContainsKey(unit))
                Globals.ALL_WOLVES[unit].PauseSelf(pause);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrozenWolf.PausingWolf: {e.Message}");
        }
    }

    /// <summary>
    /// Upgrade Level 2, Reducing Wolves Movement Speed
    /// </summary>
    /// <param name="Unit"></param>
    private SlowWolves(Unit: unit)
    {
        try
        {
            if (Unit == null) return;
            if (PlayerUpgrades.GetPlayerUpgrades(Caster).GetUpgradeLevel(typeof(FrostbiteRing)) < 2) return;
            Unit.MovementSpeed = 365.0 / 2.0;
            let effect = AddSpecialEffectTarget(FrostbiteRing.FROSTBITE_SLOW_TARGET_EFFECT, Unit, "origin");
            Utility.SimpleTimer(FrostbiteRing.SLOW_DURATION, () =>
            {
                Unit.MovementSpeed = Unit.DefaultMovementSpeed;
                GC.RemoveEffect( effect); // TODO; Cleanup:                 GC.RemoveEffect(ref effect);
            });
        }
        catch (e: Error)
        {
            Logger.Warning("Error in FrozenWolf.SlowWolves: {e.Message}");
        }
    }
}
