import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { TeamsMultiboard } from 'src/UI/Multiboard/TeamsMultiboard'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Timer } from 'w3ts'
import { CurrentGameMode } from '../CurrentGameMode'
import { GameMode } from '../GameModeEnum'

export class TeamsUtil {
    public static RoundResetAllTeams() {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        for (let [_, team] of Globals.ALL_TEAMS) team.Finished = false
    }

    public static CheckTeamDead(k: Kitty) {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        let team = Globals.ALL_TEAMS.get(k.TeamID)!
        for (let i: number = 0; i < team.Teammembers.length; i++) {
            if (Globals.ALL_KITTIES.get(team.Teammembers[i])!.isAlive()) return
        }
        team.TeamIsDeadActions()
    }

    public static UpdateTeamsMB() {
        let t = Timer.create()
        t.start(
            0.1,
            false,
            ErrorHandler.Wrap(() => {
                TeamsMultiboard.UpdateCurrentTeamsMB()
                TeamsMultiboard.UpdateTeamStatsMB()
                t.destroy()
            })
        )
    }
}
