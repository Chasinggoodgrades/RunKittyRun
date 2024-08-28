using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Safezone
{

    public region Region{ get; set; }
    private trigger Trigger { get; set; }
    public int ID { get; set; }
    public rect r_Rect { get; set; }

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
            safezone.EnterSafezoneEvents();
            safezone.r_Rect = safeZone.Rect;
            count++;
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
        if(currentSafezone != ID) { return; }
        player.Gold += Resources.SafezoneGold;
        unit.Experience += Resources.SafezoneExperience;
        Globals.PLAYER_REACHED_SAFEZONES[player] = ID + 1;
    }

    /// <summary>
    /// Resets progress zones and reached safezones to initial state.
    /// </summary>
    public static void ResetPlayerSafezones()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            Globals.ALL_KITTIES[player].ProgressZone = 0;
            Globals.PLAYER_REACHED_SAFEZONES[player] = 1;
        }
    }
}
