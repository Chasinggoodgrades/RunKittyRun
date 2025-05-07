using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using WCSharp.Api;

public class Safezone
{
    public region Region { get; set; }
    private trigger Trigger { get; set; }
    public int ID { get; set; }
    public rect Rect_ { get; set; }
    public WCSharp.Shared.Data.Rectangle Rectangle { get; set; }
    public List<player> AwardedPlayers { get; set; } = new();

    public Safezone(int id, region region)
    {
        ID = id;
        Region = region;
        Trigger = trigger.Create();
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
            safezone.Rectangle = safeZone;
            count++;
        }
        FinalSafezone.Initialize();
    }

    private void EnterSafezoneEvents()
    {
        Trigger.RegisterEnterRegion(Region, FilterList.KittyFilter);
        Trigger.AddAction(EnterSafezoneActions);
    }

    private void EnterSafezoneActions()
    {
        try
        {
            var unit = @event.Unit;
            if (WolfEntersSafezoneActions(unit)) return;
            var player = unit.Owner;
            var kitty = Globals.ALL_KITTIES[player];
            SafezoneAdditions(kitty);
            kitty.CurrentSafeZone = ID;
            WolfLaneHider.LanesHider();
            if (AwardedPlayers.Contains(player) || ID == 0) return;
            Utility.GiveGoldFloatingText(Resources.SafezoneGold, unit);
            unit.Experience += Resources.SafezoneExperience;
            AwardedPlayers.Add(player);
            DeathlessChallenges.DeathlessCheck(kitty);
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in EnterSafezoneActions: {e.Message}");
        }
    }

    /// <summary>
    /// Runs if the players current safezone isn't the same as their previously touched safezone.
    /// </summary>
    private void SafezoneAdditions(Kitty kitty)
    {
        var player = kitty.Player;

        if (kitty.CurrentSafeZone == ID) return;

        CameraUtil.UpdateKomotoCam(player, ID);

        if (Gamemode.CurrentGameMode != "Standard") return;

        for (int i = 0; i < kitty.Relics.Count; i++)
        {
            var relic = kitty.Relics[i];
            if (relic is FangOfShadows)
            {
                FangOfShadows fangOfShadows = (FangOfShadows)relic;
                fangOfShadows.ReduceCooldownAtSafezone(kitty.Unit);
                break;
            }
        }
    }

    /// <summary>
    /// Resets progress zones and reached safezones to initial state.
    /// </summary>
    public static void ResetPlayerSafezones()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            kitty.Value.CurrentSafeZone = 0;
            kitty.Value.ProgressZone = 0;
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

    /// <summary>
    /// If the unit type is a wolf, it'll tell the wolf to MOVE back to its wolf area.
    /// Primary purpose is to make it so "wander" wolves dont get into the safezones.
    /// </summary>
    /// <param name="unit"></param>
    /// <returns>bool [true/false] if unit type is infact a wolf</returns>
    public static bool WolfEntersSafezoneActions(unit unit)
    {
        if (unit.UnitType != Wolf.WOLF_MODEL) return false;
        var wolf = Globals.ALL_WOLVES[unit];
        wolf.WolfMove(true); // forced move
        return true;
    }
}
