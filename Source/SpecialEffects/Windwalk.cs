using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Api.Enums;
using static WCSharp.Api.Common;

public class Windwalk
{
    private const int AUTO_WW_LEVEL = 8;
    private static readonly int WindwalkID = FourCC("BOwk"); // Windwalk buff ID
    private static readonly List<Windwalk> Instances = new List<Windwalk>();

    private static trigger CastTrigger;
    private static trigger FreeWWTrigger;
    private static trigger HotkeyTrigger;
    private static timer AutoWWTimer;

    public Kitty Kitty { get; }
    public bool FreeWWObtained { get; private set; } = false;

    public Windwalk(Kitty kitty)
    {
        Kitty = kitty;
        Instances.Add(this);
        RegisterKittyEvents();
    }

    /// <summary>
    /// Creates the shared triggers/timer used by every Windwalk instance. Must be called
    /// before any Kitty (and therefore Windwalk) instances are created.
    /// </summary>
    public static void Initialize()
    {
        RegisterHotKeyTrigger();
        RegisterWWCastTrigger();
        RegisterFreeWWTrigger();
        AutoWWTimer = timer.Create();
        AutoWWTimer.Start(0.5f, true, AutoReactivateAll);
    }

    public void RemoveAutoWW()
    {
        FreeWWObtained = false;
        Kitty.Unit.RemoveAbility(Constants.ABILITY_WIND_WALK);
    }

    public void ReactivateWindwalk(bool lastPoint = false)
    {
        var unit = Kitty.Unit;
        if (!unit.Alive) return;
        if (!FreeWWObtained) return;
        if (Blizzard.UnitHasBuffBJ(unit, WindwalkID)) return;
        Blizzard.IssueImmediateOrderBJ(unit, "windwalk");
        if (lastPoint) unit.IssueOrder(WolfPoint.MoveOrderID, Kitty.APMTracker.LastX, Kitty.APMTracker.LastY);
    }

    public void Dispose()
    {
        Instances.Remove(this);
    }

    private static void RegisterWWCastTrigger()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        CastTrigger = trigger.Create();
        CastTrigger.AddCondition(Condition(() => GetSpellAbilityId() == Constants.ABILITY_WIND_WALK));
        CastTrigger.AddAction(ApplyWindwalkEffectDispatch);
    }

    private static void RegisterHotKeyTrigger()
    {
        HotkeyTrigger = CreateTrigger();
        HotkeyTrigger.AddAction(HotKeyEventsDispatch);
    }

    private static void RegisterFreeWWTrigger()
    {
        FreeWWTrigger = trigger.Create();
        FreeWWTrigger.AddAction(FreeWWActionsDispatch);
    }

    private void RegisterKittyEvents()
    {
        var player = Kitty.Player;
        CastTrigger?.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        HotkeyTrigger.RegisterPlayerKeyEvent(player, oskeytype.NumPad0, 0, true);
        FreeWWTrigger.RegisterUnitEvent(Kitty.Unit, unitevent.HeroLevel);
    }

    private static void AutoReactivateAll()
    {
        for (int i = 0; i < Instances.Count; i++)
        {
            var instance = Instances[i];
            if (!instance.FreeWWObtained) continue;
            if (!instance.Kitty.Alive) continue;
            instance.ReactivateWindwalk();
        }
    }

    private static void HotKeyEventsDispatch()
    {
        var p = @event.Player;
        var kitty = Globals.ALL_KITTIES[p];
        kitty.Windwalk.OnHotkeyPressed();
    }

    private void OnHotkeyPressed()
    {
        if (!Kitty.Alive) return; // cannot cast if dead obviously.
        if (Blizzard.UnitHasBuffBJ(Kitty.Unit, WindwalkID)) return;
        Blizzard.IssueImmediateOrderBJ(Kitty.Unit, "windwalk");
        Kitty.Unit.IssueOrder(WolfPoint.MoveOrderID, Kitty.APMTracker.LastX, Kitty.APMTracker.LastY);
    }

    private static void FreeWWActionsDispatch()
    {
        var triggeredUnit = @event.Unit;
        var kitty = Globals.ALL_KITTIES[triggeredUnit.Owner];
        kitty.Windwalk.OnHeroLevelChanged(triggeredUnit);
    }

    private void OnHeroLevelChanged(unit triggeredUnit)
    {
        if (triggeredUnit.Level < AUTO_WW_LEVEL || FreeWWObtained) return;

        FreeWWObtained = true;
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
        Kitty.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_TURQUOISE}Your windwalk is now free and will auto cast!{Colors.COLOR_RESET}");
    }

    private static void ApplyWindwalkEffectDispatch()
    {
        var caster = @event.Unit;
        var kitty = Globals.ALL_KITTIES[caster.Owner];
        kitty.Windwalk.ApplyWindwalkEffect(caster);
    }

    private void ApplyWindwalkEffect(unit caster)
    {
        var abilityLevel = caster.GetAbilityLevel(Constants.ABILITY_WIND_WALK);
        var duration = 3.0f + (2.0f * abilityLevel);
        var wwID = Kitty.ActiveAwards.WindwalkID;
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
