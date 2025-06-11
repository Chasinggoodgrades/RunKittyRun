using System;
using WCSharp.Api;
using WCSharp.Api.Enums;
using static WCSharp.Api.Common;

public static class Windwalk
{
    private static trigger Trigger;
    private static trigger HotkeyTrigger = CreateTrigger();
    private static int WindwalkID = FourCC("BOwk"); // Windwalk buff ID
    public static void Initialize()
    {
        RegisterHotKey();
        RegisterWWCast();

    }

    private static void RegisterWWCast()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
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

    private static void RegisterHotKeyEvents()
    {
        player p = @event.Player;
        Kitty k = Globals.ALL_KITTIES[p];

        if (!k.Alive) return; // cannot cast if dead obviously.
        if (Blizzard.UnitHasBuffBJ(k.Unit, WindwalkID)) return;
        k.Unit.IssueOrder("windwalk");
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
