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
    private effect Effect { get; set; }
    public player Player { get; }
    public unit Unit { get; set; }
    public int TeamID { get; set; } = 0;
    public int Saves { get; set; }
    public int Deaths { get; set; }
    public bool Alive { get; set; } = true;
    public trigger w_Collision { get; set; }
    public trigger c_Collision { get; set; }

    public Kitty(player player)
    {
        Player = player;
        Saves = 0;
        Deaths = 0;
        w_Collision = CreateTrigger();
        c_Collision = CreateTrigger();
        SpawnEffect();
        DelayCreateKitty();
    }

    public static void Initialize()
    {

        foreach (var player in Globals.ALL_PLAYERS)
        {
            new Kitty(player);
            new Circle(player);
        }
    }
    private void DelayCreateKitty()
    {
        timer t = CreateTimer();
        var delayTime = 2.0f;
        TimerStart(t, delayTime, false, () =>
        {
            CreateKitty();
            Effect.Dispose();
            t.Dispose();
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
        Utility.MakeUnitLocust(Unit);
        Globals.ALL_KITTIES.Add(Player, this);
        CollisionDetection.KittyRegisterCollisions(this);
    }

    public void Dispose()
    {
        Unit.Dispose();
        w_Collision.Dispose();
        c_Collision.Dispose();
    }

    public void ReviveKitty(Kitty savior)
    {
        var circle = Globals.ALL_CIRCLES[Player];
        circle.HideCircle();
        Unit.Revive(Unit.X, Unit.Y, false);
        Alive = true;
        Utility.SelectUnitForPlayer(Player, Unit);
        savior.Saves += 1;
        savior.Unit.Experience += 50;
    }

    public void KillKitty()
    {
        var circle = Globals.ALL_CIRCLES[Player];
        Unit.Kill();
        Alive = false;
        Deaths += 1;
        circle.KittyDied(this);

    }

}
