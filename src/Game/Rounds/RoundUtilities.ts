export class RoundUtilities {
    public static MovePlayerToStart(Player: MapPlayer) {
        let kitty = Globals.ALL_KITTIES.get(Player)!
        let x = RegionList.SpawnRegions[Player.id].centerX
        let y = RegionList.SpawnRegions[Player.id].centerY
        kitty.Unit.setPosition(x, y)
        kitty.Unit.facing = 360.0
    }

    public static MoveTeamToStart(team: Team) {
        for (let i: number = 0; i < team.Teammembers.length; i++) {
            let player = team.Teammembers[i]
            let kitty = (Globals.ALL_KITTIES.get(player)!.Finished = true)
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
                RegionList.SpawnRegions[kitty.Value.Player.id].centerX,
                RegionList.SpawnRegions[kitty.Value.Player.id].centerY,
                false
            )
            Globals.ALL_CIRCLES[kitty.Value.Player].HideCircle()
            kitty.Value.isAlive() = true
            kitty.Value.ProgressZone = 0
            kitty.Value.Finished = false
            kitty.Value.Unit.mana = kitty.Value.Unit.maxMana
            kitty.Value.CurrentStats.ResetRoundData()
        }
    }

    public static MovedTimedCameraToStart() {
        let x = RegionList.SpawnRegions[0].centerX
        let y = RegionList.SpawnRegions[0].centerY
        for (let player of Globals.ALL_PLAYERS) {
            if (player.isLocal()) PanCameraToTimed(x, y, RoundManager.END_ROUND_DELAY)
            CameraUtil.RelockCamera(player)
        }
    }
}
