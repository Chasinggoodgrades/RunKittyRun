using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class FrostbiteRing : Relic
{
    public const int RelicItemID = Constants.ITEM_FROSTBITE_RING;
    public static float SLOW_DURATION = 5.0f;
    public const string FROSTBITE_FREEZE_RING_EFFECT = "war3mapImported\\FreezingBreathTargetArt.mdl";
    public const string FROSTBITE_SLOW_TARGET_EFFECT = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    public new static int RelicAbilityID = Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE;
    public static Dictionary<unit, FrozenWolf> FrozenWolves = new Dictionary<unit, FrozenWolf>();

    private const int RelicCost = 650;
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    private static float DEFAULT_FREEZE_DURATION = 5.0f;
    private float FREEZE_DURATION = 5.0f;
    private new static string IconPath = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";
    private player Owner;
    private trigger Trigger;
    private group FreezeGroup;

    public FrostbiteRing() : base(
        $"{Colors.COLOR_BLUE}Frostbite Ring",
        $"Freezes wolves in place for {Colors.COLOR_CYAN}{(int)DEFAULT_FREEZE_DURATION} seconds|r {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(1 min)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Freeze duration is increased by 1 second per upgrade level.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Wolves that've been frozen will have 50% reduced movespeed for {SLOW_DURATION} seconds after being unfrozen.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        RegisterTriggers(Unit);
        Unit.DisableAbility(RelicAbilityID, false, false);
        Owner = Unit.Owner;
    }

    public override void RemoveEffect(unit Unit)
    {
        GC.RemoveTrigger(ref Trigger);
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    private void FrostbiteCast(location freezeLocation)
    {
        try
        {
            FreezeGroup ??= group.Create();
            FreezeGroup.EnumUnitsInRange(GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, FilterList.DogFilter);

            while (true)
            {
                var unit = FreezeGroup.First;
                if (unit == null) break;
                FreezeGroup.Remove(unit);
                if (Globals.ALL_WOLVES.ContainsKey(unit) && Globals.ALL_WOLVES[unit].IsReviving) continue; // reviving bomber wolves will not be allowed to be frozen.
                FrostbiteEffect(unit);
            }

            RelicUtil.CloseRelicBook(Owner);

            Utility.SimpleTimer(1.0f, () => Owner.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_LAVENDER}{Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount}/{Challenges.FREEZE_AURA_WOLF_REQUIREMENT}|r"));
            Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Globals.ALL_KITTIES[Owner].Unit, RelicItemID, RelicAbilityID));

            freezeLocation.Dispose();
            FreezeGroup.Clear();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FrostbiteRing.FrostbiteCast: {e.Message}");
        }
    }

    private void FrostbiteEffect(unit Unit)
    {
        var duration = GetFreezeDuration();
        Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount += 1; // increment freeze count for freeze_aura reward

        if (FrozenWolves.ContainsKey(Unit))
        {
            FrozenWolves[Unit].BeginFreezeActions(Owner, Unit, duration);
            return;
        }
        else
        {
            var frozenWolf = ObjectPool.GetEmptyObject<FrozenWolf>();
            frozenWolf.BeginFreezeActions(Owner, Unit, duration);
            FrozenWolves[Unit] = frozenWolf;
        }
    }

    private float GetFreezeDuration()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(GetType());
        return DEFAULT_FREEZE_DURATION + upgradeLevel;
    }

    private void RegisterTriggers(unit Unit)
    {
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(ErrorHandler.Wrap(() => FrostbiteCast(@event.SpellTargetLoc)));
    }
}

public class FrozenWolf
{

    public unit Unit { get; set; }
    public AchesTimers Timer { get; set; }
    private effect FreezeEffect { get; set; }
    private player Caster { get; set; }
    private bool Active { get; set; } = false;

    public FrozenWolf()
    {
    }

    public void BeginFreezeActions(player castingPlayer, unit wolfToFreeze, float duration)
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
        catch (Exception e)
        {
            Logger.Warning($"Error in FrozenWolf.BeginFreezeActions: {e.Message}");
            Dispose();
        }
    }

    private void EndingFreezeActions()
    {
        try
        {
            FreezeEffect?.Dispose();
            PausingWolf(Unit, false);
            SlowWolves(Unit);
            Dispose();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FrozenWolf.EndingFreezeActions: {e.Message}");
            Dispose();
        }
    }

    public void Dispose()
    {
        try
        {
            if (Unit != null && FrostbiteRing.FrozenWolves.TryGetValue(Unit, out var frozenWolf))
            {
                FrostbiteRing.FrozenWolves.Remove(Unit);
            }
            Timer.Dispose(); // returns timer object.
            Active = false;
            ObjectPool.ReturnObject(this);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FrozenWolf.Dispose: {e.Message}");
        }
    }


    private void PausingWolf(unit unit, bool pause = true)
    {
        try
        {
            if (unit == null) return;
            if (unit == NamedWolves.StanWolf.Unit) return;
            if (Globals.ALL_WOLVES.ContainsKey(unit))
                Globals.ALL_WOLVES[unit].PauseSelf(pause);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FrozenWolf.PausingWolf: {e.Message}");
        }
    }

    /// <summary>
    /// Upgrade Level 2, Reducing Wolves Movement Speed
    /// </summary>
    /// <param name="Unit"></param>
    private void SlowWolves(unit Unit)
    {
        try
        {
            if (Unit == null) return;
            if (PlayerUpgrades.GetPlayerUpgrades(Caster).GetUpgradeLevel(typeof(FrostbiteRing)) < 2) return;
            Unit.MovementSpeed = 365.0f / 2.0f;
            var effect = AddSpecialEffectTarget(FrostbiteRing.FROSTBITE_SLOW_TARGET_EFFECT, Unit, "origin");
            Utility.SimpleTimer(FrostbiteRing.SLOW_DURATION, () =>
            {
                Unit.MovementSpeed = Unit.DefaultMovementSpeed;
                GC.RemoveEffect(ref effect);
            });
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in FrozenWolf.SlowWolves: {e.Message}");
        }
    }
}
