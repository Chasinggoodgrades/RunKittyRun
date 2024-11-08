using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public class RingOfSummoning : Relic
{
    public const int RelicItemID = Constants.ITEM_SACRED_RING_OF_SUMMONING;
    private const int RelicAbilityID = Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float SUMMONING_RING_RADIUS = 300.0f;
    private const string IconPath = "war3mapImported\\BTNArcaniteNightRing.blp";
    private trigger Trigger;

    public RingOfSummoning() : base(
        $"{Colors.COLOR_GREEN}Sacred Ring of Summoning|r",
        $"On use, summons a fellow kitty within a {Colors.COLOR_ORANGE}{SUMMONING_RING_RADIUS} targeted AoE. |r Reviving a dead kitty requires them to be ahead of you." +
        $" {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(1min 30sec Cooldown)|r",
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        RegisterTriggers();
    }

    private void RegisterTriggers()
    {
        Trigger = trigger.Create();
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(() => SacredRingOfSummoning());
    }

    public override void ApplyEffect(unit Unit)
    {
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Unit.DisableAbility(RelicAbilityID, false, false);
        Console.WriteLine("Apply Effect Summonin Ring");
    }

    public override void RemoveEffect(unit Unit)
    {
        Trigger.Dispose();
        Unit.DisableAbility(RelicAbilityID, true, true);
    }

    private static bool KittyFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY;
    private static bool CircleFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE;

    private static void SetAbilityData(player player, ability ability)
    {
        BlzSetAbilityRealLevelField(ability, ABILITY_RLF_AREA_OF_EFFECT, 0, SUMMONING_RING_RADIUS);
    }

    public static void SacredRingOfSummoning()
    {
        // select all people within targeted point
        var player = @event.Unit.Owner;
        var targetedPoint = @event.SpellTargetLoc;
        var tempGroup = group.Create();
        var summoningKitty = Globals.ALL_KITTIES[player];
        var summoningKittyUnit = summoningKitty.Unit;
        SetAbilityData(player, @event.SpellAbility);
        GroupEnumUnitsInRange(tempGroup, GetLocationX(targetedPoint), GetLocationY(targetedPoint), SUMMONING_RING_RADIUS, Filter(() => CircleFilter() || KittyFilter()));
        foreach (var unit in tempGroup.ToList())
        {
            // TO DO... Do a check on safezone stuff.
            var kitty = Globals.ALL_KITTIES[unit.Owner];
            kitty.Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ReviveKitty(summoningKitty);
        }

        tempGroup.Dispose();
        targetedPoint.Dispose();
    }
}