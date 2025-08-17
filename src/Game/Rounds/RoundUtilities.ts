import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { CameraUtil } from 'src/Utility/CameraUtil'
import { MapPlayer } from 'w3ts'
import { RoundManager } from './RoundManager'

export class RoundUtilities {
    public static MovePlayerToStart(Player: MapPlayer) {
        let kitty = Globals.ALL_KITTIES.get(Player)!
        let x = RegionList.SpawnRegions[Player.id].centerX
        let y = RegionList.SpawnRegions[Player.id].centerY
        kitty.Unit.setPosition(x, y)
        kitty.Unit.facing = 360.0
    }

    public static MoveTeamToStart(team: Team) {
        for (let i = 0; i < team.Teammembers.length; i++) {
            let player = team.Teammembers[i]
            let kitty = (Globals.ALL_KITTIES.get(player)!.Finished = true)
            this.MovePlayerToStart(player)
        }
        team.Finished = true
    }

    public static MoveAllPlayersToStart() {
        for (let [_, kitty] of Globals.ALL_KITTIES) {
            this.MovePlayerToStart(kitty.Player)
        }
    }

    public static RoundResetAll() {
        for (let [_, kitty] of Globals.ALL_KITTIES) {
            kitty.Unit.revive(
                RegionList.SpawnRegions[kitty.Player.id].centerX,
                RegionList.SpawnRegions[kitty.Player.id].centerY,
                false
            )
            Globals.ALL_CIRCLES.get(kitty.Player)?.HideCircle()
            kitty.Alive = true
            kitty.ProgressZone = 0
            kitty.Finished = false
            kitty.Unit.mana = kitty.Unit.maxMana
            kitty.CurrentStats.ResetRoundData()
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
