using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class FrostbiteRing : Relic
{
    public const int RelicItemID = Constants.ITEM_FROSTBITE_RING;
    public new static int RelicAbilityID = Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    private const string FROSTBITE_FREEZE_RING_EFFECT = "war3mapImported\\FreezingBreathTargetArt.mdl";
    private const string FROSTBITE_SLOW_TARGET_EFFECT = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    private static float DEFAULT_FREEZE_DURATION = 5.0f;
    private float FREEZE_DURATION = 5.0f;
    private static float SLOW_DURATION = 5.0f;
    private new static string IconPath = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";
    private player Owner;
    private trigger Trigger;

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
            var tempGroup = group.Create();
            var filter = Utility.CreateFilterFunc(() => WolvesFilter());
            tempGroup.EnumUnitsInRange(GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, filter);
            var list = tempGroup.ToList();
            foreach (var unit in list)
                FrostbiteEffect(unit);
            GC.RemoveList(ref list);
            GC.RemoveGroup(ref tempGroup);
            GC.RemoveFilterFunc(ref filter);
            Utility.SimpleTimer(1.0f, () => Owner.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_LAVENDER}{Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount}/{Challenges.FREEZE_AURA_WOLF_REQUIREMENT}|r"));
            RelicUtil.CloseRelicBook(Owner);
            Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Globals.ALL_KITTIES[Owner].Unit, RelicItemID, RelicAbilityID));
            freezeLocation.Dispose();
        }
        catch (Exception e)
        {
            Logger.Critical(e.Message);
        }
    }

    private void FrostbiteEffect(unit Unit)
    {
        var t = timer.Create();
        var duration = GetFreezeDuration();
        var effect = AddSpecialEffectTarget(FROSTBITE_FREEZE_RING_EFFECT, Unit, "origin");
        Unit.ClearOrders();
        PausingWolf(Unit, true);
        Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount += 1; // increment freeze count for freeze_aura reward
        var blitzUnit = Blitzer.GetBlitzer(Unit);
        var fixationUnit = Fixation.GetFixation(Unit);
        try
        {
            blitzUnit?.PauseBlitzing(true);
            fixationUnit?.PauseFixation(true);
            t.Start(duration, false, () =>
            {
                PausingWolf(Unit, false);
                blitzUnit?.PauseBlitzing(false);
                fixationUnit?.PauseFixation(false);
                SlowWolves(Unit);
                GC.RemoveEffect(ref effect);
                GC.RemoveTimer(ref t);
            });
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
        }
    }

    /// <summary>
    /// Upgrade Level 2, Reducing Wolves Movement Speed
    /// </summary>
    /// <param name="Unit"></param>
    private void SlowWolves(unit Unit)
    {
        if (PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(GetType()) < 2) return;
        Unit.BaseMovementSpeed = 365.0f / 2.0f;
        var t = timer.Create();
        var effect = AddSpecialEffectTarget(FROSTBITE_SLOW_TARGET_EFFECT, Unit, "origin");
        t.Start(SLOW_DURATION, false, () =>
        {
            Unit.BaseMovementSpeed = 365.0f;
            GC.RemoveEffect(ref effect);
            GC.RemoveTimer(ref t);
        });
    }

    private float GetFreezeDuration()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Owner).GetUpgradeLevel(GetType());
        return DEFAULT_FREEZE_DURATION + upgradeLevel;
    }

    private void PausingWolf(unit unit, bool pause = true)
    {
        if (unit == null) return;
        var wolf = Globals.ALL_WOLVES[unit];
        Globals.ALL_WOLVES[unit].PauseSelf(pause);
    }

    private void RegisterTriggers(unit Unit)
    {
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(() => FrostbiteCast(@event.SpellTargetLoc));
    }

    private static bool WolvesFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;
}
