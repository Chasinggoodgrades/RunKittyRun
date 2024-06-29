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
    public player p;
    public unit u;


    public Kitty(player p)
    {
        this.p = p;
        effect.Create("Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl", RegionList.SpawnRegions[p.Id].Center.X, RegionList.SpawnRegions[p.Id].Center.Y);
        Globals.KittyIDs.Add(this);
        timer t = CreateTimer();
        TimerStart(t, 0.25f, false, () =>
        {
            CreateKitty(p);
            t.Dispose();
        });
    }

    private void CreateKitty (player p)
    {
        this.u = unit.Create(p, KITTY_HERO_TYPE, RegionList.SpawnRegions[p.Id].Center.X, RegionList.SpawnRegions[p.Id].Center.Y, 360);
    }

}
