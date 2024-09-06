using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.SaveLoad;
using static WCSharp.Api.Common;
public enum RewardType
{
    Wings,
    Hat,
    Aura,
    Trail,
    Windwalk,
    Skin
}
public class Reward
{
    public Awards Name { get; }
    public int AbilityID { get; }
    public string OriginPoint { get; }
    public string ModelPath { get; }
    public int SkinID { get; }
    public RewardType Type { get; }
    public bool GameStatsReward { get; }
    public Reward(Awards name, int abilityID, string originPoint, string modelPath, int skinID, RewardType type, bool gameStatsReward)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        SkinID = skinID;
        Type = type;
        GameStatsReward = gameStatsReward;
        if (GameStatsReward) RewardsManager.GameStatRewards.Add(this);
    }

    public void ApplyReward(player player)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if(SetSkin(player)) return;
        var effect = AddSpecialEffectTarget(ModelPath, kitty, OriginPoint);
        SetEffect(player, effect);
    }

    private void SetEffect(player player, effect effect)
    {
        if (Type == RewardType.Wings)
            RewardsManager.ActiveWings[player] = effect;
        else if (Type == RewardType.Hat)
            RewardsManager.ActiveHats[player] = effect;
        else if (Type == RewardType.Aura)
            RewardsManager.ActiveAuras[player] = effect;
        else if (Type == RewardType.Trail)
            RewardsManager.ActiveTrails[player] = effect;
    }

    private bool SetSkin(player player)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (Type == RewardType.Skin)
        {
            if(SkinID != 0) BlzSetUnitSkin(kitty, SkinID);
            return true;
        }
        return false;
    }

    public string SystemRewardName() => Name.ToString();
    public string GetRewardName() => Name.ToString().Replace("_", " ");
    public int GetAbilityID() => AbilityID;
    public bool IsGameStatsReward() => GameStatsReward;
}