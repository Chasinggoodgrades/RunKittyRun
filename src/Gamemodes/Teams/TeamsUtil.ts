export class TeamsUtil {
    public static RoundResetAllTeams() {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        for (let team in Globals.ALL_TEAMS) team.Value.Finished = false
    }

    public static CheckTeamDead(k: Kitty) {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        let team = Globals.ALL_TEAMS[k.TeamID]
        for (let i: number = 0; i < team.Teammembers.length; i++) {
            if (Globals.ALL_KITTIES[team.Teammembers[i]].Alive) return
        }
        team.TeamIsDeadActions()
    }

    public static UpdateTeamsMB() {
        let t = timer.Create()
        t.start(
            0.1,
            false,
            ErrorHandler.Wrap(() => {
                TeamsMultiboard.UpdateCurrentTeamsMB()
                TeamsMultiboard.UpdateTeamStatsMB()
                t.Dispose()
            })
        )
    }
}
