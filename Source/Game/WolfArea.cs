﻿using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;

public class WolfArea
{
    public static Dictionary<int, WolfArea> WolfAreas = new Dictionary<int, WolfArea>();
    public static float TotalArea { get; private set; } = 0.0f;
    public int ID { get; set; }
    public rect Rect { get; set; }
    public region Region { get; set; }
    public Rectangle Rectangle { get; set; }
    public float Area { get; set; }
    private trigger Trigger;
    public WolfArea(int areaID, region wolfRegion)
    {
        ID = areaID;
        Region = wolfRegion;
    }

    public static void Initialize()
    {
        int count = 0;
        foreach (var wolfArea in RegionList.WolfRegions)
        {
            var wolfarea = new WolfArea(count, wolfArea.Region);
            wolfarea.Rect = wolfArea.Rect;
            wolfarea.Rectangle = wolfArea;
            wolfarea.CalculateArea();
            wolfarea.EnterWolfAreaEvents();
            wolfarea.LeaveAreaEvents();
            WolfAreas.Add(count, wolfarea);
            count++;
        }
    }

    private void EnterWolfAreaEvents()
    {
        Trigger = trigger.Create();
        Trigger.RegisterEnterRegion(Region, Filter(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY));
        Trigger.AddAction(() =>
        {
            var unit = @event.Unit;
            var player = unit.Owner;
            var progressPointDict = Progress.PlayerProgressPoints;
            if (ID <= 13)
            {
                progressPointDict[player] = Globals.SAFE_ZONES[ID].Rect_;
                Globals.ALL_KITTIES[player].ProgressZone = ID;
            }
            else {
                if (ID == 14) progressPointDict[player] = Regions.ProgressPoint1.Rect;
                if (ID == 15) progressPointDict[player] = Regions.ProgressPoint2.Rect;
                if (ID == 16) progressPointDict[player] = Regions.ProgressPoint3.Rect;
                Globals.ALL_KITTIES[player].ProgressZone = ID;
            }
        });
    }

    /// <summary>
    /// Prevents wolves from leaving the area with wander.
    /// </summary>
    private void LeaveAreaEvents()
    {
        Trigger = trigger.Create();
        Trigger.RegisterLeaveRegion(Region, Filter(() => GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG));
        Trigger.AddAction(() =>
        {
            var wolf = Globals.ALL_WOLVES[@event.Unit];
            wolf.WolfMove();
        });
    }

    private void CalculateArea()
    {
        Area = Rectangle.Width * Rectangle.Height;
        TotalArea += Area;
    }

}
