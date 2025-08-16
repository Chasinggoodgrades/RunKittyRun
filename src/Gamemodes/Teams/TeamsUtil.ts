import { Globals } from 'src/Global/Globals'
import { CurrentGameMode } from '../CurrentGameMode'
import { GameMode } from '../GameModeEnum'

export class TeamsUtil {
    public static RoundResetAllTeams() {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        for (let [_, team] of Globals.ALL_TEAMS) team.Finished = false
    }
}
