﻿using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
using WCSharp.Shared.Extensions;
public class FrostbiteRing : Relic
{
    public const int RelicItemID = Constants.ITEM_FROSTBITE_RING;
    public static int RelicAbilityID = Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    private const string FROSTBITE_FREEZE_RING_EFFECT = "war3mapImported\\FreezingBreathTargetArt.mdl";
    private const string FROSTBITE_SLOW_TARGET_EFFECT = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    private static float DEFAULT_FREEZE_DURATION = 5.0f;
    private float FREEZE_DURATION = 5.0f;
    private static float SLOW_DURATION = 5.0f;
    private static new string IconPath = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";
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
        Trigger.Dispose();
        Trigger = null;
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    private void FrostbiteCast(location freezeLocation)
    {
        var tempGroup = group.Create();
        GroupEnumUnitsInRange(tempGroup, GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, Filter(() => WolvesFilter()));
        foreach (var unit in tempGroup.ToList())
            FrostbiteEffect(unit);
        freezeLocation.Dispose();
        freezeLocation = null;
        tempGroup.Dispose();
        tempGroup = null;
        Utility.SimpleTimer(1.0f, () => Owner.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_LAVENDER}{Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount}/{Challenges.FREEZE_AURA_WOLF_REQUIREMENT}|r"));
        RelicUtil.CloseRelicBook(Owner);
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Globals.ALL_KITTIES[Owner].Unit, RelicItemID, RelicAbilityID));
    }

    private void FrostbiteEffect(unit Unit)
    {
        var t = timer.Create();
        Unit.SetPausedEx(true);
        var duration = GetFreezeDuration();
        var effect = AddSpecialEffectTarget(FROSTBITE_FREEZE_RING_EFFECT, Unit, "origin");
        Globals.ALL_KITTIES[Owner].CurrentStats.WolfFreezeCount += 1; // increment freeze count for freeze_aura reward
        var blitzUnit = Blitzer.GetBlitzer(Unit);
        try
        {
            if(blitzUnit != null) blitzUnit.PauseBlitzing(true);
            t.Start(duration, false, () =>
            {
                Unit.SetPausedEx(false);
                if(blitzUnit != null) blitzUnit.PauseBlitzing(false);
                SlowWolves(Unit);
                effect.Dispose();
                t.Dispose();
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
            effect.Dispose();
            t.Dispose();
        });
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
        Trigger.AddAction(() => FrostbiteCast(@event.SpellTargetLoc));
    }

    private static bool WolvesFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;


}