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
    public string TypeSorted { get; set; }
    public string GameStat { get; }
    public int GameStatValue { get; set; }

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
        if (setData) player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}Applied:|r {GetRewardName()} {Colors.COLOR_ORANGE}[{Type.ToString()}]");
    }

    private void SetEffect(player player)
    {
        try
        {
            if (!Globals.ALL_KITTIES.ContainsKey(player)) return;

            if (SetSkin(player)) return;
            if (SetWindwalk(player)) return;

            var kitty = Globals.ALL_KITTIES[player].Unit;
            var effectInstance = effect.Create(ModelPath, kitty, OriginPoint);

            DestroyCurrentEffect(player);
            ApplyEffect(player, effectInstance);
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
        }
    }

    private void ApplyEffect(player player, effect effectInstance = null)
    {
        var activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
        switch (Type)
        {
            case RewardType.Wings:
                activeRewards.ActiveWings = effectInstance;
                break;

            case RewardType.Hats:
                activeRewards.ActiveHats = effectInstance;
                break;

            case RewardType.Auras:
                activeRewards.ActiveAura = effectInstance;
                break;

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                activeRewards.ActiveTrail = effectInstance;
                break;

            case RewardType.Tournament:
                SetTournamentReward(player, effectInstance, true);
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
    }

    private void DestroyCurrentEffect(player player)
    {
        var activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
        switch (Type)
        {
            case RewardType.Wings:
                var x = activeRewards.ActiveWings;
                GC.RemoveEffect(ref x);
                break;

            case RewardType.Hats:
                var y = activeRewards.ActiveHats;
                GC.RemoveEffect(ref y);
                break;

            case RewardType.Auras:
                var z = activeRewards.ActiveAura;
                GC.RemoveEffect(ref z);
                break;

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                var t = activeRewards.ActiveTrail;
                GC.RemoveEffect(ref t);
                break;

            case RewardType.Tournament:
                SetTournamentReward(player, null, false);
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
    }

    private bool SetWindwalk(player player)
    {
        if (Type != RewardType.Windwalks) return false;
        var kitty = Globals.ALL_KITTIES[player];
        kitty.ActiveAwards.WindwalkID = AbilityID;
        return true;
    }

    private bool SetSkin(player player, bool tournament = false)
    {
        if (Type != RewardType.Skins && tournament == false) return false;

        var kitty = Globals.ALL_KITTIES[player];

        if (SkinID != 0)
        {
            kitty.Unit.Skin = SkinID;
            kitty.KittyMorphosis.ScaleUnit();
            kitty.Name = $"{Colors.PlayerNameColored(player)}";
        }
        else
            Logger.Critical($"Skins ID invalid for {Name}");

        return true;
    }

    private void SetSelectedData(player player)
    {
        if (!Globals.ALL_KITTIES.ContainsKey(player)) return;

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

            case RewardType.Tournament:
                break;

            default:
                Logger.Critical("Error with selected data");
                throw new ArgumentOutOfRangeException(nameof(Type), Type, null);
        }
    }

    private bool SetTournamentReward(player player, effect e, bool activate)
    {
        if (Type != RewardType.Tournament)
            return false;

        var activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
        if (activate)
        {
            if (Name.Contains("Nitro"))
                activeRewards.ActiveTrail = e;
            else if (Name.Contains("Aura"))
                activeRewards.ActiveAura = e;
            else if (Name.Contains("Wings"))
                activeRewards.ActiveWings = e;
            else if (Name.Contains("Skin"))
            {
                SetSkin(player, true);
                Globals.ALL_KITTIES[player].SaveData.SelectedData.SelectedSkin = Name;
            }
            else
            {
                Logger.Warning($"Error: Tournament reward {Name} is not a valid type.");
                return false;
            }
        }
        else
        {
            if (Name.Contains("Nitro"))
                activeRewards.ActiveTrail?.Dispose();
            else if (Name.Contains("Aura"))
                activeRewards.ActiveAura?.Dispose();
            else if (Name.Contains("Wings"))
                activeRewards.ActiveWings?.Dispose();
            else
                return false;
        }

        return true;
    }

    public string SetRewardTypeSorted()
    {
        switch (Type)
        {
            case RewardType.Auras:
                return new Auras().GetType().Name;

            case RewardType.Windwalks:
                return new Windwalks().GetType().Name;

            case RewardType.Skins:
                return new Skins().GetType().Name;

            case RewardType.Trails:
                return new Trails().GetType().Name;

            case RewardType.Deathless:
                return new Deathless().GetType().Name;

            case RewardType.Nitros:
                return new Nitros().GetType().Name;

            case RewardType.Hats:
                return new Hats().GetType().Name;

            case RewardType.Wings:
                return new Wings().GetType().Name;

            default:
                return new Tournament().GetType().Name;
        }
    }

    public string SystemRewardName() => Name.ToString();

    public string GetRewardName() => BlzGetAbilityTooltip(AbilityID, 0);

    public int GetAbilityID() => AbilityID;
}
