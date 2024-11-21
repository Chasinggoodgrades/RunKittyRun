using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Safezone
{
    public region Region{ get; set; }
    private trigger Trigger { get; set; }
    public int ID { get; set; }
    public rect Rect_ { get; set; }
    public List<player> AwardedPlayers { get; set; }

    public Safezone(int id, region region) { 
        ID = id;
        Region = region;
        Trigger = trigger.Create();
        AwardedPlayers = new List<player>();
    }

    public static void Initialize()
    {
        int count = 0;
        foreach (var safeZone in RegionList.SafeZones)
        {
            var safezone = new Safezone(count, safeZone.Region);
            Globals.SAFE_ZONES.Add(safezone);
            safezone.EnterSafezoneEvents();
            safezone.Rect_ = safeZone.Rect;
            count++;
        }
        FinalSafezone.Initialize();
    }

    private void EnterSafezoneEvents()
    {
        Trigger.RegisterEnterRegion(Region, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        Trigger.AddAction(EnterSafezoneActions);
    }

    private void EnterSafezoneActions()
    {
        var unit = @event.Unit;
        var player = unit.Owner;
        Globals.PLAYERS_CURRENT_SAFEZONE[player] = ID;
        if (AwardedPlayers.Contains(player) || ID == 0) return;
        player.Gold += Resources.SafezoneGold;
        unit.Experience += Resources.SafezoneExperience;
        AwardedPlayers.Add(player);
        Deathless.DeathlessCheck(player);
    }

    /// <summary>
    /// Resets progress zones and reached safezones to initial state.
    /// </summary>
    public static void ResetPlayerSafezones()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Globals.PLAYERS_CURRENT_SAFEZONE[player] = 0;
            Globals.ALL_KITTIES[player].ProgressZone = 0;
        }
        foreach (var safezone in Globals.SAFE_ZONES)
        {
            safezone.AwardedPlayers.Clear();
        }
    }
}
