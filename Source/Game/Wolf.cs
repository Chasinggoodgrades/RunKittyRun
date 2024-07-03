using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Shared.Extensions;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public class Wolf
{
    private const int WOLF_MODEL = Constants.UNIT_CUSTOM_DOG;
    private const float WANDER_LOWER_BOUND = 0.80f;
    private const float WANDER_UPPER_BOUND = 0.85f;
    private const string OVERHEAD_EFFECT = "Abilities\\Spells\\Other\\TalkToMe\\TalkToMe.mdl";

    private int RegionIndex { get; set; }
    private effect OverheadEffect { get; set; }
    private timer WanderTimer { get; set; }
    private rect Lane { get; set; }
    public unit Unit { get; private set; }
    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        Lane = RegionList.WolfRegions[RegionIndex].Rect;
        InitializeWolf();
        Wander();
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

    private bool StartEffect()
    {
        return GetRandomInt(0, 9 - Globals.ROUND) == 1 && GetRandomInt(1, Globals.ROUND) == 1;
    }

    private void Wander()
    {
        if (StartEffect())
        {
            var effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);
            timer t = CreateTimer();
            OverheadEffect = effect.Create(OVERHEAD_EFFECT, Unit, "overhead");

            TimerStart(t, effectDuration, false, () =>
            {
                WolfMove();
                OverheadEffect.Dispose();
                t.Dispose();
            });
        }
        TimerStart(WanderTimer, 1.05f, false, () =>
        {
            Wander();
        });
    }
    public void Dispose()
    {
        Unit.Dispose();
        OverheadEffect.Dispose();
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
}