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
    private static float FROSTBITE_FREEZE_DURATION = 5.0f; private trigger Trigger;
    private const string IconPath = "ReplaceableTextures\\CommandButtons\\BTNFrostRing.blp";

    public FrostbiteRing() : base(
        "Frostbite Ring",
        "Freezes enemies on hit",
        RelicItemID,
        RelicCost,
        IconPath
        )
    {}

    public override void ApplyEffect(unit Unit)
    {
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(() => FrostbiteCast(@event.SpellTargetLoc));
        Unit.AddAbility(RelicAbilityID);
    }

    public override void RemoveEffect(unit Unit)
    {
        Unit.RemoveAbility(RelicAbilityID);
        Trigger.Dispose();
    }
    private static bool WolvesFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;

    private static void FrostbiteCast(location freezeLocation)
    {
        Console.WriteLine("Frostbite");
        var tempGroup = group.Create();
        GroupEnumUnitsInRange(tempGroup, GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, Filter(() => WolvesFilter()));
        foreach (var unit in tempGroup.ToList())
            FrostbiteEffect(unit);
        freezeLocation.Dispose();
        tempGroup.Dispose();
    }

    private static void FrostbiteEffect(unit Unit)
    {
        var t = timer.Create();
        Unit.SetPausedEx(true);
        var effect = AddSpecialEffectTarget(FROSTBITE_RING_EFFECT, Unit, "origin");
        TimerStart(t, FROSTBITE_FREEZE_DURATION, false, () =>
        {
            Unit.SetPausedEx(false);
            effect.Dispose();
            t.Dispose();
        });
    }

}