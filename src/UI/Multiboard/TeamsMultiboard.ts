import { Logger } from 'src/Events/Logger/Logger'
import { GameTimer } from 'src/Game/Rounds/GameTimer'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Multiboard, Timer, Trigger } from 'w3ts'

export class TeamsMultiboard {
    private static CurrentTeamsMB: Multiboard
    private static TeamsStatsMB: Multiboard
    private static ESCTrigger: Trigger

    public static Initialize() {
        try {
            if (CurrentGameMode.active !== GameMode.TeamTournament) return
            TeamsMultiboard.ESCTrigger ??= Trigger.create()!
            TeamsMultiboard.TeamsMultiboardInit()
            TeamsMultiboard.ESCInit()
        } catch (e: any) {
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
        TeamsMultiboard.TeamsStatsMB ??= Multiboard.create()!
        TeamsMultiboard.TeamsStatsMB.title =
            'Stats: Teams {Colors.COLOR_YELLOW_ORANGE}[{Globals.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        TeamsMultiboard.TeamsStatsMB.display(false)
    }

    public static CurrentTeamsMultiboard() {
        TeamsMultiboard.CurrentTeamsMB ??= Multiboard.create()!
        TeamsMultiboard.CurrentTeamsMB.title =
            'Teams: Current {Colors.COLOR_YELLOW_ORANGE}[{Globals.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        TeamsMultiboard.CurrentTeamsMB.display(true)
        TeamsMultiboard.CurrentTeamsMB.rows = Globals.ALL_TEAMS.size + 1
        TeamsMultiboard.CurrentTeamsMB.columns = Gamemode.PlayersPerTeam
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 0).setText('1: Team')
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 0).setVisible(true, false)
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 1).setText('1: Player')
        TeamsMultiboard.CurrentTeamsMB.GetItem(0, 1).setVisible(true, false)
    }

    public static UpdateTeamStatsMB() {
        // Top Portion Setup
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        TeamsMultiboard.TeamsStatsMB.rows = Globals.ALL_TEAMS_LIST.length + 1
        TeamsMultiboard.TeamsStatsMB.columns = 3 + Globals.NumberOfRounds
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).setText('Team')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, 0).setWidth(0.05)
        for (let i: number = 1; i <= Globals.NumberOfRounds; i++) {
            if (Globals.ROUND === i) TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setText('|c0000FF00Round {i}|r')
            else TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setText('Round {i}')
            TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(0, i).setWidth(0.05)
        }
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 1).setText(Colors.COLOR_GOLD + 'Overall')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 1).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 1).setWidth(0.05)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 2).setText(Colors.COLOR_GOLD + 'Time')
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 2).setVisible(true, false)
        TeamsMultiboard.TeamsStatsMB.GetItem(0, Globals.NumberOfRounds + 2).setWidth(0.05)

        // Actual Stats
        let rowIndex: number = 1
        let overallProgress: number
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            overallProgress = 0.0
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).setText(team.TeamColor)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, 0).setWidth(0.05)
            // Each Round Progress
            for (let j: number = 1; j <= Globals.NumberOfRounds; j++) {
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setText('_')
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setText(`${team.RoundProgress.get(j)}%`)
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setVisible(true, false)
                TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, j).setWidth(0.05)
            }
            // Overall Progress
            for (let j: number = 1; j <= Globals.NumberOfRounds; j++) {
                overallProgress = overallProgress + S2I(team.RoundProgress.get(j)!) // possibly bad?
            }
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 1).setText(
                (overallProgress / Globals.NumberOfRounds).toFixed(2) + '%'
            )
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 1).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 1).setWidth(0.05)

            // Overall Time
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 2).setText(
                Utility.ConvertFloatToTimeTeam(GameTimer.TeamTotalTime(team), team.TeamID)
            )
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 2).setVisible(true, false)
            TeamsMultiboard.TeamsStatsMB.GetItem(rowIndex, Globals.NumberOfRounds + 2).setWidth(0.05)
            rowIndex++
        }
    }
    
    public static UpdateCurrentTeamsMB() {
        TeamsMultiboard.CurrentTeamsMB.rows = Globals.ALL_TEAMS.size
        TeamsMultiboard.CurrentTeamsMB.columns = 2

        let widthSize = 0.05 * Gamemode.PlayersPerTeam
        let rowIndex: number = 0
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            let teamMembers: string = team.TeamMembersString
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).setWidth(0.05)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).setText('{team.TeamColor}:')
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 0).setVisible(true, false)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).setWidth(widthSize)
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).setText('{teamMembers}')
            TeamsMultiboard.CurrentTeamsMB.GetItem(rowIndex, 1).setVisible(true, false)

            rowIndex++
        }
    }

    // #endregion Teams Multiboards

    // #region ESC Key Event & Actions

    private static ESCInit() {
        for (let player of Globals.ALL_PLAYERS) {
            TeamsMultiboard.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        }
        TeamsMultiboard.ESCTrigger.addAction(ErrorHandler.Wrap(TeamsMultiboard.ESCPressed))
    }

    private static ESCPressed() {
        let player = getTriggerPlayer()
        if (player.isLocal()) return
        // Swap multiboards
        if (TeamsMultiboard.CurrentTeamsMB.displayed) {
            TeamsMultiboard.CurrentTeamsMB.display(false)
            TeamsMultiboard.TeamsStatsMB.display(true)
        } else {
            TeamsMultiboard.TeamsStatsMB.display(false)
            TeamsMultiboard.CurrentTeamsMB.display(true)
        }
    }
    // #endregion ESC Key Event & Actions
}
