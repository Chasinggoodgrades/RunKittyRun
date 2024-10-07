using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public class RingOfSummoning : Relic
{
    public const int RelicItemID = Constants.ITEM_SACRED_RING_OF_SUMMONING;
    private const int RelicAbilityID = Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float SUMMONING_RING_RADIUS = 300.0f;
    private trigger Trigger;

    public RingOfSummoning() : base(
        "Ring of Summoning",
        "Summons friendly allies",
        RelicItemID,
        RelicCost
        )
    {}

    public override void ApplyEffect(unit Unit)
    {
        Trigger = CreateTrigger();
        TriggerRegisterUnitEvent(Trigger, Unit, EVENT_UNIT_SPELL_EFFECT);
        TriggerAddCondition(Trigger, Condition(() => GetSpellAbilityId() == RelicAbilityID));
        TriggerAddAction(Trigger, () => SacredRingOfSummoning(GetOwningPlayer(Unit), GetSpellTargetLoc()));
        Unit.AddAbility(RelicAbilityID);
    }

    public override void RemoveEffect(unit Unit)
    {
        Trigger.Dispose();
        Unit.RemoveAbility(RelicAbilityID);
    }

    private static bool KittyFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY;
    private static bool CircleFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE;

    public static void SacredRingOfSummoning(player Player, location targetedPoint)
    {
        // select all people within targeted point
        var tempGroup = CreateGroup();
        var summoningKitty = Globals.ALL_KITTIES[Player];
        var summoningKittyUnit = summoningKitty.Unit;
        GroupEnumUnitsInRange(tempGroup, GetLocationX(targetedPoint), GetLocationY(targetedPoint), SUMMONING_RING_RADIUS, Filter(() => CircleFilter() || KittyFilter()));
        foreach (var unit in tempGroup.ToList())
        {
            // TO DO... Do a check on safezone stuff.
            var kitty = Globals.ALL_KITTIES[GetOwningPlayer(unit)];
            kitty.Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ReviveKitty(summoningKitty);
        }

        tempGroup.Dispose();
        targetedPoint.Dispose();
    }
}