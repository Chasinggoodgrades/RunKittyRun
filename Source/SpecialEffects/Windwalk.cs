using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Windwalk
{
    private static trigger Trigger;

    public static void Initialize()
    {
        RegisterWWCast();
    }

    private static void RegisterWWCast()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        Trigger = trigger.Create();
        foreach(var player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_WIND_WALK));
        Trigger.AddAction(() => ApplyWindwalkEffect());
    }

    private static void ApplyWindwalkEffect()
    {
        var caster = @event.Unit;
        var player = caster.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var abilityLevel = caster.GetAbilityLevel(Constants.ABILITY_WIND_WALK);
        var duration = 3.0f + (2.0f * abilityLevel);
        var wwID = kitty.WindwalkID;
        AmuletWindwalkEffect(caster);
        if (wwID != 0)
        {
            var reward = RewardsManager.Rewards.Find(r => r.GetAbilityID() == wwID);
            var visual = reward.ModelPath;
            var effect = caster.AddSpecialEffect(visual, "origin");
            Utility.SimpleTimer(duration, () => effect.Dispose());
        }
    }

    private static void AmuletWindwalkEffect(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var newCollisionRadius = AmuletOfEvasiveness.GetCollisionReduction(Unit) - AmuletOfEvasiveness.AMULET_UPGRADE_WW_COLLISION_REDUCTION;
        Console.WriteLine($"Collision Radius: {newCollisionRadius}");
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = newCollisionRadius;
        CollisionDetection.KittyRegisterCollisions(kitty);

        var t = timer.Create();
        t.Start(AmuletOfEvasiveness.WINDWALK_COLLISION_DURATION, false, () =>
        {
            CollisionDetection.KITTY_COLLISION_RADIUS[player] = AmuletOfEvasiveness.GetCollisionReduction(Unit);
            CollisionDetection.KittyRegisterCollisions(kitty);
            t.Dispose();
        });
    }

}