using System;
using System.Collections.Generic;
using System.Diagnostics.Tracing;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// This class handles:
/// * Activation / Deactivation of Rewards (Based on Spell Cast Event)
/// * Any activated reward including the Reset ability so long as it's added within the RewardCreation class.
/// </summary>
public static class RewardsManager
{
    public static List<Reward> Rewards = new List<Reward>();
    public static List<Reward> GameStatRewards = new List<Reward>();
    public static Dictionary<player, effect> ActiveWings = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveAuras = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveHats = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveTrails = new Dictionary<player, effect>();
    private static trigger Trigger = CreateTrigger();
    private static List<int> RewardAbilities = new List<int>();
    public static void Initialize()
    {
        InitializeRewardState();
        AwardManager.Initialize();
        RegisterTrigger();
        RewardCreation.SetupRewards();
        RewardAbilitiesList();
        AwardManager.RegisterGamestatEvents();
    }

    private static void RewardAbilitiesList()
    {
        foreach (var reward in Rewards)
            RewardAbilities.Add(reward.AbilityID);
    }

    private static void InitializeRewardState()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            ActiveWings.Add(player, null);
            ActiveAuras.Add(player, null);
            ActiveHats.Add(player, null);
            ActiveTrails.Add(player, null);
        }
    }

    private static void RegisterTrigger()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        }
        Trigger.AddAction(() => CastedReward());
    }

    private static void CastedReward()
    {
        var spellID = GetSpellAbilityId();
        var unit = GetTriggerUnit();
        if (IsResetSpell(spellID))
        {
            ResetRewardSettings(unit);
            return;
        }
        else if (IsRewardAbility(spellID))
        {
            var player = GetOwningPlayer(unit);
            var reward = Rewards.Find(r => r.GetAbilityID() == GetSpellAbilityId());
            reward.ApplyReward(player);
        }
    }

    private static bool IsRewardAbility(int spellID) => RewardAbilities.Contains(spellID);

    private static bool IsResetSpell(int spellID) => spellID == Constants.ABILITY_RESET;

    private static void ResetRewardSettings(unit Unit)
    {
        var player = GetOwningPlayer(Unit);
        var kitty = Globals.ALL_KITTIES[player];
        if (ActiveWings[player] != null)
        {
            ActiveWings[player].Dispose();
            ActiveWings[player] = null;
        }
        if (ActiveAuras[player] != null)
        {
            ActiveAuras[player].Dispose();
            ActiveAuras[player] = null;
        }
        if (ActiveHats[player] != null)
        {
            ActiveHats[player].Dispose();
            ActiveHats[player] = null;
        }
        if (ActiveTrails[player] != null)
        {
            ActiveTrails[player].Dispose();
            ActiveTrails[player] = null;
        }
        kitty.Unit.Skin = Constants.UNIT_KITTY;
        kitty.SaveData.SelectedData[SelectedData.SelectedSkin] = 0;

    }
}