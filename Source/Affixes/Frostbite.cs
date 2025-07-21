using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Frostbite : Affix
{
    private const float FROSTBITE_RADIUS = 500.0f;
    private const float FROSTBITE_SPEED_REDUCTION = 0.83f;
    private const int AFFIX_ABILITY = Constants.ABILITY_FROSTBITE;
    private static int ADRENALINE_POTION_ABILITY = FourCC("Bspe");
    private const string FROSTBITE_TARGET_EFFECT = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    private trigger InRangeTrigger;
    private trigger PeriodicRangeTrigger;
    private List<Frostbitten> FrostbittenKitties = new List<Frostbitten>();

    public Frostbite(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_LIGHTBLUE}Frostbite|r";
        InRangeTrigger ??= trigger.Create();
        PeriodicRangeTrigger ??= trigger.Create();
    }

    public override void Apply()
    {
        Unit.Unit.SetVertexColor(80, 140, 250);
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        RegisterEvents();
        base.Apply();
    }

    public override void Remove()
    {
        try
        {
            Unit.Unit.SetVertexColor(150, 120, 255);
            Unit.Unit.RemoveAbility(AFFIX_ABILITY);
            GC.RemoveTrigger(ref InRangeTrigger);
            GC.RemoveTrigger(ref PeriodicRangeTrigger);
            RemoveAllEffects();
            GC.RemoveList(ref FrostbittenKitties);
            base.Remove();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Frostbite.Remove: {e.Message}");
            throw;
        }
    }

    private void RemoveAllEffects()
    {
        if (FrostbittenKitties == null || FrostbittenKitties.Count == 0) return;
        try
        {
            for (int i = 0; i < FrostbittenKitties.Count; i++)
            {
                var frostbitten = FrostbittenKitties[i];
                frostbitten.Dispose();
            }
            FrostbittenKitties.Clear();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Frostbite.RemoveAllEffects: {e.Message}");
            throw;
        }
    }

    private void RegisterEvents()
    {
        PeriodicRangeTrigger.RegisterTimerEvent(0.3f, true);
        PeriodicRangeTrigger.AddAction(PeriodicRangeCheck);
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FROSTBITE_RADIUS, FilterList.KittyFilter);
        InRangeTrigger.AddAction(() =>
        {
            var target = @event.Unit;
            if (!target.Alive) return; // must be alive
            if (!RegionList.WolfRegions[Unit.RegionIndex].Contains(target.X, target.Y)) return; // must be in same lane
            SlowEffect(target);
        });
    }

    private void PeriodicRangeCheck()
    {
        if (FrostbittenKitties == null || FrostbittenKitties.Count == 0) return;
        try
        {
            for (int i = FrostbittenKitties.Count - 1; i >= 0; i--) // if go backwards, can avoid loop index issues
            {
                var frostbitten = FrostbittenKitties[i];

                if (frostbitten.Kitty.Unit.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue;

                frostbitten.Dispose();
                FrostbittenKitties.RemoveAt(i);
            }

        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Frostbite.PeriodicRangeCheck: {e.Message}");
        }
    }

    private void SlowEffect(unit target)
    {
        if (target.GetAbilityLevel(ADRENALINE_POTION_ABILITY) > 0) return; // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return; // Frostbite ring
        Kitty k = Globals.ALL_KITTIES[target.Owner];
        if (k.KittyMiscInfo.FrostBitten != null) return; // already bitten.
        Frostbitten frostBittenObject = k.KittyMiscInfo.FrostBitten = ObjectPool<Frostbitten>.GetEmptyObject();
        frostBittenObject.OriginalSpeed = target.DefaultMovementSpeed;
        frostBittenObject.Effect = effect.Create(FROSTBITE_TARGET_EFFECT, target, "chest");
        frostBittenObject.Kitty = k;
        target.MovementSpeed = target.DefaultMovementSpeed * FROSTBITE_SPEED_REDUCTION;
        FrostbittenKitties.Add(frostBittenObject);
    }

    public override void Pause(bool pause)
    {
        // no logic needed atm.
    }

}

public class Frostbitten : IDisposable
{
    public effect Effect { get; set; }
    public float OriginalSpeed { get; set; }
    public Kitty Kitty { get; set; }

    public Frostbitten()
    {
        Effect = null;
        OriginalSpeed = 0.0f;
    }

    public void Dispose()
    {
        Kitty.Unit.MovementSpeed = OriginalSpeed != 0f ? OriginalSpeed : Kitty.Unit.DefaultMovementSpeed;
        Effect?.Dispose();
        Effect = null;
        OriginalSpeed = 0.0f;
        Kitty.KittyMiscInfo.FrostBitten = null;
        ObjectPool<Frostbitten>.ReturnObject(this);
    }

}
