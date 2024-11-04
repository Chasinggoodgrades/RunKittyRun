using System;
using WCSharp.Api;
/// <summary>
/// Reward Class and Enums
/// * Enums are the different types of rewards. They help designate which category the reward should be in.
/// * The Reward class simply helps define what the Reward is ; ie name, ability, model.. etc.
/// </summary>
public enum RewardType
{
    Auras,
    Windwalks,
    Skins,
    Trails,
    Deathless,
    Nitros,
    Hats,
    Wings,
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
        if (SetWindwalk(player)) return;
        var Effect = effect.Create(ModelPath, kitty, OriginPoint);
        SetEffect(player, Effect);
        player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Applying {GetRewardName()}|r");
    }

    private void SetEffect(player player, effect effect)
    {
        DestroyCurrentEffect(player);
        if (Type == RewardType.Wings)
            RewardsManager.ActiveWings[player] = effect;
        else if (Type == RewardType.Hats)
            RewardsManager.ActiveHats[player] = effect;
        else if (Type == RewardType.Auras)
            RewardsManager.ActiveAuras[player] = effect;
        else if (Type == RewardType.Trails || Type == RewardType.Nitros || Type == RewardType.Deathless)
            RewardsManager.ActiveTrails[player] = effect;
    }

    private void DestroyCurrentEffect(player player)
    {
        if (Type == RewardType.Wings)
            RewardsManager.ActiveWings[player].Dispose();
        else if (Type == RewardType.Hats)
            RewardsManager.ActiveHats[player].Dispose();
        else if (Type == RewardType.Auras)
            RewardsManager.ActiveAuras[player].Dispose();
        else if (Type == RewardType.Trails || Type == RewardType.Nitros || Type == RewardType.Deathless)
            RewardsManager.ActiveTrails[player].Dispose();
    }

    private bool SetWindwalk(player player)
    {
        if (Type != RewardType.Windwalks) return false;
        var kitty = Globals.ALL_KITTIES[player];
        kitty.WindwalkID = AbilityID;
        return true;
    }

    private bool SetSkin(player player)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (Type == RewardType.Skins)
        {
            if(SkinID != 0) kitty.Skin = SkinID;
            else Console.WriteLine($"Skins ID invalid for {Name}");
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