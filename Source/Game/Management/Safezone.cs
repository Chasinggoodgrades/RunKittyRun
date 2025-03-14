using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public class Safezone
{
    public region Region { get; set; }
    private trigger Trigger { get; set; }
    public int ID { get; set; }
    public rect Rect_ { get; set; }
    public List<player> AwardedPlayers { get; set; }

    public Safezone(int id, region region)
    {
        ID = id;
        Region = region;
        Trigger = trigger.Create();
        AwardedPlayers = new List<player>();
    }

    public static void Initialize()
    {
        var count = 0;
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
        Trigger.RegisterEnterRegion(Region, Filters.KittyFilter);
        Trigger.AddAction(EnterSafezoneActions);
    }

    private void EnterSafezoneActions()
    {
        var unit = @event.Unit;
        var player = unit.Owner;
        SafezoneAdditions(unit);
        Globals.PLAYERS_CURRENT_SAFEZONE[player] = ID;
        WolfLaneHider.LanesHider();
        if (AwardedPlayers.Contains(player) || ID == 0) return;
        Utility.GiveGoldFloatingText(Resources.SafezoneGold, unit);
        unit.Experience += Resources.SafezoneExperience;
        AwardedPlayers.Add(player);
        DeathlessChallenges.DeathlessCheck(player);
    }

    /// <summary>
    /// Runs if the players current safezone isn't the same as their previously touched safezone.
    /// </summary>
    private void SafezoneAdditions(unit Unit)
    {
        var player = Unit.Owner;

        if (Globals.PLAYERS_CURRENT_SAFEZONE[player] == ID) return;

        CameraUtil.UpdateKomotoCam(player, ID);

        if (Gamemode.CurrentGameMode != "Standard") return;

        Globals.ALL_KITTIES[player].Relics.OfType<FangOfShadows>().FirstOrDefault()?.ReduceCooldownAtSafezone(Unit);
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

    /// <summary>
    /// Counts the number of safezones a player has touched.
    /// </summary>
    /// <param name="player"></param>
    /// <returns>int count of the # of safezones reached.</returns>
    public static int CountHitSafezones(player player)
    {
        int count = 0;
        foreach (var safezone in Globals.SAFE_ZONES)
        {
            if (safezone.AwardedPlayers.Contains(player))
                count++;
        }
        return count;
    }
}
