

class Team
{
    private static TeamTimer: timer 
    public TeamID: number 
    public TeamColor: string 
    public Dictionary<int, float> TeamTimes 
    public List<player> Teammembers 
    public TeamMembersString: string = "";
    public Dictionary<int, string> RoundProgress 
    public Finished: boolean 

    public Team(id: number)
    {
        TeamID = id;
        Teammembers = new List<player>();
        RoundProgress = new Dictionary<int, string>();
        TeamTimes = new Dictionary<int, float>();
        TeamColor = Colors.GetStringColorOfPlayer(TeamID) + "Team " + TeamID;
        InitRoundStats();
        Globals.ALL_TEAMS.Add(TeamID, this);
        Globals.ALL_TEAMS_LIST.Add(this);
    }

    public static Initialize()
    {
        try
        {
            ShadowKitty.Initialize();
            ProtectionOfAncients.Initialize();
            Relic.RegisterRelicEnabler();

            Globals.ALL_TEAMS = new Dictionary<int, Team>();
            Globals.ALL_TEAMS_LIST = new List<Team>();
            Globals.PLAYERS_TEAMS = new Dictionary<player, Team>();
            TeamTimer ??= timer.Create();
            TeamTimer.Start(0.1, false, ErrorHandler.Wrap(TeamSetup));
        }
        catch (e: Error)
        {
            Logger.Critical("Error in Team.Initialize: {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    public AddMember(player: player)
    {
        AssignTeamMember(player, true);
    }

    public RemoveMember(player: player)
    {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return; // Must be Team Tournament Mode
        if (!Globals.PLAYERS_TEAMS.ContainsKey(player)) return;
        AssignTeamMember(player, false);
        if (Teammembers.Count == 0)
        {
            Globals.ALL_TEAMS.Remove(TeamID);
            Globals.ALL_TEAMS_LIST.Remove(this);
        }
    }

    public TeamIsDeadActions()
    {
        for (let i: number = 0; i < Teammembers.Count; i++)
        {
            let kitty = Globals.ALL_KITTIES[Teammembers[i]];
            kitty.Finished = true;
        }
        Finished = true;
        RoundManager.RoundEndCheck();
    }

    public UpdateRoundProgress(round: number, progress: string)
    {
        RoundProgress[round] = progress;
    }

    private InitRoundStats()
    {
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            RoundProgress.Add(i, "0.0");
            TeamTimes.Add(i, 0.0);
        }
    }

    public static UpdateTeamsMB()
    {
        let t = timer.Create();
        t.Start(0.1, false, ErrorHandler.Wrap(() =>
        {
            TeamsMultiboard.UpdateCurrentTeamsMB();
            TeamsMultiboard.UpdateTeamStatsMB();
            t.Dispose();
        }));
    }

    private static TeamSetup()
    {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0]) // free pick
        {
            RoundManager.ROUND_INTERMISSION += 15.0;
            TeamHandler.FreepickEnabled = true;
            for (let player in Globals.ALL_PLAYERS)
            {
                player.DisplayTimedTextTo(RoundManager.ROUND_INTERMISSION - 30.0, Colors.COLOR_YELLOW_ORANGE + Globals.TEAM_MODES[0] +
                    " been: enabled: has. Use " + Colors.COLOR_GOLD + "-team <#> " + Colors.COLOR_YELLOW_ORANGE + "join: a: team: to");
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0, () =>
            {
                Utility.TimedTextToAllPlayers(5.0, "{Colors.COLOR_TURQUOISE}players: have: been: randomly: assigned: to: teams: and: picking: has: Remaining been disabled.{Colors.COLOR_RESET}");
                TeamHandler.RandomHandler();
            });
        }
        let if: else (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1]) // random
            Utility.SimpleTimer(2.5, TeamHandler.RandomHandler);
    }

    /// <summary>
    /// Assigns or removes a player from a team and updates their color accordingly.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="adding"></param>
    private AssignTeamMember(player: player, adding: boolean)
    {
        if (adding)
        {
            Teammembers.Add(player);
            Globals.ALL_KITTIES[player].TeamID = TeamID;
            Globals.ALL_KITTIES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
            Globals.ALL_CIRCLES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
            Globals.PLAYERS_TEAMS.Add(player, this);
        }
        else
        {
            Teammembers.Remove(player);
            Globals.ALL_KITTIES[player].TeamID = 0;
            Globals.PLAYERS_TEAMS.Remove(player);
        }

        // Sets the team member string whenever someone is added or removed.
        TeamMembersString = ""; // Reset TeamMembersString
        for (let i: number = 0; i < Teammembers.Count; i++)
        {
            let member = Teammembers[i];
            let name: string = member.Name.Split('#')[0];
            if (name.Length > 7)
                name = Colors.ColorString(member.Name.Substring(0, 7), member.Id + 1);

            if (TeamMembersString.Length > 0)
                TeamMembersString += ", ";

            TeamMembersString += name;

        }

        TeamsUtil.UpdateTeamsMB();
    }

}
