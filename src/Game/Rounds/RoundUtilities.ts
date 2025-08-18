import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { CameraUtil } from 'src/Utility/CameraUtil'
import { MapPlayer } from 'w3ts'

export class RoundUtilities {
    public static MovePlayerToStart(Player: MapPlayer) {
        const kitty = Globals.ALL_KITTIES.get(Player)!
        const x = RegionList.SpawnRegions[Player.id].centerX
        const y = RegionList.SpawnRegions[Player.id].centerY
        kitty.Unit.setPosition(x, y)
        kitty.Unit.facing = 360.0
    }

    public static MoveTeamToStart(team: Team) {
        for (let i = 0; i < team.Teammembers.length; i++) {
            const player = team.Teammembers[i]
            const kitty = (Globals.ALL_KITTIES.get(player)!.Finished = true)
            RoundUtilities.MovePlayerToStart(player)
        }
        team.Finished = true
    }

    public static MoveAllPlayersToStart = () => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
            RoundUtilities.MovePlayerToStart(kitty.Player)
        }
    }

    public static RoundResetAll = () => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
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

    public static MovedTimedCameraToStart = () => {
        const x = RegionList.SpawnRegions[0].centerX
        const y = RegionList.SpawnRegions[0].centerY
        for (const player of Globals.ALL_PLAYERS) {
            if (player.isLocal()) PanCameraToTimed(x, y, Globals.END_ROUND_DELAY)
            CameraUtil.RelockCamera(player)
        }
    }
}
