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
    public string Name { get; }
    public int AbilityID { get; }
    public string OriginPoint { get; }
    public string ModelPath { get; }
    public int SkinID { get; }
    public RewardType Type { get; }
    public string GameStat { get; }
    public int GameStatValue { get; set; }

    private static GameSelectedData GlobalSelectedData = new GameSelectedData();

    public Reward(string name, int abilityID, string originPoint, string modelPath, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
    }

    public Reward(string name, int abilityID, int skinID, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
    }

    public Reward(string name, int abilityID, int skinID, RewardType type, string gameStat, int gameStatValue)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
        GameStat = gameStat;
        GameStatValue = gameStatValue;
        RewardsManager.GameStatRewards.Add(this);
    }

    public Reward(string name, int abilityID, string originPoint, string modelPath, RewardType type, string gameStat, int gameStatValue)
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

    /// <summary>
    /// Applies the reward and cosmetic appearance to the player. 
    /// If the <paramref name="setData"/> parameter is true, it also alters the saved data.
    /// </summary>
    /// <param name="player">The player object to which the reward will be applied.</param>
    /// <param name="setData">Indicates whether to alter the saved data while setting the player's rewards. Default is true.</param>
    public void ApplyReward(player player, bool setData = true)
    {
        if (setData) SetSelectedData(player);
        SetEffect(player);
        if (setData) player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Applying {GetRewardName()}|r");
    }

    private void SetEffect(player player)
    {
        // Special handle case.
        if (SetSkin(player)) return;
        if (SetWindwalk(player)) return;

        var kitty = Globals.ALL_KITTIES[player].Unit;
        var effectInstance = effect.Create(ModelPath, kitty, OriginPoint);

        DestroyCurrentEffect(player);
        ApplyEffect(player, effectInstance);
    }

    private void ApplyEffect(player player, effect effectInstance)
    {
        switch (Type)
        {
            case RewardType.Wings:
                RewardsManager.ActiveWings[player] = effectInstance;
                break;
            case RewardType.Hats:
                RewardsManager.ActiveHats[player] = effectInstance;
                break;
            case RewardType.Auras:
                RewardsManager.ActiveAuras[player] = effectInstance;
                break;
            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                RewardsManager.ActiveTrails[player] = effectInstance;
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
    }

    private void DestroyCurrentEffect(player player)
    {
        switch (Type)
        {
            case RewardType.Wings:
                RewardsManager.ActiveWings[player]?.Dispose();
                break;
            case RewardType.Hats:
                RewardsManager.ActiveHats[player]?.Dispose();
                break;
            case RewardType.Auras:
                RewardsManager.ActiveAuras[player]?.Dispose();
                break;
            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                RewardsManager.ActiveTrails[player]?.Dispose();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
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
        if (Type != RewardType.Skins) return false;

        var kitty = Globals.ALL_KITTIES[player].Unit;

        if (SkinID != 0)
        {
            kitty.Skin = SkinID;
            AmuletOfEvasiveness.ScaleUnit(kitty);
        }
        else
            Console.WriteLine($"Skins ID invalid for {Name}");

        return true;
    }

    private void SetSelectedData(player player)
    {
        var saveData = Globals.ALL_KITTIES[player].SaveData;

        switch (Type)
        {
            case RewardType.Skins:
                saveData.SelectedData.SelectedSkin = Name;
                break;
            case RewardType.Windwalks:
                saveData.SelectedData.SelectedWindwalk = Name;
                break;
            case RewardType.Auras:
                saveData.SelectedData.SelectedAura = Name;
                break;
            case RewardType.Hats:
                saveData.SelectedData.SelectedHat = Name;
                break;
            case RewardType.Wings:
                saveData.SelectedData.SelectedWings = Name;
                break;
            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                saveData.SelectedData.SelectedTrail = Name;
                break;
            default:
                Console.WriteLine("Error with selected data");
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
    }

    //public static Reward GetRewardFromAward(Awards award) => RewardsManager.Rewards.Find(x => x.Name == award);
    public string SystemRewardName() => Name.ToString();
    public string GetRewardName() => Name.ToString().Replace("_", " ");
    public int GetAbilityID() => AbilityID;

}