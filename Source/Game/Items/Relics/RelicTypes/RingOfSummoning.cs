using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public class RingOfSummoning : Relic
{
    public const int RelicItemID = Constants.ITEM_SACRED_RING_OF_SUMMONING;
    public const int RelicAbilityID = Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE;
    private const int RelicCost = 650;
    private static float SUMMONING_RING_RADIUS = 300.0f;
    private static float SUMMONING_COOLDOWN = 90.0f;
    private static float UPGRADE_COOLDOWN_REDUCTION = 30.0f;
    private static new string IconPath = "war3mapImported\\BTNArcaniteNightRing.blp";
    private trigger Trigger;
    private unit Owner;
    private group SummonGroup = group.Create();

    public RingOfSummoning() : base(
        $"{Colors.COLOR_GREEN}Sacred Ring of Summoning|r",
        $"On use, summons a fellow kitty within a {Colors.COLOR_ORANGE}{SUMMONING_RING_RADIUS} targeted AoE. |r Reviving a dead kitty requires them to be ahead of you." +
        $" {Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(1min 30sec Cooldown)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Cooldown of summoning ability reduced by {UPGRADE_COOLDOWN_REDUCTION} seconds.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Summons one additional player within your targeted AoE.", 20, 1000));
    }

    private void RegisterTriggers(unit Unit)
    {
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(() => SacredRingOfSummoning());
    }

    public override void ApplyEffect(unit Unit)
    {
        RegisterTriggers(Unit);
        Owner = Unit;
        Unit.DisableAbility(RelicAbilityID, false, false);
        Utility.SimpleTimer(0.1f, () => SetAbilityData(Unit));
    }

    public override void RemoveEffect(unit Unit)
    {
        GC.RemoveTrigger(ref Trigger);
        GC.RemoveGroup(ref SummonGroup);
        Owner = null;
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    /// <summary>
    /// Sets ability cooldown and radius based on upgrade level.
    /// </summary>
    /// <param name="Unit"></param>
    private void SetAbilityData(unit Unit)
    {
        var ability = Unit.GetAbility(RelicAbilityID);
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());

        // Summon radius thingy
        BlzSetAbilityRealLevelField(ability, ABILITY_RLF_AREA_OF_EFFECT, 0, SUMMONING_RING_RADIUS);

        var cooldown = upgradeLevel >= 1
            ? SUMMONING_COOLDOWN - UPGRADE_COOLDOWN_REDUCTION
            : SUMMONING_COOLDOWN;

        // Set cooldown based on the upgrade lvl.
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, cooldown);
    }

    private void SacredRingOfSummoning()
    {
        var player = @event.Unit.Owner;
        var targetedPoint = @event.SpellTargetLoc;
        var summoningKitty = Globals.ALL_KITTIES[player];
        var summoningKittyUnit = summoningKitty.Unit;
        var numberOfSummons = GetNumberOfSummons(player);

        RelicUtil.CloseRelicBook(player);
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID));

        var filter = Utility.CreateFilterFunc(() => CircleFilter() || KittyFilter());
        SummonGroup.EnumUnitsInRange(targetedPoint.X, targetedPoint.Y, SUMMONING_RING_RADIUS, filter); 
        var units = SummonGroup.ToList();
        if(SummonGroup.Contains(summoningKittyUnit)) units.Remove(summoningKittyUnit); // remove self from the list

        for (int i = 0; i < numberOfSummons && i < units.Count; i++)
        {
            var unit = units[i];    
            var kitty = Globals.ALL_KITTIES[unit.Owner];

            if (!SummonDeadKitty(summoningKitty, kitty)) continue;

            kitty.Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            Globals.ALL_CIRCLES[unit.Owner].Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ReviveKitty(summoningKitty);
            Console.WriteLine($"{Colors.PlayerNameColored(player)} has summoned {Colors.PlayerNameColored(kitty.Player)}'s kitty!");
        }

        SummonGroup.Clear();
        GC.RemoveLocation(ref targetedPoint);
        GC.RemoveList(ref units);
        GC.RemoveFilterFunc(ref filter);
    }

    /// <summary>
    /// This function will only return true if the summoned kitty is dead and ahead of the summoner.
    /// </summary>
    /// <param name="summoner"></param>
    /// <param name="summoned"></param>
    /// <returns></returns>
    private bool SummonDeadKitty(Kitty summoner, Kitty summoned)
    {
        var round = Globals.ROUND;
        var sumProg = summoner.TimeProg.GetRoundProgress(round);
        var deadProg = summoned.TimeProg.GetRoundProgress(round);

        if(sumProg > deadProg && !summoned.Alive)
        {
            summoner.Player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cam only summon dead kitties that are ahead of you!");
            return false;
        }
        return true;
    }

    /// <summary>
    /// Returns the number of kitties that can be summoned based on the upgrade level.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private int GetNumberOfSummons(player player)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(RingOfSummoning));
        return upgradeLevel >= 2 ? 2 : 1;
    }

    private static bool KittyFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY;
    private static bool CircleFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE;

}