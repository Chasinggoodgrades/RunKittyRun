import { Logger } from 'src/Events/Logger/Logger'
import { ShadowKitty } from 'src/Game/Entities/ShadowKitty'
import { Relic } from 'src/Game/Items/Relics/Relic'
import { ProtectionOfAncients } from 'src/Game/ProtectionOfAncients'
import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { Globals } from 'src/Global/Globals'
import { TeamsMultiboard } from 'src/UI/Multiboard/TeamsMultiboard'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Timer } from 'w3ts'
import { CurrentGameMode } from '../CurrentGameMode'
import { GameMode } from '../GameModeEnum'
import { TeamHandler } from './TeamHandler'

export class Team {
    private static TeamTimer: Timer
    public TeamID = 0
    public TeamColor: string
    public TeamTimes: Map<number, number>
    public Teammembers: MapPlayer[]
    public TeamMembersString: string = ''
    public RoundProgress: Map<number, string>
    public Finished = false

    constructor(id: number) {
        this.TeamID = id
        this.Teammembers = []
        this.RoundProgress = new Map()
        this.TeamID = id
        this.Teammembers = []
        this.RoundProgress = new Map()
        this.TeamTimes = new Map()
        this.TeamColor = ColorUtils.GetStringColorOfPlayer(this.TeamID) + 'Team ' + this.TeamID
        this.InitRoundStats()
        Globals.ALL_TEAMS.set(this.TeamID, this)
        Globals.ALL_TEAMS_LIST.push(this)
    }

    public static Initialize() {
        try {
            ShadowKitty.Initialize()
            ProtectionOfAncients.Initialize()
            Relic.RegisterRelicEnabler()

            Globals.ALL_TEAMS = new Map()
            Globals.ALL_TEAMS_LIST = []
            Globals.PLAYERS_TEAMS = new Map()
            this.TeamTimer ??= Timer.create()
            this.TeamTimer.start(
                0.1,
                false,
                ErrorHandler.Wrap(() => this.TeamSetup())
            )
        } catch (e: any) {
            Logger.Critical(`Error in Team.Initialize: ${e}`)
            throw e
        }
    }

    public AddMember(player: MapPlayer) {
        this.AssignTeamMember(player, true)
    }

    public RemoveMember(player: MapPlayer) {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return // Must be Team Tournament Mode
        if (!Globals.PLAYERS_TEAMS.has(player)) return
        this.AssignTeamMember(player, false)
        if (this.Teammembers.length === 0) {
            Globals.ALL_TEAMS.delete(this.TeamID)
            const index = Globals.ALL_TEAMS_LIST.indexOf(this)
            if (index > -1) {
                Globals.ALL_TEAMS_LIST.splice(index, 1)
            }
        }
    }

    public TeamIsDeadActions() {
        for (let i = 0; i < this.Teammembers.length; i++) {
            let kitty = Globals.ALL_KITTIES.get(this.Teammembers[i])!
            kitty.Finished = true
        }
        this.Finished = true
        RoundManager.RoundEndCheck()
    }

    public UpdateRoundProgress(round: number, progress: string) {
        this.RoundProgress.set(round, progress)
    }

    private InitRoundStats() {
        for (let i = 1; i <= Globals.NumberOfRounds; i++) {
            this.RoundProgress.set(i, '0.0')
            this.TeamTimes.set(i, 0.0)
        }
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

    private static TeamSetup() {
        if (Globals.CurrentGameModeType === Globals.TEAM_MODES[0]) {
            // free pick
            RoundManager.ROUND_INTERMISSION += 15.0
            TeamHandler.FreepickEnabled = true
            for (let player of Globals.ALL_PLAYERS) {
                player.DisplayTimedTextTo(
                    RoundManager.ROUND_INTERMISSION - 30.0,
                    Colors.COLOR_YELLOW_ORANGE +
                        Globals.TEAM_MODES[0] +
                        ' has been enabled. Use ' +
                        Colors.COLOR_GOLD +
                        '-team <#> ' +
                        Colors.COLOR_YELLOW_ORANGE +
                        'to join a team'
                )
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0, () => {
                Utility.TimedTextToAllPlayers(
                    5.0,
                    `${Colors.COLOR_TURQUOISE}Remaining players have been randomly assigned to teams and picking has been disabled.${Colors.COLOR_RESET}`
                )
                TeamHandler.RandomHandler()
            })
        } else if (Globals.CurrentGameModeType === Globals.TEAM_MODES[1])
            // random
            Utility.SimpleTimer(2.5, TeamHandler.RandomHandler)
    }

    /// <summary>
    /// Assigns or removes a player from a team and updates their color accordingly.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="adding"></param>
    private AssignTeamMember(player: MapPlayer, adding: boolean) {
        if (adding) {
            this.Teammembers.push(player)
            Globals.ALL_KITTIES.get(player)!.TeamID = this.TeamID
            Globals.ALL_KITTIES.get(player)!.Unit.color = GetPlayerColor(MapPlayer.fromIndex(this.TeamID - 1)!.handle)
            Globals.ALL_CIRCLES.get(player)!.Unit.color = GetPlayerColor(MapPlayer.fromIndex(this.TeamID - 1)!.handle)
            Globals.PLAYERS_TEAMS.set(player, this)
        } else {
            this.Teammembers.splice(this.Teammembers.indexOf(player), 1)
            Globals.ALL_KITTIES.get(player)!.TeamID = 0
            Globals.PLAYERS_TEAMS.delete(player)
        }

        // Sets the team member string whenever someone is added or removed.
        this.TeamMembersString = '' // Reset TeamMembersString
        for (let i = 0; i < this.Teammembers.length; i++) {
            let member = this.Teammembers[i]
            let name: string = member.name.split('#')[0]
            if (name.length > 7) name = ColorUtils.ColorString(member.name.substring(0, 7), member.id + 1)

            if (this.TeamMembersString.length > 0) this.TeamMembersString += ', '

            this.TeamMembersString += name
        }

        Team.UpdateTeamsMB()
    }
}
