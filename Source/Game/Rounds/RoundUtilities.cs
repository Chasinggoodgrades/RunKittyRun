using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RoundUtilities
{
    public static void MovePlayerToStart(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        var x = RegionList.SpawnRegions[Player.Id].Center.X;
        var y = RegionList.SpawnRegions[Player.Id].Center.Y;
        kitty.Unit.X = x;
        kitty.Unit.Y = y;
        kitty.Unit.Facing = 359.000f;
    }

    public static void MoveTeamToStart(Team team)
    {
        for (int i = 0; i < team.Teammembers.Count; i++)
        {
            var kitty = team.Teammembers[i];
            kitty.Finished = true;
            MovePlayerToStart(kitty.Player);
        }
        team.Finished = true;
    }

    public static void MoveAllPlayersToStart()
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            MovePlayerToStart(kitty.Player);
        }
    }

    public static void RoundResetAll()
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            kitty.Unit.Revive(RegionList.SpawnRegions[kitty.Player.Id].Center.X, RegionList.SpawnRegions[kitty.Player.Id].Center.Y, false);
            kitty.Circle.HideCircle();
            kitty.Alive = true;
            kitty.ProgressZone = 0;
            kitty.Finished = false;
            kitty.Unit.Mana = kitty.Unit.MaxMana;
            kitty.CurrentStats.ResetRoundData();
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
