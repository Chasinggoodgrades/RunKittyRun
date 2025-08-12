import { Globals } from 'src/Global/Globals'

export class TeamsMultiboard {
    private static CurrentTeamsMB: multiboard
    private static TeamsStatsMB: multiboard
    private static ESCTrigger: trigger

    public static Initialize() {
        try {
            if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
            TeamsMultiboard.ESCTrigger ??= CreateTrigger()
            TeamsMultiboard.TeamsMultiboardInit()
            TeamsMultiboard.ESCInit()
        } catch (e) {
            Logger.Critical('Error in TeamsMultiboard.Initialize: {e.Message}')
            throw e
        }
    }

    private static TeamsMultiboardInit() {
        TeamsMultiboard.TeamsStatsMultiboard()
        TeamsMultiboard.CurrentTeamsMultiboard()
    }

    // #region Teams Multiboards

    private static TeamsStatsMultiboard() {
        TeamsMultiboard.TeamsStatsMB ??= multiboard.Create()
        TeamsMultiboard.TeamsStatsMB.Title =
            'Stats: Teams {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        TeamsMultiboard.TeamsStatsMB.display = false
    }

    public static CurrentTeamsMultiboard() {
        TeamsMultiboard.CurrentTeamsMB ??= multiboard.Create()
        TeamsMultiboard.CurrentTeamsMB.Title =
            'Teams: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        TeamsMultiboard.CurrentTeamsMB.display = true
        TeamsMultiboard.CurrentTeamsMB.Rows = Globals.ALL_TEAMS.length + 1
        TeamsMultiboard.CurrentTeamsMB.Columns = Gamemode.PlayersPerTeam
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 0).setText('1: Team')
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 0).setVisible(true, false)
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 1).setText('1: Player')
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 1).setVisible(true, false)
    }

    public static UpdateTeamStatsMB() {
        // Top Portion Setup
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return
        TeamsMultiboard.TeamsStatsMB.Rows = Globals.ALL_TEAMS_LIST.length + 1
        TeamsMultiboard.TeamsStatsMB.Columns = 3 + Gamemode.NumberOfRounds
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).setText('Team')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).SetWidth(0.05)
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) {
            if (Globals.ROUND == i) TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setText('|c0000FF00Round {i}|r')
            else TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setText('Round {i}')
            TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(0, i).SetWidth(0.05)
        }
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).setText(Colors.COLOR_GOLD + 'Overall')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetWidth(0.05)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).setText(Colors.COLOR_GOLD + 'Time')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetWidth(0.05)

        // Actual Stats
        let rowIndex: number = 1
        let overallProgress: number
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            overallProgress = 0.0
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).setText(team.TeamColor)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).SetWidth(0.05)
            // Each Round Progress
            for (let j: number = 1; j <= Gamemode.NumberOfRounds; j++) {
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setText('_')
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setText('{team.RoundProgress[j]}%')
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setVisible(true, false)
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).SetWidth(0.05)
            }
            // Overall Progress
            for (let j: number = 1; j <= Gamemode.NumberOfRounds; j++) {
                overallProgress = overallProgress + float.Parse(team.RoundProgress[j], CultureInfo.InvariantCulture) // possibly bad?
            }
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).setText(
                (overallProgress / Gamemode.NumberOfRounds).ToString('F2') + '%'
            )
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetWidth(0.05)

            // Overall Time
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).setText(
                Utility.ConvertFloatToTimeTeam(GameTimer.TeamTotalTime(team), team.TeamID)
            )
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetWidth(0.05)
            rowIndex++
        }
    }

    public static UpdateCurrentTeamsMB() {
        TeamsMultiboard.CurrentTeamsMB.Rows = Globals.ALL_TEAMS.length
        TeamsMultiboard.CurrentTeamsMB.Columns = 2

        let widthSize = 0.05 * Gamemode.PlayersPerTeam
        let rowIndex: number = 0
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            let teamMembers: string = team.TeamMembersString
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).SetWidth(0.05)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).setText('{team.TeamColor}:')
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).setVisible(true, false)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).SetWidth(widthSize)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).setText('{teamMembers}')
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).setVisible(true, false)

            rowIndex++
        }
    }

    // #endregion Teams Multiboards

    // #region ESC Key Event & Actions

    private static ESCInit() {
        for (let player in Globals.ALL_PLAYERS) {
            TriggerRegisterPlayerEvent(TeamsMultiboard.ESCTrigger, player, EVENT_PLAYER_END_CINEMATIC)
        }
        TeamsMultiboard.ESCTrigger.AddAction(ErrorHandler.Wrap(TeamsMultiboard.ESCPressed))
    }

    private static ESCPressed() {
        let player = GetTriggerPlayer()
        let localPlayer = player.LocalPlayer
        if (localPlayer != player) return
        // Swap multiboards
        if (TeamsMultiboard.CurrentTeamsMB.IsDisplayed) {
            TeamsMultiboard.CurrentTeamsMB.display = false
            TeamsMultiboard.TeamsStatsMB.display = true
        } else {
            TeamsMultiboard.TeamsStatsMB.display = false
            TeamsMultiboard.CurrentTeamsMB.display = true
        }
    }

    // #endregion ESC Key Event & Actions
}
