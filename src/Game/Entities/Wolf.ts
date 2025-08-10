

class Wolf
{
    public DEFAULT_OVERHEAD_EFFECT: string = "TalkToMe.mdx";
    public static WOLF_MODEL: number = Constants.UNIT_CUSTOM_DOG;
    public static DisableEffects: boolean = false;
    private WANDER_LOWER_BOUND: number = 0.70; // reaction time lower bound
    private WANDER_UPPER_BOUND: number = 0.83; // reaction time upper bound
    private NEXT_WANDER_DELAY: number = 1.9; // time before wolf can move again

    private readonly _cachedWander: Action;
    private readonly _cachedEffect: Action;

    public RegionIndex: number 
    public OVERHEAD_EFFECT_PATH: string 
    public WanderTimer: AchesTimers = ObjectPool.GetEmptyObject<AchesTimers>();

    public EffectTimer: AchesTimers 

    public Texttag: texttag 
    public Disco: Disco 
    public WolfArea: WolfArea 
    public Unit: unit 
    public List<Affix> Affixes 
    private OverheadEffect: effect 
    // private effect RandomEffect // some random cool event - can do later on (roar, stomps, whatever)
    public WolfPoint: WolfPoint 
    public IsPaused: boolean = false;
    public IsReviving: boolean = false;
    public IsWalking: boolean = false;

    public Wolf(regionIndex: number)
    {
        RegionIndex = regionIndex;
        WolfArea = WolfArea.WolfAreas[regionIndex];
        Affixes = new List<Affix>(); // Consider creating a new object that contains List<Affix> so we're not making a new one each wolf.
        OVERHEAD_EFFECT_PATH = DEFAULT_OVERHEAD_EFFECT;
        WolfPoint = new WolfPoint(this); // Consider changing this to be a part of the memory handler. Remove the parameter

        _cachedWander = () => StartWandering();
        _cachedEffect = () => WolfMoveCancelEffect();

        InitializeWolf();
        WanderTimer.Timer.Start(GetRandomReal(2.0, 4.5), false, _cachedWander);
        Globals.ALL_WOLVES.Add(Unit, this);

        WolfArea.Wolves.Add(this);
    }

