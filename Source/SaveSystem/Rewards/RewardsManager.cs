using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardsManager
{
    public static List<Reward> Rewards = new List<Reward>();
    public static List<Reward> GameStatRewards = new List<Reward>();
    private static trigger Trigger = CreateTrigger();
    public static Dictionary<player, effect> ActiveWings = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveAuras = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveHats = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveTrails = new Dictionary<player, effect>();
    public static void Initialize()
    {
        InitializeRewardState();
        RegisterTrigger();
        TestReward();
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
        Trigger.AddAction(() => IsRewardSpell());
    }

    private static void IsRewardSpell()
    {
        var spellID = GetSpellAbilityId();
        var unit = GetTriggerUnit();
        Console.WriteLine("Spell ID: " + spellID);
        if (IsResetSpell(spellID))
        {
            ResetRewardSettings(unit);
            return;
        }
        else if (spellID == Constants.ABILITY_SET_WINGS_2_02)
        {
            Console.WriteLine("Reward spell casted!");
            ApplyReward(unit);
        }
    }

    private static bool IsResetSpell(int spellID)
    {
        if (spellID == Constants.ABILITY_RESET) return true;
        return false;
    }

    private static void ResetRewardSettings(unit Unit)
    {
        var player = GetOwningPlayer(Unit);
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
    }

    private static void ApplyReward(unit unit)
    {
        var player = GetOwningPlayer(unit);
        var reward = Rewards.Find(r => r.GetAbilityID() == GetSpellAbilityId());
        Console.WriteLine(player.Name + " has casted " + reward.GetRewardName() + "!");
        reward.ApplyReward(player);
    }
    public static Reward AddReward(Reward reward)
    {
        Rewards.Add(reward);
        Console.WriteLine(reward.GetRewardName() + " has been added to the rewards list.");
        return reward;
    }

    public static Reward AddReward(string name, int abilityID, string originPoint, string modelPath, RewardType rewardType, bool gameStatsAward)
    {
        switch (rewardType)
        {
            case RewardType.Wings:
                return AddReward(new Wings(name, abilityID, originPoint, modelPath, rewardType, gameStatsAward));
            case RewardType.Hat:
                //AddReward(new Hat(name, originPoint, modelPath, rewardType));
                break;
            case RewardType.Aura:
                //AddReward(new Aura(name, originPoint, modelPath, rewardType));
                break;
            case RewardType.Trail:
                //AddReward(new Trail(name, originPoint, modelPath, rewardType));
                break;
        }
        return null;
    }

    public static void TestReward()
    {
        var reward = AddReward(Awards.Cosmic_Wings.ToString(), Constants.ABILITY_SET_WINGS_2_02, "chest", "war3mapImported\\Cosmic Wings.mdx", RewardType.Wings, true);

    }



}