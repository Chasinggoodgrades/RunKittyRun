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
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            MovePlayerToStart(kitty.Value.Player);
        }
    }

    public static void RoundResetAll()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            kitty.Value.Unit.Revive(RegionList.SpawnRegions[kitty.Value.Player.Id].Center.X, RegionList.SpawnRegions[kitty.Value.Player.Id].Center.Y, false);
            Globals.ALL_CIRCLES[kitty.Value.Player].HideCircle();
            kitty.Value.Alive = true;
            kitty.Value.ProgressZone = 0;
            kitty.Value.Finished = false;
            kitty.Value.Unit.Mana = kitty.Value.Unit.MaxMana;
            kitty.Value.CurrentStats.ResetRoundData();
        }
    }

    public static void MovedTimedCameraToStart()
    {
        var x = RegionList.SpawnRegions[0].Center.X;
        var y = RegionList.SpawnRegions[0].Center.Y;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if (player.IsLocal) PanCameraToTimed(x, y, RoundManager.END_ROUND_DELAY);
            CameraUtil.RelockCamera(player);
        }
    }
}
