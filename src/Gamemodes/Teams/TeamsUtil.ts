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
