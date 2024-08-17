using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public class WolfArea
{
    public int ID { get; set; }
    public rect WolfRect { get; set; }
    public region WolfRegion { get; set; }
    private trigger Trigger;
    public WolfArea(int areaID, region wolfRegion)
    {
        ID = areaID;
        WolfRegion = wolfRegion;
    }

    public static void Initialize()
    {
        int count = 0;
        foreach (var wolfArea in RegionList.WolfRegions)
        {
            var wolfarea = new WolfArea(count, wolfArea.Region);
            wolfarea.WolfRect = wolfArea.Rect;
            wolfarea.EnterWolfAreaEvents();
            count++;
        }
    }

    private void EnterWolfAreaEvents()
    {
        Trigger = CreateTrigger();
        TriggerRegisterEnterRegion(Trigger, WolfRegion, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        TriggerAddAction(Trigger, () =>
        {
            var unit = GetTriggerUnit();
            var player = GetOwningPlayer(unit);
            var progressPointDict = Progress.PlayerProgressPoints;
            if (ID <= 13)
            {
                progressPointDict[player] = Globals.SAFE_ZONES[ID].r_Rect;
                Globals.ALL_KITTIES[player].ProgressZone = ID;
            }
            if (ID == 14) progressPointDict[player] = Regions.ProgressPoint1.Rect;
            if (ID == 15) progressPointDict[player] = Regions.ProgressPoint2.Rect;
            if (ID == 16) progressPointDict[player] = Regions.ProgressPoint3.Rect;
        });
    }
}
