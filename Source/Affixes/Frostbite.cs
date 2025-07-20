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
    private Dictionary<unit, float> Frostbitten = new Dictionary<unit, float>();
    private Dictionary<unit, effect> Effects = new Dictionary<unit, effect>();
    private List<unit> TempList = new List<unit>();

    public Frostbite(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_LIGHTBLUE}Frostbite|r";
        InRangeTrigger = trigger.Create();
        PeriodicRangeTrigger = trigger.Create();
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
            GC.RemoveDictionary(ref Frostbitten);
            GC.RemoveDictionary(ref Effects);
            GC.RemoveList(ref TempList);
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
        try
        {
            if (Effects == null || Frostbitten == null) return;
            foreach (var effect in Effects)
                effect.Value?.Dispose();
            foreach (var target in Frostbitten.Keys)
                target.MovementSpeed = Frostbitten[target];
        }
        catch (System.Exception e)
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
            if (Frostbitten.ContainsKey(target)) return; // cannot be bitten already
            if (!RegionList.WolfRegions[Unit.RegionIndex].Contains(target.X, target.Y)) return; // must be in same lane
            SlowEffect(target);
        });
    }

    private void PeriodicRangeCheck()
    {
        if (Frostbitten.Count == 0) return;
        try
        {
            foreach (var kvp in Frostbitten) // This approach should be rewritten to avoid foreach and also dictionaries / list allocations and modificatons
            {
                var target = kvp.Key;
                var originalSpeed = kvp.Value;

                if (target.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue;

                target.MovementSpeed = originalSpeed;
                TempList.Add(target);
            }

            for (int i = 0; i < TempList.Count; i++)
            {
                var target = TempList[i];
                Frostbitten.Remove(target);
                if (Effects.ContainsKey(target))
                {
                    Effects[target]?.Dispose();
                }
            }

            TempList.Clear();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Frostbite.PeriodicRangeCheck: {e.Message}");
        }
    }

    private void SlowEffect(unit target)
    {
        if (target.GetAbilityLevel(ADRENALINE_POTION_ABILITY) > 0) return; // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return; // Frostbite ring
        Frostbitten.Add(target, target.DefaultMovementSpeed);
        Effects[target] ??= effect.Create(FROSTBITE_TARGET_EFFECT, target, "chest");
        target.MovementSpeed = target.DefaultMovementSpeed * FROSTBITE_SPEED_REDUCTION;
    }

    public override void Pause(bool pause)
    {
        // no logic needed atm.
    }
}
