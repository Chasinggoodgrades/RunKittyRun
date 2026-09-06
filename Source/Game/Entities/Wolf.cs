using Source.Init;
using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Wolf
{
    #region Constants

    public const string DefaultOverheadEffect = "TalkToMe.mdx";

    private const float WanderReactionMin = 0.70f;
    private const float WanderReactionMax = 0.83f;
    private const float NextWanderDelay = 1.9f;
    private const float InitialWanderMin = 2.0f;
    private const float InitialWanderMax = 4.5f;
    private const float WanderIntervalMin = 1.00f;
    private const float WanderIntervalMax = 1.12f;

    // Tournament probability tuning
    private const float TournamentBaseChance = 8.0f;
    private const float TournamentTeamBonusPerPlayer = 1.25f;
    private const float TournamentIncreasePerRound = 2.0f;
    private const float TournamentMaxProbability = 22.5f;
    private const float TournamentRandomAdjustmentMax = 4.0f;

    #endregion

    #region Static Members

    public static int WolfModel { get; set; } = Constants.UNIT_CUSTOM_DOG;
    public static int CurrentSkin { get; set; } = Constants.UNIT_CUSTOM_DOG;
    public static bool DisableEffects { get; set; }

    #endregion

    #region Instance Fields & Properties

    private readonly Action _cachedWander;
    private readonly Action _cachedEffect;

    public int RegionIndex { get; }
    public string OverheadEffectPath { get; set; } = DefaultOverheadEffect;

    public AchesTimers WanderTimer { get; set; } = ObjectPool<AchesTimers>.GetEmptyObject();
    public AchesTimers EffectTimer { get; set; }

    public texttag Texttag { get; set; }
    public Disco Disco { get; set; }
    public WolfArea WolfArea { get; }
    public unit Unit { get; set; }
    public List<Affix> Affixes { get; } = new();
    public WolfPoint WolfPoint { get; set; }

    public bool IsPaused { get; set; }
    public bool IsReviving { get; set; }
    public bool IsWalking { get; set; }

    private effect _overheadEffect;

    #endregion

    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        WolfArea = WolfArea.WolfAreas[regionIndex];
        Affixes = new List<Affix>(); // Consider creating a new object that contains List<Affix> so we're not making a new one each wolf.
        OverheadEffectPath = DefaultOverheadEffect;
        WolfPoint = new WolfPoint(this); // Consider changing this to be a part of the memory handler. Remove the parameter

        _cachedWander = () => StartWandering();
        _cachedEffect = () => WolfMoveCancelEffect();

        InitializeWolf();
        WanderTimer.Timer.Start(GetRandomReal(InitialWanderMin, InitialWanderMax), false, _cachedWander);
        Globals.ALL_WOLVES.Add(Unit, this);
        Globals.ALL_WOLVES_LIST.Add(this);

        WolfArea.Wolves.Add(this);
    }

    /// <summary>
    /// Spawns wolves based on round and lane according to <see cref="WolfWaveConfig"/>.
    /// Progressive mode uses its own accelerating 3-round curve; every other
    /// difficulty uses the standard 5-round table.
    /// </summary>
    public static void SpawnWolves()
    {
        try
        {
            var wave = WolfWaveConfig.GetWaveForRound(Globals.ROUND);
            if (wave != null)
            {
                for (int lane = 0; lane < wave.Length; lane++)
                {
                    int numberOfWolves = wave[lane];

                    for (int i = 0; i < numberOfWolves; i++)
                        new Wolf(lane);
                }
                FandF.CreateBloodWolf();
                NamedWolves.CreateNamedWolves();
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in Wolf.SpawnWolves: {e.Message}");
            throw;
        }
    }

    public static void SetSkin(int skinType)
    {
        CurrentSkin = skinType != 0 ? skinType : Constants.UNIT_CUSTOM_DOG;
        foreach (var wolf in Globals.ALL_WOLVES_LIST)
        {
            wolf.Unit.Skin = CurrentSkin;
        }
    }

    public void StartWandering(bool forced = false)
    {
        var realTime = GetRandomReal(WanderIntervalMin, WanderIntervalMax);
        if ((ShouldStartEffect() || forced) && (!IsPaused && !IsReviving) && (this != NamedWolves.StanWolf))
        {
            ApplyEffect();
            realTime = NextWanderDelay; // Gives a brief delay before the wolf has a chance to move again.
        }
        WanderTimer?.Timer?.Start(realTime, false, _cachedWander);
    }

    /// <summary>
    /// Wolf moves to a random location within its lane.
    /// </summary>
    public void WolfMove(bool forced = false)
    {
        if (IsPaused || IsReviving) return;
        if (HasAffix("Blitzer")) return;
        var rect = WolfArea.Rect;
        WolfPoint.DiagonalRegionCreate(Unit.X, Unit.Y, GetRandomReal(rect.MinX, rect.MaxX), GetRandomReal(rect.MinY, rect.MaxY));
    }

    public void Dispose()
    {
        RemoveAllWolfAffixes();
        EffectTimer?.Dispose();
        EffectTimer = null;
        _overheadEffect?.Dispose();
        _overheadEffect = null;
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
    public static void RemoveAllWolves()
    {
        foreach (var wolf in Globals.ALL_WOLVES_LIST)
        {
            wolf?.Dispose();
        }
        Globals.ALL_WOLVES.Clear();
        Globals.ALL_WOLVES_LIST.Clear();
    }

    /// <summary>
    /// Pauses or resumes all wolves in the game.
    /// </summary>
    /// <param name="pause"></param>
    public static void PauseAllWolves(bool pause)
    {
        foreach (var wolf in Globals.ALL_WOLVES_LIST)
        {
            wolf?.PauseSelf(pause);
        }
    }

    public static void PauseSelectedWolf(unit selectedUnit, bool pause)
    {
        if (!Globals.ALL_WOLVES.TryGetValue(selectedUnit, out var wolf)) return;
        wolf.PauseSelf(pause);
    }

    public void PauseSelf(bool pause)
    {
        try
        {
            if (pause)
            {
                WanderTimer?.Pause();
                EffectTimer?.Pause();
                for (int i = 0; i < Affixes.Count; i++)
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
                for (int i = 0; i < Affixes.Count; i++)
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
        catch (Exception e)
        {
            Logger.Warning($"Error in Wolf.PauseSelf: {e.Message}");
        }
    }

    private void InitializeWolf()
    {
        var selectedPlayer = Setup.getNextWolfPlayer();

        var randomX = GetRandomReal(WolfArea.Rect.MinX, WolfArea.Rect.MaxX);
        var randomY = GetRandomReal(WolfArea.Rect.MinY, WolfArea.Rect.MaxY);
        var facing = GetRandomReal(0, 360);

        Unit ??= unit.Create(selectedPlayer, WolfModel, randomX, randomY, facing);
        Unit.Skin = CurrentSkin;
        Utility.MakeUnitLocust(Unit);
        Unit.Name = $"Lane: {RegionIndex + 1}";
        if (NamedWolves.StanWolf != this) Unit.IsInvulnerable = true;
        Unit.SetColor(ConvertPlayerColor(24));
        Unit.SetPathing(false);

        if (Source.Program.Debug) selectedPlayer.SetAlliance(Player(0), alliancetype.SharedControl, true);
    }

    private bool ShouldStartEffect()
    {
        return Gamemode.CurrentGameMode != GameMode.Standard
            ? TournamentChance()
            : GetRandomInt(1, 18 - (DifficultyConfig.GetEffectiveDifficultyValue() + Globals.ROUND)) == 1;
    }

    private bool TournamentChance()
    {
        var playersPerTeam = Math.Min(Gamemode.PlayersPerTeam, 6);
        float baseChance = Gamemode.CurrentGameMode == GameMode.Team ? TournamentBaseChance + (TournamentTeamBonusPerPlayer * playersPerTeam) : TournamentBaseChance;
        float increasePerRound = TournamentIncreasePerRound;
        float maxProbability = TournamentMaxProbability;

        int currentRound = Globals.ROUND;

        float linearProbability = baseChance + (increasePerRound * (currentRound - 1));
        float randomAdjustment = GetRandomReal(0, TournamentRandomAdjustmentMax); // Random adjustment between 0 and 4%
        float totalProbability = linearProbability + randomAdjustment;

        // Cap the probability to the maximum limit
        totalProbability = Math.Min(totalProbability, maxProbability);
        return GetRandomReal(0, 100) <= totalProbability;
    }

    private void ApplyEffect()
    {
        var effectDuration = GetRandomReal(WanderReactionMin, WanderReactionMax);

        _overheadEffect ??= effect.Create(OverheadEffectPath, Unit, "overhead");
        BlzPlaySpecialEffect(_overheadEffect, animtype.Stand);

        EffectTimer ??= ObjectPool<AchesTimers>.GetEmptyObject();
        EffectTimer?.Timer?.Start(effectDuration, false, _cachedEffect);
    }

    private void WolfMoveCancelEffect()
    {
        WolfMove();
        BlzPlaySpecialEffect(_overheadEffect, animtype.Death);
        if (IsAffixed())
        {
            _overheadEffect.Dispose();
            _overheadEffect = null;
        }
    }

    #region AFFIXES

    public void AddAffix(Affix affix)
    {
        Affixes.Add(affix);
        AffixFactory.AllAffixes.Add(affix);
        affix.Apply();
    }

    public void RemoveAffix(Affix affix)
    {
        Affixes.Remove(affix);
        affix.Remove();
        AffixFactory.AllAffixes.Remove(affix);

    }

    public void RemoveAffix(string affixName)
    {
        for (int i = 0; i < Affixes.Count; i++)
        {
            if (Affixes[i].TypeName == affixName)
            {
                RemoveAffix(Affixes[i]);
                break;
            }
        }
    }

    public bool HasAffix(string affixName)
    {
        if (Affixes.Count == 0) return false;
        for (int i = 0; i < Affixes.Count; i++)
            if (Affixes[i].TypeName == affixName) return true;

        return false;
    }

    public void RemoveAllWolfAffixes()
    {
        if (AffixCount() == 0) return;

        try
        {
            for (int i = Affixes.Count - 1; i >= 0; i--)
            {
                Affixes[i].Remove();
                AffixFactory.AllAffixes.Remove(Affixes[i]);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in RemoveAllWolfAffixes: {e.Message}");
        }

        Affixes.Clear();
    }

    public bool IsAffixed() => Affixes.Count > 0;

    public int AffixCount() => Affixes.Count;

    #endregion AFFIXES
}
