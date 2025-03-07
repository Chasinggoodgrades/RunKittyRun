using WCSharp.Api;
using System;
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
        try
        {
            var caster = @event.Unit;
            var player = caster.Owner;
            var kitty = Globals.ALL_KITTIES[player];
            var abilityLevel = caster.GetAbilityLevel(Constants.ABILITY_WIND_WALK);
            var duration = 3.0f + (2.0f * abilityLevel);
            var wwID = kitty.WindwalkID;
            Logger.Verbose($"Windwalk ID: {wwID}");
            AmuletOfEvasiveness.AmuletWindwalkEffect(caster);
            if (wwID != 0)
            {
                var reward = RewardsManager.Rewards.Find(r => r.GetAbilityID() == wwID);
                var visual = reward.ModelPath;
                Logger.Verbose($"Name: {reward.Name} - Windwalk Visual: {visual}");
                var effect = caster.AddSpecialEffect(visual, "origin");
                Utility.SimpleTimer(duration, () => effect.Dispose());
            }
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
        }
    }
}