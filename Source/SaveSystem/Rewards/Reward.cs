using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using WCSharp.Api;
using WCSharp.SaveLoad;
using static WCSharp.Api.Common;
/// <summary>
/// Reward Class and Enums
/// * Enums are the different types of rewards. They help designate which category the reward should be in.
/// * The Reward class simply helps define what the Reward is ; ie name, ability, model.. etc.
/// </summary>
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
    public StatTypes GameStat { get; }
    public int GameStatValue { get; set; }

    public Reward(Awards name, int abilityID, string originPoint, string modelPath, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
    }

    public Reward(Awards name, int abilityID, int skinID, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
    }

    public Reward(Awards name, int abilityID, int skinID, RewardType type, StatTypes gameStat, int gameStatValue)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
        GameStat = gameStat;
        GameStatValue = gameStatValue;
        RewardsManager.GameStatRewards.Add(this);
    }

    public Reward(Awards name, int abilityID, string originPoint, string modelPath, RewardType type, StatTypes gameStat, int gameStatValue)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
        GameStat = gameStat;
        GameStatValue = gameStatValue;
        RewardsManager.GameStatRewards.Add(this);
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
        DestroyCurrentEffect(player);
        if (Type == RewardType.Wings)
            RewardsManager.ActiveWings[player] = effect;
        else if (Type == RewardType.Hat)
            RewardsManager.ActiveHats[player] = effect;
        else if (Type == RewardType.Aura)
            RewardsManager.ActiveAuras[player] = effect;
        else if (Type == RewardType.Trail)
            RewardsManager.ActiveTrails[player] = effect;
        else if (Type == RewardType.Windwalk)
            DestroyWindWalkEffect(player, effect);
    }

    private void DestroyCurrentEffect(player player)
    {
        if (Type == RewardType.Wings)
            DestroyEffect(RewardsManager.ActiveWings[player]);
        else if (Type == RewardType.Hat)
            DestroyEffect(RewardsManager.ActiveHats[player]);
        else if (Type == RewardType.Aura)
            DestroyEffect(RewardsManager.ActiveAuras[player]);
        else if (Type == RewardType.Trail)
            DestroyEffect(RewardsManager.ActiveTrails[player]);
    }

    private void DestroyWindWalkEffect(player player, effect effect)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        var wwLevel = GetUnitAbilityLevel(kitty, Constants.ABILITY_WIND_WALK);
        var WWTime = 2.0f + (2.0f * wwLevel);
        Utility.SimpleTimer(WWTime, effect.Dispose);
    }

    private bool SetSkin(player player)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (Type == RewardType.Skin)
        {
            //if(SkinID != 0) BlzSetUnitSkin(kitty, SkinID);
            if(SkinID != 0) kitty.Skin = SkinID;
            else Console.WriteLine($"Skin ID invalid for {Name}");
            SetSelectedSkin(player, SkinID);
            return true;
        }
        return false;
    }

    private static void SetSelectedSkin(player player, int skinID)
    {
        var saveData = Globals.ALL_KITTIES[player].SaveData;
        if(skinID == Constants.UNIT_ASTRAL_KITTY) saveData.SelectedData[SelectedData.SelectedSkin] = 1;
        else if(skinID == Constants.UNIT_HIGHELF_KITTY) saveData.SelectedData[SelectedData.SelectedSkin] = 2;
        else if(skinID == Constants.UNIT_UNDEAD_KITTY) saveData.SelectedData[SelectedData.SelectedSkin] = 3;
        else if(skinID == Constants.UNIT_SATYR_KITTY) saveData.SelectedData[SelectedData.SelectedSkin] = 4;
        else if(skinID == Constants.UNIT_ANCIENT_KITTY) saveData.SelectedData[SelectedData.SelectedSkin] = 5;    
    }

    public string SystemRewardName() => Name.ToString();
    public string GetRewardName() => Name.ToString().Replace("_", " ");
    public int GetAbilityID() => AbilityID;

}