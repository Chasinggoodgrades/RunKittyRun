class TeamsMultiboard {
    private static CurrentTeamsMB: multiboard
    private static TeamsStatsMB: multiboard
    private static ESCTrigger: trigger

    public static Initialize() {
        try {
            if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
            ESCTrigger ??= CreateTrigger()
            TeamsMultiboardInit()
            ESCInit()
        } catch (e: Error) {
            Logger.Critical('Error in TeamsMultiboard.Initialize: {e.Message}')
            throw e
        }
    }

    private static TeamsMultiboardInit() {
        TeamsStatsMultiboard()
        CurrentTeamsMultiboard()
    }

    // #region Teams Multiboards

    private static TeamsStatsMultiboard() {
        TeamsStatsMB ??= multiboard.Create()
        TeamsStatsMB.Title =
            'Stats: Teams {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        TeamsStatsMB.IsDisplayed = false
    }

    public static CurrentTeamsMultiboard() {
        CurrentTeamsMB ??= multiboard.Create()
        CurrentTeamsMB.Title =
            'Teams: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        CurrentTeamsMB.IsDisplayed = true
        CurrentTeamsMB.Rows = Globals.ALL_TEAMS.Count + 1
        CurrentTeamsMB.Columns = Gamemode.PlayersPerTeam
        CurrentTeamsMB.GetItem(0, 0).SetText('1: Team')
        CurrentTeamsMB.GetItem(0, 0).SetVisibility(true, false)
        CurrentTeamsMB.GetItem(0, 1).SetText('1: Player')
        CurrentTeamsMB.GetItem(0, 1).SetVisibility(true, false)
    }

    public static UpdateTeamStatsMB() {
        // Top Portion Setup
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        TeamsStatsMB.Rows = Globals.ALL_TEAMS_LIST.Count + 1
        TeamsStatsMB.Columns = 3 + Gamemode.NumberOfRounds
        TeamsStatsMB.GetItem(0, 0).SetText('Team')
        TeamsStatsMB.GetItem(0, 0).SetVisibility(true, false)
        TeamsStatsMB.GetItem(0, 0).SetWidth(0.05)
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) {
            if (Globals.ROUND == i) TeamsStatsMB.GetItem(0, i).SetText('|c0000FF00Round {i}|r')
            else TeamsStatsMB.GetItem(0, i).SetText('Round {i}')
            TeamsStatsMB.GetItem(0, i).SetVisibility(true, false)
            TeamsStatsMB.GetItem(0, i).SetWidth(0.05)
        }
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetText(Colors.COLOR_GOLD + 'Overall')
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetVisibility(true, false)
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetWidth(0.05)
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetText(Colors.COLOR_GOLD + 'Time')
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetVisibility(true, false)
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetWidth(0.05)

        // Actual Stats
        let rowIndex: number = 1
        let overallProgress: number
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.Count; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            overallProgress = 0.0
            TeamsStatsMB.GetItem(rowIndex, 0).SetText(team.TeamColor)
            TeamsStatsMB.GetItem(rowIndex, 0).SetVisibility(true, false)
            TeamsStatsMB.GetItem(rowIndex, 0).SetWidth(0.05)
            // Each Round Progress
            for (let j: number = 1; j <= Gamemode.NumberOfRounds; j++) {
                TeamsStatsMB.GetItem(rowIndex, j).SetText('_')
                TeamsStatsMB.GetItem(rowIndex, j).SetText('{team.RoundProgress[j]}%')
                TeamsStatsMB.GetItem(rowIndex, j).SetVisibility(true, false)
                TeamsStatsMB.GetItem(rowIndex, j).SetWidth(0.05)
            }
            // Overall Progress
            for (let j: number = 1; j <= Gamemode.NumberOfRounds; j++) {
                overallProgress = overallProgress + float.Parse(team.RoundProgress[j], CultureInfo.InvariantCulture) // possibly bad?
            }
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetText(
                (overallProgress / Gamemode.NumberOfRounds).ToString('F2') + '%'
            )
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetVisibility(true, false)
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetWidth(0.05)

            // Overall Time
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetText(
                Utility.ConvertFloatToTime(GameTimer.TeamTotalTime(team), team.TeamID)
            )
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetVisibility(true, false)
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetWidth(0.05)
            rowIndex++
        }
    }

    public static UpdateCurrentTeamsMB() {
        CurrentTeamsMB.Rows = Globals.ALL_TEAMS.Count
        CurrentTeamsMB.Columns = 2

        let widthSize = 0.05 * Gamemode.PlayersPerTeam
        let rowIndex: number = 0
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.Count; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            let teamMembers: string = team.TeamMembersString
            CurrentTeamsMB.GetItem(rowIndex, 0).SetWidth(0.05)
            CurrentTeamsMB.GetItem(rowIndex, 0).SetText('{team.TeamColor}:')
            CurrentTeamsMB.GetItem(rowIndex, 0).SetVisibility(true, false)
            CurrentTeamsMB.GetItem(rowIndex, 1).SetWidth(widthSize)
            CurrentTeamsMB.GetItem(rowIndex, 1).SetText('{teamMembers}')
            CurrentTeamsMB.GetItem(rowIndex, 1).SetVisibility(true, false)

            rowIndex++
        }
    }

    // #endregion Teams Multiboards

    // #region ESC Key Event & Actions

    private static ESCInit() {
        for (let player in Globals.ALL_PLAYERS) {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic)
        }
        ESCTrigger.AddAction(ErrorHandler.Wrap(ESCPressed))
    }

    private static ESCPressed() {
        let player = GetTriggerPlayer()
        let localPlayer = player.LocalPlayer
        if (localPlayer != player) return
        // Swap multiboards
        if (CurrentTeamsMB.IsDisplayed) {
            CurrentTeamsMB.IsDisplayed = false
            TeamsStatsMB.IsDisplayed = true
        } else {
            TeamsStatsMB.IsDisplayed = false
            CurrentTeamsMB.IsDisplayed = true
        }
    }

    // #endregion ESC Key Event & Actions
}
