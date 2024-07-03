using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public class Circle
{
    private const int CIRCLE_UNIT_MODEL = Constants.UNIT_KITTY_CIRCLE;
    private static rect CIRCLE_SPAWN_REGION = Regions.Circle_Area.Rect;
    private int ID {  get; set; }
    public player Player { get; set; }
    public unit Unit { get; set; }
    public trigger Collision { get; set; }

    public Circle(player player)
    {
        Player = player;
        ID = player.Id;
        Collision = CreateTrigger();
        CreateCircle();
    }

    private void CreateCircle()
    {
        Unit = unit.Create(Player, CIRCLE_UNIT_MODEL, CIRCLE_SPAWN_REGION.CenterX, CIRCLE_SPAWN_REGION.CenterY);
        Utility.MakeUnitLocust(Unit);
        Globals.ALL_CIRCLES.Add(Player, this);
        ShowUnit(Unit, false);
    }

    public void KittyDied(Kitty kitty)
    {
        Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
        ShowCircle();
    }

    public void HideCircle()
    {
        ShowUnit(Unit, false);
    }

    private void ShowCircle()
    {
        ShowUnit(Unit, true);
    }


}
