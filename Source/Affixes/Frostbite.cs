using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class Frostbite : Affix
{
    private const float FROSTBITE_RADIUS = 500.0f;
    private const float FROSTBITE_SPEED_REDUCTION = 0.83f;
    private const int AFFIX_ABILITY = Constants.ABILITY_FROSTBITE;
    private const string FROSTBITE_TARGET_EFFECT = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    private trigger InRangeTrigger;
    private trigger PeriodicRangeTrigger;
    private Dictionary<unit, float> Frostbitten;
    private Dictionary<unit, effect> Effects;
    private List<unit> TempList = new List<unit>();

    public Frostbite(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_LIGHTBLUE}Frostbite|r";
        InRangeTrigger = trigger.Create();
        PeriodicRangeTrigger = trigger.Create();
        Frostbitten = new Dictionary<unit, float>();
        Effects = new Dictionary<unit, effect>();
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
        Unit.Unit.SetVertexColor(150, 120, 255);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        GC.RemoveTrigger(ref InRangeTrigger);
        GC.RemoveTrigger(ref PeriodicRangeTrigger);
        RemoveAllEffects();
        GC.RemoveDictionary(ref Frostbitten);
        GC.RemoveDictionary(ref Effects);
        GC.RemoveList(ref TempList);
        base.Remove();
    }

    private void RemoveAllEffects()
    {
        foreach (var effect in Effects.Values)
            effect.Dispose();
        foreach (var target in Frostbitten.Keys)
            target.BaseMovementSpeed = Frostbitten[target];
    }

    private void RegisterEvents()
    {
        PeriodicRangeTrigger.RegisterTimerEvent(0.3f, true);
        PeriodicRangeTrigger.AddAction(() => PeriodicRangeCheck());
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FROSTBITE_RADIUS, Filters.KittyFilter);
        InRangeTrigger.AddAction(() =>
        {
            var target = @event.Unit;
            if (!target.Alive) return; // must be alive
            if (Frostbitten.ContainsKey(target)) return; // cannot be bitten already
            if (!RegionList.WolfRegions[Unit.RegionIndex].Contains(target.X, target.Y)) return; // must be in same lane
            SlowEffect(target);
        });
    }

    private void PeriodicRangeCheck()
    {
        if (Frostbitten.Count == 0) return;

        foreach (var kvp in Frostbitten)
        {
            var target = kvp.Key;
            var originalSpeed = kvp.Value;

            if (target.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue;

            target.BaseMovementSpeed = originalSpeed;
            TempList.Add(target);
        }

        foreach (var target in TempList)
        {
            Frostbitten.Remove(target);
            Effects[target].Dispose();
        }

        TempList.Clear();
    }

    private void SlowEffect(unit target)
    {
        if (target.GetAbilityLevel(FourCC("Bspe")) > 0) return; // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return; // Frostbite ring
        Frostbitten.Add(target, target.BaseMovementSpeed);
        Effects[target] = effect.Create(FROSTBITE_TARGET_EFFECT, target, "chest");
        target.BaseMovementSpeed = target.BaseMovementSpeed * FROSTBITE_SPEED_REDUCTION;
    }
}