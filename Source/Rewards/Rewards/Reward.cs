using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

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
    Tournament,
    Deathless,
    Nitros,
    Hats,
    Wings,
}

public class Reward
{
    public string Name { get; }
    public int AbilityID { get; }
    public string OriginPoint { get; } = "";
    public string ModelPath { get; } = "";
    public int SkinID { get; }
    public RewardType Type { get; }
    public IReward Handler { get; }
    public string TypeSorted { get; set; }
    public string GameStat { get; }
    public int GameStatValue { get; set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// Sets the color-coded display name and description sourced from the WTS string table.
    /// </summary>
    public Reward WithDisplay(string displayName, string description)
    {
        DisplayName = displayName;
        Description = description;
        return this;
    }

    public Reward(string name, int abilityID, string originPoint, string modelPath, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
        Handler = RewardHandlers.Resolve(type, name);
    }

    public Reward(string name, int abilityID, int skinID, RewardType type)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
        Handler = RewardHandlers.Resolve(type, name);
    }

    public Reward(string name, int abilityID, int skinID, RewardType type, string gameStat, int gameStatValue)
        : this(name, abilityID, skinID, type)
    {
        GameStat = gameStat;
        GameStatValue = gameStatValue;
        RewardsManager.GameStatRewards.Add(this);
    }

    public Reward(string name, int abilityID, string originPoint, string modelPath, RewardType type, string gameStat, int gameStatValue)
        : this(name, abilityID, originPoint, modelPath, type)
    {
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
        if (!Globals.ALL_KITTIES.TryGetValue(player, out var kitty)) return;

        if (setData) Handler.SetSelected(kitty.SaveData.SelectedData, Name);

        try
        {
            Handler.Apply(kitty, this);
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
        }

        if (setData) player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}Applied:|r {GetRewardName()} {Colors.COLOR_ORANGE}[{Type.ToString()}]");
    }

    public string SetRewardTypeSorted()
    {
        switch (Type)
        {
            case RewardType.Auras: return nameof(Auras);
            case RewardType.Windwalks: return nameof(Windwalks);
            case RewardType.Skins: return nameof(Skins);
            case RewardType.Trails: return nameof(Trails);
            case RewardType.Deathless: return nameof(Deathless);
            case RewardType.Nitros: return nameof(Nitros);
            case RewardType.Hats: return nameof(Hats);
            case RewardType.Wings: return nameof(Wings);
            default: return nameof(Tournament);
        }
    }

    public string SystemRewardName() => Name.ToString();

    public string GetRewardName() => BlzGetAbilityTooltip(AbilityID, 0);

    public int GetAbilityID() => AbilityID;
}
