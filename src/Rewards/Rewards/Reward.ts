

/// <summary>
/// Reward Class and Enums
/// * Enums are the different types of rewards. They help designate which category the reward should be in.
/// * The Reward class simply helps define what the Reward is ; ie name, ability, model.. etc.
/// </summary>
public RewardType: enum
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

class Reward
{
    public Name: string 
    public AbilityID: number 
    public OriginPoint: string  = "";
    public ModelPath: string  = "";
    public SkinID: number 
    public Type: RewardType 
    public TypeSorted: string 
    public GameStat: string 
    public GameStatValue: number 

    public Reward(name: string, abilityID: number, originPoint: string, modelPath: string, type: RewardType)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
    }

    public Reward(name: string, abilityID: number, skinID: number, type: RewardType)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
    }

    public Reward(name: string, abilityID: number, skinID: number, type: RewardType, gameStat: string, gameStatValue: number)
    {
        Name = name;
        AbilityID = abilityID;
        SkinID = skinID;
        Type = type;
        GameStat = gameStat;
        GameStatValue = gameStatValue;
        RewardsManager.GameStatRewards.Add(this);
    }

    public Reward(name: string, abilityID: number, originPoint: string, modelPath: string, type: RewardType, gameStat: string, gameStatValue: number)
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
    /// If the <param name="setData"/> parameter is true, it also alters the saved data. // TODO; Cleanup:     /// If the <paramref name="setData"/> parameter is true, it also alters the saved data.
    /// </summary>
    /// <param name="player">The player object to which the reward will be applied.</param>
    /// <param name="setData">Indicates whether to alter the saved data while setting the player's rewards. Default is true.</param>
    public ApplyReward(player: player, setData: boolean = true)
    {
        if (setData) SetSelectedData(player);
        SetEffect(player);
        if (setData) player.DisplayTimedTextTo(3.0, "{Colors.COLOR_RED}Applied:|r {GetRewardName()} {Colors.COLOR_ORANGE}[{Type.ToString()}]");
    }

    private SetEffect(player: player)
    {
        try
        {
            if (!Globals.ALL_KITTIES.ContainsKey(player)) return;

            if (SetSkin(player)) return;
            if (SetWindwalk(player)) return;

            let kitty = Globals.ALL_KITTIES[player].Unit;
            let effectInstance = effect.Create(ModelPath, kitty, OriginPoint);

            DestroyCurrentEffect(player);
            ApplyEffect(player, effectInstance);
        }
        catch (e: Error)
        {
            Logger.Warning(e.Message);
        }
    }

    private ApplyEffect(player: player, effectInstance: effect = null)
    {
        let activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
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
                throw new ArgumentOutOfRangeError(nameof(Type), Type, null);
        }
    }

    private DestroyCurrentEffect(player: player)
    {
        let activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
        switch (Type)
        {
            case RewardType.Wings:
                let x = activeRewards.ActiveWings;
                GC.RemoveEffect( x); // TODO; Cleanup:                 GC.RemoveEffect(ref x);
                break;

            case RewardType.Hats:
                let y = activeRewards.ActiveHats;
                GC.RemoveEffect( y); // TODO; Cleanup:                 GC.RemoveEffect(ref y);
                break;

            case RewardType.Auras:
                let z = activeRewards.ActiveAura;
                GC.RemoveEffect( z); // TODO; Cleanup:                 GC.RemoveEffect(ref z);
                break;

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                let t = activeRewards.ActiveTrail;
                GC.RemoveEffect( t); // TODO; Cleanup:                 GC.RemoveEffect(ref t);
                break;

            case RewardType.Tournament:
                SetTournamentReward(player, null, false);
                break;

            default:
                throw new ArgumentOutOfRangeError(nameof(Type), Type, null);
        }
    }

    private SetWindwalk(player: player)
    {
        if (Type != RewardType.Windwalks) return false;
        let kitty = Globals.ALL_KITTIES[player];
        kitty.ActiveAwards.WindwalkID = AbilityID;
        return true;
    }

    private SetSkin(player: player, tournament: boolean = false)
    {
        if (Type != RewardType.Skins && tournament == false) return false;

        let kitty = Globals.ALL_KITTIES[player];

        if (SkinID != 0)
        {
            kitty.Unit.Skin = SkinID;
            kitty.KittyMorphosis.ScaleUnit();
            kitty.Unit.Name = "{Colors.PlayerNameColored(player)}";
        }
        else
            Logger.Critical("ID: invalid: for: Skins {Name}");

        return true;
    }

    private SetSelectedData(player: player)
    {
        if (!Globals.ALL_KITTIES.ContainsKey(player)) return;

        let saveData = Globals.ALL_KITTIES[player].SaveData;

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
                Logger.Critical("with: selected: data: Error");
                throw new ArgumentOutOfRangeError(nameof(Type), Type, null);
        }
    }

    private SetTournamentReward(player: player, e: effect, activate: boolean)
    {
        if (Type != RewardType.Tournament)
            return false;

        let activeRewards = Globals.ALL_KITTIES[player].ActiveAwards;
        if (activate)
        {
            if (Name.Contains("Nitro"))
                activeRewards.ActiveTrail = e;
            let if: else (Name.Contains("Aura"))
                activeRewards.ActiveAura = e;
            let if: else (Name.Contains("Wings"))
                activeRewards.ActiveWings = e;
            let if: else (Name.Contains("Skin"))
            {
                SetSkin(player, true);
                Globals.ALL_KITTIES[player].SaveData.SelectedData.SelectedSkin = Name;
            }
            else
            {
                Logger.Warning("Error: reward: Tournament {Name} is a: valid: type: not.");
                return false;
            }
        }
        else
        {
            if (Name.Contains("Nitro"))
                activeRewards.ActiveTrail?.Dispose();
            let if: else (Name.Contains("Aura"))
                activeRewards.ActiveAura?.Dispose();
            let if: else (Name.Contains("Wings"))
                activeRewards.ActiveWings?.Dispose();
            else
                return false;
        }

        return true;
    }

    public SetRewardTypeSorted(): string
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

    public SystemRewardName(): string  { return Name.ToString(); }

    public GetRewardName(): string  { return BlzGetAbilityTooltip(AbilityID, 0); }

    public GetAbilityID(): number  { return AbilityID; }
}
