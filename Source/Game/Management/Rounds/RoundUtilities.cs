using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundUtilities
{
    public static void MovePlayerToStart(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        var x = RegionList.SpawnRegions[Player.Id].Center.X;
        var y = RegionList.SpawnRegions[Player.Id].Center.Y;
        kitty.Unit.SetPosition(x, y);
        kitty.Unit.Facing = 360.0f;
    }

    public static void MoveTeamToStart(Team team)
    {
        foreach (var player in team.Teammembers)
        {
            MovePlayerToStart(player);
        }
    }

    public static void MoveAllPlayersToStart()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            MovePlayerToStart(kitty.Player);
        }
    }

    public static void RoundResetAll()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            kitty.Unit.Revive(RegionList.SpawnRegions[kitty.Player.Id].Center.X, RegionList.SpawnRegions[kitty.Player.Id].Center.Y, false);
            Globals.ALL_CIRCLES[kitty.Player].HideCircle();
            kitty.Alive = true;
            kitty.ProgressZone = 0;
            kitty.Progress = 0.0f;
            kitty.Finished = false;
            kitty.Unit.Mana = kitty.Unit.MaxMana;
            kitty.CurrentStats.RoundSaves = 0;
            kitty.CurrentStats.RoundDeaths = 0;
        }
    }

    public static void MovedTimedCameraToStart()
    {
        var x = RegionList.SpawnRegions[0].Center.X;
        var y = RegionList.SpawnRegions[0].Center.Y;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if (player == GetLocalPlayer()) PanCameraToTimed(x, y, RoundManager.END_ROUND_DELAY);
        }
    }
}
