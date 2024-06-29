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

        public int regionIndex;
        private unit u;
        private effect e;
        private timer t;

        public Wolf(int regionIndex)
        {
            this.regionIndex = regionIndex;

            var randomInt = GetRandomInt(21, 24);
            var p = Player(randomInt);
            var randomX = GetRandomReal(RegionList.WolfRegions[regionIndex].Rect.MinX, RegionList.WolfRegions[regionIndex].Rect.MaxX);
            var randomY = GetRandomReal(RegionList.WolfRegions[regionIndex].Rect.MinY, RegionList.WolfRegions[regionIndex].Rect.MaxY);
            
            u = unit.Create(p, WOLF_MODEL, randomX, randomY, 360);
            Globals.ALL_WOLVES.Add(u);
            u.Name = "Lane: " + regionIndex+1;
            
            t = CreateTimer();
            Wander();
        }

        private void WolfMove()
        {
            var randomX = GetRandomReal(RegionList.WolfRegions[regionIndex].Rect.MinX, RegionList.WolfRegions[regionIndex].Rect.MaxX);
            var randomY = GetRandomReal(RegionList.WolfRegions[regionIndex].Rect.MinY, RegionList.WolfRegions[regionIndex].Rect.MaxY);
            u.IssueOrder("move", (float)randomX, (float)randomY);
        }

        private void Wander()
        {
            var moveInt = GetRandomInt(0, (9 - Globals.ROUND));
            var effectDuration = GetRandomReal(WANDER_LOWER_BOUND, WANDER_UPPER_BOUND);
            var moveWhileActive = GetRandomInt(1, Globals.ROUND);

            if (moveInt == 1 && moveWhileActive == 1)
            {
                timer tEffect = CreateTimer();
                e = effect.Create(OVERHEAD_EFFECT, this.u, "overhead");
                TimerStart(tEffect, (float)effectDuration, false, () =>
                {
                    WolfMove();
                    e.Dispose();
                    tEffect.Dispose();
                });
            }
            TimerStart(this.t, 1.05f, false, () =>
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
            else
                Console.WriteLine("Peek Wolves.SpawnWolves()");
        }
    }

}