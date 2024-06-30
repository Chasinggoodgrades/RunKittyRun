using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public class Wolf
{
    private const int WOLF_MODEL = Constants.UNIT_CUSTOM_DOG;
    private const float WANDER_LOWER_BOUND = 0.80f;
    private const float WANDER_UPPER_BOUND = 0.85f;
    private const float WOLF_COLLISION_RADIUS = 75.0f;
    private const string OVERHEAD_EFFECT = "Abilities\\Spells\\Other\\TalkToMe\\TalkToMe.mdl";


    private int RegionIndex { get; set; }
    private unit Unit {  get; set; }
    private effect OverheadEffect { get; set; }
    private timer WanderTimer { get; set; }
    private rect Lane { get; set; }
    private trigger Collision { get; set; }

    public Wolf(int regionIndex)
    {
        RegionIndex = regionIndex;
        Lane = RegionList.WolfRegions[RegionIndex].Rect;
        Collision = CreateTrigger();
        InitializeWolf();
        Wander();
    }

    private void InitializeWolf()
    {
        var player = Player(((RegionIndex) % 3) + 22);
        var randomX = GetRandomReal(Lane.MinX, Lane.MaxX);
        var randomY = GetRandomReal(Lane.MinY, Lane.MaxY);

        Unit = unit.Create(player, WOLF_MODEL, randomX, randomY, 360);
        Globals.ALL_WOLVES.Add(Unit);
        Utility.MakeUnitLocust(Unit);
        Unit.Name = $"Lane: {RegionIndex + 1}";

        WanderTimer = CreateTimer();
        CollisionDetection();
    }

    private void CollisionDetection()
    {
        TriggerRegisterUnitInRange(Collision, Unit, WOLF_COLLISION_RADIUS, Filter (() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        TriggerAddAction(Collision, () =>
        {
            var kitty = GetFilterUnit();
            var player = GetOwningPlayer(kitty);

            Console.WriteLine("Wolf collided with " + player.Name);
            Globals.ALL_KITTIES[player].Deaths++;
        });
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
        DestroyTimer(WanderTimer);
        DestroyTrigger(Collision);
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
}