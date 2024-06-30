using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public class Kitty
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    public player Player { get; }
    public unit Unit { get; set; }
    private effect Effect { get; set; }
    public int Saves { get; set; }
    public int Deaths { get; set; }

    public Kitty(player player)
    {
        Player = player;
        Saves = 0;
        Deaths = 0;

        SpawnEffect();
        DelayCreateKitty();
    }
    private void DelayCreateKitty()
    {
        timer t = CreateTimer();
        var delayTime = 2.0f;
        TimerStart(t, delayTime, false, () =>
        {
            CreateKitty();
            t.Dispose();
            Effect.Dispose();
        });
    }
    private void SpawnEffect()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Effect = effect.Create(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
    }
    private void CreateKitty()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Unit = unit.Create(Player, KITTY_HERO_TYPE, spawnCenter.X, spawnCenter.Y, 360);
        Globals.ALL_KITTIES.Add(Player, this);
        Utility.MakeUnitLocust(Unit);

    }
    public static void BeginSpawning()
    {
        var t = CreateTimer();
        TimerStart(t, 3.0f, false, () =>
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                new Kitty(player);
                t.Dispose();
            }
        });
    }

}
