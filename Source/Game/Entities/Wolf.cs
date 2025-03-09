using Source.Init;
using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Wolf
{
    public const string DEFAULT_OVERHEAD_EFFECT = "TalkToMe.mdx";
    public static int WOLF_MODEL { get; set; } = Constants.UNIT_CUSTOM_DOG;
    private const float WANDER_LOWER_BOUND = 0.70f; // reaction time lower bound
    private const float WANDER_UPPER_BOUND = 0.83f; // reaction time upper bound
    private const float NEXT_WANDER_DELAY = 1.9f; // time before wolf can move again

    public int RegionIndex { get; set; }

    public string OVERHEAD_EFFECT_PATH { get; set; }

    public timer WanderTimer { get; set; }

    private timer EffectTimer { get; set; }

    public rect Lane { get; private set; }

    public unit Unit { get; set; }

    public List<Affix> Affixes { get; private set; }

    private effect OverheadEffect { get; set; }

    public WolfPoint WolfPoint { get; set; }

    public bool IsPaused { get; set; } = false;

    public bool IsReviving { get; set; } = false;


    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        Lane = RegionList.WolfRegions[RegionIndex].Rect;
        Affixes = new List<Affix>();
        OVERHEAD_EFFECT_PATH = DEFAULT_OVERHEAD_EFFECT;
        WolfPoint = new WolfPoint(this);
        InitializeWolf();
        Utility.SimpleTimer(3.0f, () => StartWandering());
        Globals.ALL_WOLVES.Add(Unit, this);

        if (WolfArea.WolfAreas.TryGetValue(regionIndex, out var wolfArea))
        {
            wolfArea.Wolves.Add(this);
        }
    }

    /// <summary>
    /// Spawns wolves based on round and lane according to the Globals.WolvesPerRound dictionary.
    /// </summary>
    public static void SpawnWolves()
    {
        if (Globals.WolvesPerRound.TryGetValue(Globals.ROUND, out var wolvesInRound))
        {
            foreach (var laneEntry in wolvesInRound)
            {
                int lane = laneEntry.Key;
                int numberOfWolves = laneEntry.Value;

                for (int i = 0; i < numberOfWolves; i++)
                    _ = new Wolf(lane);
            }
            //WolfSpawning.SpawnWolves();
            FandF.CreateBloodWolf();
            NamedWolves.CreateNamedWolves();
        }
    }

    public void StartWandering(bool forced = false)
    {
        var realTime = GetRandomReal(1.00f, 1.12f);
        if ((ShouldStartEffect() || forced) && (!IsPaused || !IsReviving))
        {
            ApplyEffect();
            realTime = NEXT_WANDER_DELAY; // Gives a brief delay before the wolf has a chance to move again.
        }
        WanderTimer.Start(realTime, false, () => StartWandering());
    }

    /// <summary>
    /// Wolf moves to a random location within its lane.
    /// </summary>
    public void WolfMove()
    {
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);
        if (HasAffix("Blitzer")) return;
        WolfPoint.DiagonalRegionCreate(Unit.X, Unit.Y, randomX, randomY);
    }

    public void Dispose()
    {
        RemoveAllWolfAffixes();
        EffectTimer.Dispose();
        EffectTimer = null;
        OverheadEffect?.Dispose();
        OverheadEffect = null;
        WanderTimer.Dispose();
        WanderTimer = null;
        WolfPoint.Dispose();
        WolfPoint = null;
        Unit.Dispose();
        Unit = null;
    }

    /// <summary>
    /// Removes all wolves from the game and clears wolf list.
    /// </summary>
    public static void RemoveAllWolves()
    {
        foreach (var wolfKey in Globals.ALL_WOLVES.Keys.ToList())
        {
            Globals.ALL_WOLVES[wolfKey].Dispose();
            Globals.ALL_WOLVES[wolfKey] = null;
        }
        Globals.ALL_WOLVES.Clear();
    }

    /// <summary>
    /// Pauses or resumes all wolves in the game.
    /// </summary>
    /// <param name="pause"></param>
    public static void PauseAllWolves(bool pause)
    {
        if (pause)
        {
            foreach (var wolf in Globals.ALL_WOLVES)
            {
                wolf.Value.WanderTimer.Pause();
                wolf.Value.Unit.SetPausedEx(pause);
            }
        }
        else
        {
            foreach (var wolf in Globals.ALL_WOLVES)
            {
                wolf.Value.WanderTimer.Resume();
                wolf.Value.Unit.SetPausedEx(pause);
            }
        }
    }

    private void InitializeWolf()
    {
        var selectedPlayer = Setup.getNextWolfPlayer();

        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);
        var facing = GetRandomReal(0, 360);

        Unit = unit.Create(selectedPlayer, WOLF_MODEL, randomX, randomY, facing);
        Utility.MakeUnitLocust(Unit);
        Unit.Name = $"Lane: {RegionIndex + 1}";
        Unit.IsInvulnerable = true;
        Unit.SetColor(ConvertPlayerColor(24));

        WanderTimer = timer.Create();
        EffectTimer = timer.Create();
    }

    private bool ShouldStartEffect()
    {
        return Gamemode.CurrentGameMode != "Standard"
            ? TournamentChance()
            : GetRandomInt(1, 18 - (Difficulty.DifficultyValue + Globals.ROUND)) == 1;
    }

    private bool TournamentChance()
    {
        var baseChance = 14.0f;
        var increasePerRound = 2.0f;
        var maxProbability = 22.5f;

        var currentRound = Globals.ROUND;
        if (currentRound < 1 || currentRound > 5)
            throw new ArgumentOutOfRangeException(nameof(currentRound), "Round must be between 1 and 5.");

        var linearProbability = baseChance + (increasePerRound * (currentRound - 1));
        var randomAdjustment = (float)GetRandomReal(0, 4); // Random adjustment between 0 and 4%
        var totalProbability = linearProbability + randomAdjustment;

        // Cap the probability to the maximum limit
        totalProbability = Math.Min(totalProbability, maxProbability);
        //Console.WriteLine($"{totalProbability}%");
        return GetRandomReal(0, 100) <= totalProbability;
    }

    private void ApplyEffect()
    {
        var effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);
        OverheadEffect?.Dispose();
        OverheadEffect = effect.Create(OVERHEAD_EFFECT_PATH, Unit, "overhead");

        EffectTimer.Start(effectDuration, false, () =>
        {
            WolfMove();
            OverheadEffect.Dispose();
            OverheadEffect = null;
        });
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
        _ = Affixes.Remove(affix);
        affix.Remove();
        _ = AffixFactory.AllAffixes.Remove(affix);
    }

    public void RemoveAffix(string affixName)
    {
        var affixToRemove = Affixes.FirstOrDefault(a => a.GetType().Name == affixName);
        if (affixToRemove != null)
        {
            RemoveAffix(affixToRemove);
        }
    }

    public bool HasAffix(string affixName)
    {
        if (Affixes.Count == 0) return false;
        foreach (var affix in Affixes)
            if (affix.GetType().Name == affixName) return true;
        return false;
    }

    public void RemoveAllWolfAffixes()
    {
        if (AffixCount() == 0) return;
        foreach (var affix in Affixes)
        {
            _ = AffixFactory.AllAffixes.Remove(affix);
            affix.Remove();
        }
        Affixes.Clear();
    }

    public bool IsAffixed() => Affixes.Count > 0;
    public int AffixCount() => Affixes.Count;
    #endregion
}
