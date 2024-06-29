using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

namespace Source.Game
{
    public class Wolf
    {
        private const int WOLF_MODEL = Constants.UNIT_CUSTOM_DOG;
        private const float WANDER_LOWER_BOUND = 0.80f;
        private const float WANDER_UPPER_BOUND = 0.85f;
        private const string OVERHEAD_EFFECT = "Abilities\\Spells\\Other\\TalkToMe\\TalkToMe.mdl";

        public int RegionIndex { get; private set; }
        private unit Unit {  get; set; }
        private effect OverheadEffect { get; set; }
        private timer WanderTimer { get; set; }

        public Wolf(int regionIndex)
        {
            RegionIndex = regionIndex;
            InitializeWolf();
            Wander();
        }

        private void InitializeWolf()
        {
            var player = Player(GetRandomInt(21, 24));
            var randomX = GetRandomReal(RegionList.WolfRegions[RegionIndex].Rect.MinX, RegionList.WolfRegions[RegionIndex].Rect.MaxX);
            var randomY = GetRandomReal(RegionList.WolfRegions[RegionIndex].Rect.MinY, RegionList.WolfRegions[RegionIndex].Rect.MaxY);

            Unit = unit.Create(player, WOLF_MODEL, randomX, randomY, 360);
            Globals.ALL_WOLVES.Add(Unit);
            Unit.Name = $"Lane: {RegionIndex + 1}";

            WanderTimer = CreateTimer();
        }

        private void WolfMove()
        {
            var randomX = GetRandomReal(RegionList.WolfRegions[RegionIndex].Rect.MinX, RegionList.WolfRegions[RegionIndex].Rect.MaxX);
            var randomY = GetRandomReal(RegionList.WolfRegions[RegionIndex].Rect.MinY, RegionList.WolfRegions[RegionIndex].Rect.MaxY);
            Unit.IssueOrder("move", (float)randomX, (float)randomY);
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

                TimerStart(t, (float)effectDuration, false, () =>
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

}