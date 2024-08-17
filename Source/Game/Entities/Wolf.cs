using System;
using System.Collections.Generic;
using System.Numerics;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Wolf
{
    private const int WOLF_MODEL = Constants.UNIT_CUSTOM_DOG;
    private const float WANDER_LOWER_BOUND = 0.70f;
    private const float WANDER_UPPER_BOUND = 0.83f;
    private const string OVERHEAD_EFFECT = "TalkToMe.mdx";

    private int RegionIndex { get; set; }
    private effect OverheadEffect { get; set; }
    private timer WanderTimer { get; set; }
    private rect Lane { get; set; }
    public unit Unit { get; private set; }
    private List<Affix> Affixes { get; set; }

    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        Lane = RegionList.WolfRegions[RegionIndex].Rect;
        Affixes = new List<Affix>();
        InitializeWolf();
        StartWandering();
    }

    private void InitializeWolf()
    {
        var players = new[]
        {
            player.NeutralExtra,
            player.NeutralPassive,
            player.NeutralVictim,
            player.NeutralAggressive
        };

        var randomPlayer = players[GetRandomInt(0, players.Length - 1)];
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);

        Unit = unit.Create(randomPlayer, WOLF_MODEL, randomX, randomY, 360);
        Globals.ALL_WOLVES.Add(this);
        Utility.MakeUnitLocust(Unit);
        Unit.Name = $"Lane: {RegionIndex + 1}";

        WanderTimer = CreateTimer();
    }

    private void WolfMove()
    {
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);
        Unit.IssueOrder("move", randomX, randomY);
    }

    private bool ShouldStartEffect()
    {
        if (Gamemode.CurrentGameMode != "Standard")
            return GetRandomInt(1, 9 - Globals.ROUND) == 1 && (GetRandomInt(1, Globals.ROUND) == 1 || GetRandomInt(1, 3) == 1);
        else
            return GetRandomInt(1, (18 - (Difficulty.DifficultyValue + Globals.ROUND))) == 1 && GetRandomInt(1, Globals.ROUND) == 1;
    }

    private void StartWandering()
    {
        if (ShouldStartEffect())
        {
            ApplyEffect();
        }
        var realTime = GetRandomReal(1.00f, 1.12f);
        TimerStart(WanderTimer, realTime, false, StartWandering);
    }

    private void ApplyEffect()
    {
        var effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);
        OverheadEffect = effect.Create(OVERHEAD_EFFECT, Unit, "overhead");

        var effectTimer = CreateTimer();
        TimerStart(effectTimer, effectDuration, false, () =>
        {
            WolfMove();
            OverheadEffect.Dispose();
            OverheadEffect = null;
            effectTimer.Dispose();
        });
    }

    public void Dispose()
    {
        Unit.Dispose();
        OverheadEffect?.Dispose();
        WanderTimer.Dispose();
    }

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
        }
    }
    public static void RemoveAllWolves()
    {
        foreach (var wolf in Globals.ALL_WOLVES)
            wolf.Dispose();

        Globals.ALL_WOLVES.Clear();
    }

    #region AFFIXES
    public void AddAffix(Affix affix)
    {
        Affixes.Add(affix);
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

    public bool IsAffixed()
    {
        return Affixes.Count > 0;
    }

    public int AffixCount()
    {
        return Affixes.Count;
    }
    #endregion
}
