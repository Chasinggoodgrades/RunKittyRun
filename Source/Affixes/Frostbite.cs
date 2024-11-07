using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Buffs;
using static WCSharp.Api.Common;
public class Frostbite : Affix
{
    private const float FROSTBITE_RADIUS = 500.0f;
    private const float FROSTBITE_SPEED_REDUCTION = 0.83f;
    private trigger InRangeTrigger;
    private trigger PeriodicRangeTrigger;
    private Dictionary<unit, float> Frostbitten;
    public Frostbite(Wolf unit) : base(unit)
    {
        InRangeTrigger = trigger.Create();
        PeriodicRangeTrigger = trigger.Create();
        Frostbitten = new Dictionary<unit, float>();
    }

    private void RegisterEvents()
    {
        PeriodicRangeTrigger.RegisterTimerEvent(0.3f, true);
        PeriodicRangeTrigger.AddAction(() => PeriodicRangeCheck());
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FROSTBITE_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        InRangeTrigger.AddAction(() =>
        {
            Console.WriteLine("Frostbite triggered!");
            var target = @event.Unit;
            if (target == Unit.Unit) return; // not self
            if (!target.Alive) return; // must be alive
            if (Frostbitten.ContainsKey(target)) return; // cannot be bitten already
            if (!RegionList.WolfRegions[Unit.RegionIndex].Contains(target.X, target.Y)) return; // must be in same lane
            SlowEffect(target);
        });
    }

    private void PeriodicRangeCheck()
    {
        if (Frostbitten.Count == 0) return;

        var targetsToRemove = new List<unit>();

        foreach (var kvp in Frostbitten)
        {
            var target = kvp.Key;
            var originalSpeed = kvp.Value;

            if (target.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue;

            target.BaseMovementSpeed = originalSpeed;
            targetsToRemove.Add(target);
        }

        foreach (var target in targetsToRemove)
        {
            Frostbitten.Remove(target);
        }
    }

    private void SlowEffect(unit target)
    {
        if (target.GetAbilityLevel(FourCC("Bspe")) > 0) return; // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return; // Frostbite ring
        Frostbitten.Add(target, target.BaseMovementSpeed);
        target.BaseMovementSpeed = target.BaseMovementSpeed * FROSTBITE_SPEED_REDUCTION;
    }

    public override void Apply()
    {
        SetUnitVertexColor(Unit.Unit, 0, 50, 220, 255);
        Unit.Unit.AddAbility(Constants.ABILITY_FROSTBITE);
        RegisterEvents();
    }

    public override void Remove()
    {
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        Unit.Unit.RemoveAbility(Constants.ABILITY_FROSTBITE);
        InRangeTrigger.Dispose();
        Frostbitten.Clear();
    }

    /*    private float CurrentEffectiveMS(unit target)
    {
        var baseMS = target.BaseMovementSpeed;
        var bootMS = Utility.UnitHasItem(target, Constants.ITEM_PEGASUS_BOOTS) ? 60.0f : 0.0f;
        float msMultiplier = 1.0f;

        // Agility Aura
        int agiAbility = Constants.ABILITY_AGILITY_AURA;
        int agiLevel = target.GetAbilityLevel(agiAbility);
        if (agiLevel > 0)
        {
            float agiBonus = target.GetAbility(agiAbility).GetMovementSpeedIncreasePercent_Oae1(agiLevel);
            msMultiplier *= (1.0f + agiBonus);
        }

        // Windwalk
        int wwAbility = Constants.ABILITY_WIND_WALK;
        int wwLevel = target.GetAbilityLevel(wwAbility);
        if (wwLevel > 0)
        {
            float wwBonus = target.GetAbility(wwAbility).GetMovementSpeedIncreasePercent_Owk2(wwLevel);
            msMultiplier *= (1.0f + wwBonus);
        }

        return (baseMS * msMultiplier * FROSTBITE_SPEED_REDUCTION) - (bootMS / 2);
    }*/
}