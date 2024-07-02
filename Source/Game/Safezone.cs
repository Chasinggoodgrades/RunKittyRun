using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public class Safezone
{
    private int ID { get; set; }
    private region Region{ get; set; }
    private trigger Trigger { get; set; }

    public Safezone(int id, region region) { 
        ID = id;
        Region = region;
        Trigger = CreateTrigger();
    }

    public static void Initialize()
    {
        int count = 0;
        foreach (var safeZone in RegionList.SafeZones)
        {
            var safezone = new Safezone(count, safeZone.Region);
            Globals.SAFE_ZONES.Add(safezone);
            count++;
        }
        foreach (var safeZone in Globals.SAFE_ZONES)
        {
            safeZone.EnterSafezoneEvents();
        }
    }

    private void EnterSafezoneEvents()
    {
        TriggerRegisterEnterRegion(Trigger, Region, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        TriggerAddAction(Trigger, EnterSafezoneActions);
    }

    private void EnterSafezoneActions()
    {
        var unit = GetTriggerUnit();
        var player = GetOwningPlayer(unit);
        var currentSafezone = Globals.PLAYER_REACHED_SAFEZONES[player];
        if(Source.Program.Debug) Console.WriteLine(player.Name + " entered safezone " + ID + " from safezone " + currentSafezone);
        if(currentSafezone != ID)
        {
            return;
        }
        player.Gold += 20;
        unit.Experience += 150;
        Globals.PLAYER_REACHED_SAFEZONES[player] = ID + 1;
    }

    public static void ResetPlayerSafezones()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            Globals.PLAYER_REACHED_SAFEZONES[player] = 1;
        }
    }
}
