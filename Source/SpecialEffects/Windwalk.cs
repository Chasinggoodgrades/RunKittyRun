using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Api.Enums;
using static WCSharp.Api.Common;

public static class Windwalk
{
    private const int AUTO_WW_LEVEL = 8;
    private static trigger Trigger;
    private static trigger FreeWW;
    private static List<Kitty> FreeWWObtained = new List<Kitty>();
    private static trigger HotkeyTrigger;
    private static timer AutoWW;
    private static int WindwalkID = FourCC("BOwk"); // Windwalk buff ID
    public static void Initialize()
    {
        RegisterHotKey();
        RegisterWWCast();
        RegisterFreeWW();
        AutoWW = timer.Create();
        AutoWW.Start(0.5f, true, AutoReactivateWW);
    }

    private static void RegisterWWCast()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        Trigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        Trigger.AddCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_WIND_WALK));
        Trigger.AddAction(ApplyWindwalkEffect);
    }

    private static void RegisterHotKey()
    {
        HotkeyTrigger = CreateTrigger();
        foreach (var p in Globals.ALL_PLAYERS)
        {
            HotkeyTrigger.RegisterPlayerKeyEvent(p, oskeytype.NumPad0, 0, true);
        }
        HotkeyTrigger.AddAction(RegisterHotKeyEvents);
    }

    private static void RegisterFreeWW()
    {
        FreeWW = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            FreeWW.RegisterUnitEvent(Globals.ALL_KITTIES[player].Unit, unitevent.HeroLevel);
        FreeWW.AddAction(FreeWWActions);
    }

    private static void FreeWWActions()
    {
        var triggeredUnit = @event.Unit;
        var kitty = Globals.ALL_KITTIES[triggeredUnit.Owner];
        if (triggeredUnit.Level >= AUTO_WW_LEVEL && !kitty.CurrentStats.FreeWWObtained)
        {
            FreeWWObtained.Add(kitty);
            kitty.CurrentStats.FreeWWObtained = true;
            var ability = triggeredUnit.GetAbility(Constants.ABILITY_WIND_WALK);
            if (triggeredUnit.UnitType == Constants.UNIT_KITTY && ability == null)
            {
                triggeredUnit.RemoveAbility(Constants.ABILITY_WIND_WALK);
                triggeredUnit.AddAbility(Constants.ABILITY_WIND_WALK);
                ability = triggeredUnit.GetAbility(Constants.ABILITY_WIND_WALK);
            }
            var maxLevel = ability.Levels;
            for (int i = 0; i < maxLevel; i++)
            {
                BlzSetAbilityIntegerLevelField(ability, ABILITY_ILF_MANA_COST, i, 0);
                BlzSetAbilityRealLevelField(ability, ABILITY_RLF_DURATION_HERO, i, 99999);
                BlzSetAbilityRealLevelField(ability, ABILITY_RLF_TRANSITION_TIME, i, 99999);
            }
            triggeredUnit.Owner.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_TURQUOISE}Your windwalk is now free and will auto cast!{Colors.COLOR_RESET}");
        }
    }

    public static void ReactivateWindwalk(Kitty k, bool lastPoint = false)
    {
        var unit = k.Unit;
        if (!unit.Alive) return;
        if (!k.CurrentStats.FreeWWObtained) return;
        if (Blizzard.UnitHasBuffBJ(k.Unit, WindwalkID)) return;
        Blizzard.IssueImmediateOrderBJ(k.Unit, "windwalk");
        if (lastPoint) k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY);
    }

    private static void AutoReactivateWW()
    {
        for (int i = 0; i < FreeWWObtained.Count; i++)
        {
            var k = FreeWWObtained[i];
            if (!k.Alive) continue;
            ReactivateWindwalk(k);
        }
    }

    private static void RegisterHotKeyEvents()
    {
        player p = @event.Player;
        Kitty k = Globals.ALL_KITTIES[p];

        if (!k.Alive) return; // cannot cast if dead obviously.
        if (Blizzard.UnitHasBuffBJ(k.Unit, WindwalkID)) return;
        Blizzard.IssueImmediateOrderBJ(k.Unit, "windwalk");
        k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY);
    }

    private static void ApplyWindwalkEffect()
    {
        var caster = @event.Unit;
        var player = caster.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var abilityLevel = caster.GetAbilityLevel(Constants.ABILITY_WIND_WALK);
        var duration = 3.0f + (2.0f * abilityLevel);
        var wwID = kitty.ActiveAwards.WindwalkID;
        try
        {
            // AmuletOfEvasiveness.AmuletWindwalkEffect(caster);
            if (wwID != 0)
            {
                var reward = RewardsManager.Rewards.Find(r => r.GetAbilityID() == wwID);
                var visual = reward.ModelPath;
                var e = caster.AddSpecialEffect(visual, "origin");
                if (e != null)
                {
                    Utility.SimpleTimer(duration, () =>
                    {
                        if (e != null) DestroyEffect(e);
                    });
                }
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Windwalk.ApplyWindwalkEffect: {e.Message}");
        }
    }
}
