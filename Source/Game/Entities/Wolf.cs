using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Wolf
{
    public static int WOLF_MODEL { get; set; } = Constants.UNIT_CUSTOM_DOG;
    public const string DEFAULT_OVERHEAD_EFFECT = "TalkToMe.mdx";
    private const float WANDER_LOWER_BOUND = 0.70f; // reaction time lower bound
    private const float WANDER_UPPER_BOUND = 0.83f; // reaction time upper bound

    public int RegionIndex { get; set; }
    public string OVERHEAD_EFFECT_PATH { get; set; }
    public timer WanderTimer { get; set; }
    public rect Lane { get; private set; }
    public unit Unit { get; private set; }
    public List<Affix> Affixes { get; private set; }
    private effect OverheadEffect { get; set; }
    private WolfPoint WolfPoint { get; set; }

    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        Lane = RegionList.WolfRegions[RegionIndex].Rect;
        Affixes = new List<Affix>();
        OVERHEAD_EFFECT_PATH = DEFAULT_OVERHEAD_EFFECT;
        WolfPoint = new WolfPoint(this);
        InitializeWolf();
        StartWandering();
    }

    private void InitializeWolf()
    {
        var players = new[]
        {
            player.NeutralExtra, player.NeutralPassive,
            player.NeutralVictim, player.NeutralAggressive
        };

        var randomPlayer = players[GetRandomInt(0, players.Length - 1)];
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);
        var facing = GetRandomReal(0, 360);

        Unit = unit.Create(randomPlayer, WOLF_MODEL, randomX, randomY, facing);
        Globals.ALL_WOLVES.Add(Unit, this);
        Utility.MakeUnitLocust(Unit);
        Unit.Name = $"Lane: {RegionIndex + 1}";

        WanderTimer = timer.Create();
    }

    /// <summary>
    /// Wolf moves to a random location within its lane.
    /// </summary>
    public (float x, float y) WolfMove()
    {
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);
        //if (!HasAffix("Blitzer"))
        Unit.IssueOrder("move", randomX, randomY);
        //WolfPoint.CreateRegionsBetweenPoints((Unit.X, Unit.Y), (randomX, randomY));
        return (randomX, randomY);
    }

    private bool ShouldStartEffect()
    {
        if (Gamemode.CurrentGameMode != "Standard")
            return GetRandomInt(1, 9 - Globals.ROUND) == 1 && (GetRandomInt(1, Globals.ROUND) == 1 || GetRandomInt(1, 3) == 1);
        else
            return GetRandomInt(1, 18 - (Difficulty.DifficultyValue + Globals.ROUND)) == 1 && ImpossibleChance();
    }

    private bool ImpossibleChance()
    {
        // Actually has 0 meaning currently, but something to play with.
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return true;
        if (Globals.ROUND <= 3) return true;
        if (GetRandomInt(1, 1) == 1) return true;
        return false;
    }

    public void StartWandering(bool forced = false)
    {
        var realTime = GetRandomReal(1.00f, 1.12f);
        if (ShouldStartEffect() || forced)
        {
            ApplyEffect();
            realTime = 2.0f; // Gives a brief delay before the wolf has a chance to move again.
        }
        WanderTimer.Start(realTime, false, () => StartWandering());
    }

    private void ApplyEffect()
    {
        var effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);
        OverheadEffect?.Dispose();
        OverheadEffect = effect.Create(OVERHEAD_EFFECT_PATH, Unit, "overhead");

        var effectTimer = timer.Create();
        effectTimer.Start(effectDuration, false, () =>
        {
            WolfMove();
            OverheadEffect.Dispose();
            effectTimer.Dispose();
        });
    }

    public void Dispose()
    {
        Unit.Dispose();
        OverheadEffect?.Dispose();
        WanderTimer.Dispose();
        RemoveAllWolfAffixes();
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
                    new Wolf(lane);
            }
            FandF.CreateBloodWolf();
        }
    }
    /// <summary>
    /// Removes all wolves from the game and clears wolf list.
    /// </summary>
    public static void RemoveAllWolves()
    {
        foreach (var wolf in Globals.ALL_WOLVES.Keys)
            wolf.Dispose();

        Globals.ALL_WOLVES.Clear();
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
    }

    public bool HasAffix(string affixName)
    {
        foreach (var affix in Affixes)
            if (affix.GetType().Name == affixName) return true;
        return false;
    }

    public void RemoveAllWolfAffixes()
    {
        if(AffixCount() == 0) return;
        foreach (var affix in Affixes)
        {
            affix.Remove();
            AffixFactory.AllAffixes.Remove(affix);
        }
        Affixes.Clear();
    }

    public bool IsAffixed() => Affixes.Count > 0;
    public int AffixCount() => Affixes.Count;
    #endregion
}
