import { Globals } from 'src/Global/Globals'

class Team {
    private static TeamTimer: timer
    public TeamID: number
    public TeamColor: string
    public TeamTimes: { [x: number]: number }
    public Teammembers: player[]
    public TeamMembersString: string = ''
    public RoundProgress: { [x: number]: string }
    public Finished: boolean

    public Team(id: number) {
        this.TeamID = id
        this.Teammembers = []
        this.RoundProgress = {}
        this.TeamTimes = {}
        this.TeamColor = Colors.GetStringColorOfPlayer(this.TeamID) + 'Team ' + this.TeamID
        this.InitRoundStats()
        Globals.ALL_TEAMS.Add(this.TeamID, this)
        Globals.ALL_TEAMS_LIST.Add(this)
    }

    public static Initialize() {
        try {
            ShadowKitty.Initialize()
            ProtectionOfAncients.Initialize()
            Relic.RegisterRelicEnabler()

            Globals.ALL_TEAMS = {}
            Globals.ALL_TEAMS_LIST = []
            Globals.PLAYERS_TEAMS = {}
            this.TeamTimer ??= CreateTimer()
            this.TeamTimer.Start(0.1, false, ErrorHandler.Wrap(this.TeamSetup))
        } catch (e: Error) {
            Logger.Critical('Error in Team.Initialize: {e.Message}')
            throw e
        }
    }

    public AddMember(player: player) {
        this.AssignTeamMember(player, true)
    }

    public RemoveMember(player: player) {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return // Must be Team Tournament Mode
        if (!Globals.PLAYERS_TEAMS.has(player)) return
        this.AssignTeamMember(player, false)
        if (this.Teammembers.length == 0) {
            Globals.ALL_TEAMS.delete(this.TeamID)
            const index = Globals.ALL_TEAMS_LIST.indexOf(this)
            if (index > -1) {
                Globals.ALL_TEAMS_LIST.splice(index, 1)
            }
        }
    }

    public TeamIsDeadActions() {
        for (let i: number = 0; i < this.Teammembers.length; i++) {
            let kitty = Globals.ALL_KITTIES[this.Teammembers[i]]
            kitty.Finished = true
        }
        this.Finished = true
        RoundManager.RoundEndCheck()
    }

    public UpdateRoundProgress(round: number, progress: string) {
        this.RoundProgress[round] = progress
    }

    private InitRoundStats() {
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) {
            this.RoundProgress[i] = '0.0'
            this.TeamTimes[i] = 0.0
        }
    }

    public static UpdateTeamsMB() {
        let t = CreateTimer()
        TimerStart(
            t,
            0.1,
            false,
            ErrorHandler.Wrap(() => {
                TeamsMultiboard.UpdateCurrentTeamsMB()
                TeamsMultiboard.UpdateTeamStatsMB()
                DestroyTimer(t)
            })
        )
    }

    private static TeamSetup() {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0]) {
            // free pick
            RoundManager.ROUND_INTERMISSION += 15.0
            TeamHandler.FreepickEnabled = true
            for (let player in Globals.ALL_PLAYERS) {
                player.DisplayTimedTextTo(
                    RoundManager.ROUND_INTERMISSION - 30.0,
                    Colors.COLOR_YELLOW_ORANGE +
                        Globals.TEAM_MODES[0] +
                        ' been: enabled: has. Use ' +
                        Colors.COLOR_GOLD +
                        '-team <#> ' +
                        Colors.COLOR_YELLOW_ORANGE +
                        'join: a: team: to'
                )
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0, () => {
                Utility.TimedTextToAllPlayers(
                    5.0,
                    '{Colors.COLOR_TURQUOISE}players: have: been: randomly: assigned: to: teams: and: picking: has: Remaining been disabled.{Colors.COLOR_RESET}'
                )
                TeamHandler.RandomHandler()
            })
        } else if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1])
            // random
            Utility.SimpleTimer(2.5, TeamHandler.RandomHandler)
    }

    /// <summary>
    /// Assigns or removes a player from a team and updates their color accordingly.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="adding"></param>
    private AssignTeamMember(player: player, adding: boolean) {
        if (adding) {
            this.Teammembers.push(player)
            Globals.ALL_KITTIES[player].TeamID = this.TeamID
            Globals.ALL_KITTIES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)))
            Globals.ALL_CIRCLES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)))
            Globals.PLAYERS_TEAMS.Add(player, this)
        } else {
            Teammembers.Remove(player)
            Globals.ALL_KITTIES[player].TeamID = 0
            Globals.PLAYERS_TEAMS.Remove(player)
        }

        // Sets the team member string whenever someone is added or removed.
        this.TeamMembersString = '' // Reset TeamMembersString
        for (let i: number = 0; i < this.Teammembers.Count; i++) {
            let member = this.Teammembers[i]
            let name: string = member.Name.split('#')[0]
            if (name.length > 7) name = Colors.ColorString(member.Name.Substring(0, 7), member.Id + 1)

            if (this.TeamMembersString.length > 0) this.TeamMembersString += ', '

            this.TeamMembersString += name
        }

        TeamsUtil.UpdateTeamsMB()
    }
}
