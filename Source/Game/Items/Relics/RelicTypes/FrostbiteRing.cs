using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
using WCSharp.Shared.Extensions;
public class FrostbiteRing : Relic
{
    public const int RelicItemID = Constants.ITEM_FROSTBITE_RING;
    private static int RelicAbilityID = Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    private const string FROSTBITE_RING_EFFECT = "Abilities\\Spells\\Undead\\FreezingBreath\\FreezingBreathTargetArt.mdl";
    private static float FROSTBITE_FREEZE_DURATION = 5.0f; 
    private const string IconPath = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";

    private trigger Trigger = trigger.Create();

    public FrostbiteRing() : base(
        $"{Colors.COLOR_BLUE}Frostbite Ring",
        $"Freezes wolves in place for {Colors.COLOR_CYAN}{(int)FROSTBITE_FREEZE_DURATION} seconds|r {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(1 min)|r",
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
    }

    private void RegisterTriggers(unit Unit)
    {
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(() => FrostbiteCast(@event.SpellTargetLoc));
    }

    public override void ApplyEffect(unit Unit)
    {
        RegisterTriggers(Unit);
        Unit.DisableAbility(RelicAbilityID, false, false);
    }

    public override void RemoveEffect(unit Unit) => Unit.DisableAbility(RelicAbilityID, true, true);
    private static bool WolvesFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;

    private static void FrostbiteCast(location freezeLocation)
    {
        Console.WriteLine("Frostbite");
        var tempGroup = group.Create();
        GroupEnumUnitsInRange(tempGroup, GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, Filter(() => WolvesFilter()));
        foreach (var unit in tempGroup.ToList())
            FrostbiteEffect(unit);
        freezeLocation.Dispose();
        freezeLocation = null;
        tempGroup.Dispose();
        tempGroup = null;
    }

    private static void FrostbiteEffect(unit Unit)
    {
        var t = timer.Create();
        Unit.SetPausedEx(true);
        var effect = AddSpecialEffectTarget(FROSTBITE_RING_EFFECT, Unit, "origin");
        t.Start(FROSTBITE_FREEZE_DURATION, false, () =>
        {
            Unit.SetPausedEx(false);
            effect.Dispose();
            t.Dispose();
        });
    }

}