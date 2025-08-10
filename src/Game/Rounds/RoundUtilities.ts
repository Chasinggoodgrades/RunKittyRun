class RoundUtilities {
    public static MovePlayerToStart(Player: player) {
        let kitty = Globals.ALL_KITTIES[Player]
        let x = RegionList.SpawnRegions[Player.Id].Center.X
        let y = RegionList.SpawnRegions[Player.Id].Center.Y
        kitty.Unit.SetPosition(x, y)
        kitty.Unit.Facing = 360.0
    }

    public static MoveTeamToStart(team: Team) {
        for (let i: number = 0; i < team.Teammembers.Count; i++) {
            let player = team.Teammembers[i]
            let kitty = (Globals.ALL_KITTIES[player].Finished = true)
            MovePlayerToStart(player)
        }
        team.Finished = true
    }

    public static MoveAllPlayersToStart() {
        for (let kitty in Globals.ALL_KITTIES) {
            MovePlayerToStart(kitty.Value.Player)
        }
    }

    public static RoundResetAll() {
        for (let kitty in Globals.ALL_KITTIES) {
            kitty.Value.Unit.Revive(
                RegionList.SpawnRegions[kitty.Value.Player.Id].Center.X,
                RegionList.SpawnRegions[kitty.Value.Player.Id].Center.Y,
                false
            )
            Globals.ALL_CIRCLES[kitty.Value.Player].HideCircle()
            kitty.Value.Alive = true
            kitty.Value.ProgressZone = 0
            kitty.Value.Finished = false
            kitty.Value.Unit.Mana = kitty.Value.Unit.MaxMana
            kitty.Value.CurrentStats.ResetRoundData()
        }
    }

    public static MovedTimedCameraToStart() {
        let x = RegionList.SpawnRegions[0].Center.X
        let y = RegionList.SpawnRegions[0].Center.Y
        for (let player in Globals.ALL_PLAYERS) {
            if (player.IsLocal) PanCameraToTimed(x, y, RoundManager.END_ROUND_DELAY)
            CameraUtil.RelockCamera(player)
        }
    }
}