    /// <summary>
    /// Spawns wolves based on round and lane according to the Globals.WolvesPerRound dictionary.
    /// </summary>
    public static SpawnWolves()
    {
        try
        {
            if (wolvesInRound = Globals.WolvesPerRound.TryGetValue(Globals.ROUND) /* TODO; Prepend: let */)
            {
                for (let laneEntry in wolvesInRound)
                {
                    let lane: number = laneEntry.Key;
                    let numberOfWolves: number = laneEntry.Value;

                    for (let i: number = 0; i < numberOfWolves; i++)
                        new Wolf(lane);
                }
                FandF.CreateBloodWolf();
                NamedWolves.CreateNamedWolves();
            }
        }
        catch (e: Error)
        {
            Logger.Critical("Error in Wolf.SpawnWolves: {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    public StartWandering(forced: boolean = false)
    {
        let realTime = GetRandomReal(1.00, 1.12);
        if ((ShouldStartEffect() || forced) && (!IsPaused && !IsReviving) && (this != NamedWolves.StanWolf))
        {
            ApplyEffect();
            realTime = NEXT_WANDER_DELAY; // Gives a brief delay before the wolf has a chance to move again.
        }
        WanderTimer?.Timer?.Start(realTime, false, _cachedWander);
    }

    /// <summary>
    /// Wolf moves to a random location within its lane.
    /// </summary>
    public WolfMove(forced: boolean = false)
    {
        if (IsPaused || IsReviving) return;
        if (HasAffix("Blitzer")) return;
        if (IsPaused && HasAffix("Bomber")) return;
        WolfPoint.DiagonalRegionCreate(Unit.X, Unit.Y, GetRandomReal(WolfArea.Rect.MinX, WolfArea.Rect.MaxX), GetRandomReal(WolfArea.Rect.MinY, WolfArea.Rect.MaxY));
    }

    public Dispose()
    {
        RemoveAllWolfAffixes();
        EffectTimer?.Dispose();
        EffectTimer = null;
        OverheadEffect?.Dispose();
        OverheadEffect = null;
        WanderTimer?.Dispose();
        WanderTimer = null;
        Texttag?.Dispose();
        Texttag = null;
        WolfArea.Wolves.Remove(this);
        Disco?.Dispose();
        WolfPoint?.Dispose();
        WolfPoint = null;
        Unit?.Dispose();
        Unit = null;
    }

    /// <summary>
    /// Removes all wolves from the game and clears wolf list.
    /// </summary>
    public static RemoveAllWolves()
    {
        for (let wolfKey in Globals.ALL_WOLVES)
        {
            Globals.ALL_WOLVES[wolfKey.Key]?.Dispose();
        }
        Globals.ALL_WOLVES.Clear();
    }

    /// <summary>
    /// Pauses or resumes all wolves in the game.
    /// </summary>
    /// <param name="pause"></param>
    public static PauseAllWolves(pause: boolean)
    {
        for (let wolf in Globals.ALL_WOLVES)
        {
            wolf.Value.PauseSelf(pause);
        }
    }

    public static PauseSelectedWolf(selectedUnit: unit, pause: boolean)
    {
        if (!(wolf = Globals.ALL_WOLVES.TryGetValue(selectedUnit)) /* TODO; Prepend: let */) return;
        wolf.PauseSelf(pause);
    }

    public PauseSelf(pause: boolean)
    {
        try
        {
            if (pause)
            {
                WanderTimer?.Pause();
                EffectTimer?.Pause();
                for (let i: number = 0; i < Affixes.Count; i++)
                {
                    Affixes[i].Pause(true);
                }
                Unit?.ClearOrders();
                IsWalking = false;
                IsPaused = true;
                Unit.IsPaused = true; // Wander Wolf
            }
            else
            {
                for (let i: number = 0; i < Affixes.Count; i++)
                {
                    Affixes[i].Pause(false);
                }
                WanderTimer?.Resume();
                if (EffectTimer != null && EffectTimer.Timer.Remaining > 0) EffectTimer.Resume();
                IsWalking = true;
                IsPaused = false;
                Unit.IsPaused = false;
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in Wolf.PauseSelf: {e.Message}");
        }
    }

    private InitializeWolf()
    {
        let selectedPlayer = Setup.getNextWolfPlayer();

        let randomX = GetRandomReal(WolfArea.Rect.MinX, WolfArea.Rect.MaxX);
        let randomY = GetRandomReal(WolfArea.Rect.MinY, WolfArea.Rect.MaxY);
        let facing = GetRandomReal(0, 360);

        Unit ??= unit.Create(selectedPlayer, WOLF_MODEL, randomX, randomY, facing);
        Utility.MakeUnitLocust(Unit);
        Unit.Name = "Lane: {RegionIndex + 1}";
        Unit.IsInvulnerable = true;
        Unit.SetColor(ConvertPlayerColor(24));

        if (Source.Program.Debug) selectedPlayer.SetAlliance(Player(0), alliancetype.SharedControl, true);
    }

    private ShouldStartEffect(): boolean
    {
        return Gamemode.CurrentGameMode != GameMode.Standard
            ? TournamentChance()
            : GetRandomInt(1, 18 - (Difficulty.DifficultyValue + Globals.ROUND)) == 1;
    }

    private TournamentChance(): boolean
    {
        let baseChance = 14.0;
        let increasePerRound = 2.0;
        let maxProbability = 22.5;

        let currentRound = Globals.ROUND;
        if (currentRound < 1 || currentRound > 5)
            return false;

        let linearProbability = baseChance + (increasePerRound * (currentRound - 1));
        let randomAdjustment = GetRandomReal(0, 4); // Random adjustment between 0 and 4%
        let totalProbability = linearProbability + randomAdjustment;

        // Cap the probability to the maximum limit
        totalProbability = Math.Min(totalProbability, maxProbability);
        return GetRandomReal(0, 100) <= totalProbability;
    }

    private ApplyEffect()
    {
        let effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);

        OverheadEffect ??= effect.Create(OVERHEAD_EFFECT_PATH, Unit, "overhead");
        BlzPlaySpecialEffect(OverheadEffect, animtype.Stand);

        EffectTimer ??= ObjectPool.GetEmptyObject<AchesTimers>();
        EffectTimer?.Timer?.Start(effectDuration, false, _cachedEffect);
    }

    private WolfMoveCancelEffect()
    {
        WolfMove();
        BlzPlaySpecialEffect(OverheadEffect, animtype.Death);
        if (IsAffixed())
        {
            OverheadEffect.Dispose();
            OverheadEffect = null;
        }
    }

    // #region AFFIXES

    public AddAffix(affix: Affix)
    {
        Affixes.Add(affix);
        AffixFactory.AllAffixes.Add(affix);
        affix.Apply();
    }

    public RemoveAffix(affix: Affix)
    {
        Affixes.Remove(affix);
        affix.Remove();
        AffixFactory.AllAffixes.Remove(affix);

    }

    public RemoveAffix(affixName: string)
    {
        for (let i: number = 0; i < Affixes.Count; i++)
        {
            if (Affixes[i].GetType().Name == affixName)
            {
                RemoveAffix(Affixes[i]);
                break;
            }
        }
    }

    public HasAffix(affixName: string)
    {
        if (Affixes.Count == 0) return false;
        for (let i: number = 0; i < Affixes.Count; i++)
            if (Affixes[i].GetType().Name == affixName) return true;

        return false;
    }

    public RemoveAllWolfAffixes()
    {
        if (AffixCount() == 0) return;

        try
        {
            for (let i: number = Affixes.Count - 1; i >= 0; i--)
            {
                Affixes[i].Remove();
                AffixFactory.AllAffixes.Remove(Affixes[i]);
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in RemoveAllWolfAffixes: {e.Message}");
        }

        Affixes.Clear();
    }

    public IsAffixed(): boolean  { return Affixes.Count > 0; }

    public AffixCount(): number  { return Affixes.Count; }

    // #endregion AFFIXES
}
