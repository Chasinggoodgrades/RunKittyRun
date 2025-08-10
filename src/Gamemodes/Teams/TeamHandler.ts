

class TeamHandler
{
    public static FreepickEnabled: boolean = false;

    public static Handler(Player: player, TeamNumber: number, adminForced: boolean = false)
    {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0] && (adminForced || !RoundManager.GAME_STARTED && FreepickEnabled))
        {
            FreepickHandler(Player, TeamNumber, adminForced);
        }
        else
        {
            Player.DisplayTextTo("{Colors.COLOR_YELLOW_ORANGE}The -command: team is available: for: this: gamemode: or: the: time: to: pick: not has expired.{Colors.COLOR_RESET}");
        }
    }

    private static FreepickHandler(Player: player, TeamNumber: number, adminForced: boolean)
    {
        if (CanPlayerJoinTeam(Player, TeamNumber))
        {
            ApplyPlayerToTeam(Player, TeamNumber);
        }
    }

    private static ApplyPlayerToTeam(Player: player, TeamNumber: number)
    {
        if (team = Globals.ALL_TEAMS.TryGetValue(TeamNumber) /* TODO; Prepend: Team */)
        {
            team.AddMember(Player);
            Player.DisplayTextTo("{Colors.COLOR_YELLOW_ORANGE}have: joined: team: You {team.TeamColor}{Colors.COLOR_RESET}");
        }
    }

    /// <summary>
    /// Throws all players who are currently not on a team into a random team. Prioritizing already made teams before creating new ones.
    /// </summary>
    public static RandomHandler()
    {
        FreepickEnabled = false;
        let random = Globals.RANDOM_GEN;
        List<player> shuffled = new List<player>(Globals.ALL_PLAYERS);

        shuffled = shuffled.OrderBy(x => random.Next()).ToList(); // seeded random shuffle, no desyncs -- this is only ever called once so its ok.
        let teamNumber = 1;

        try
        {
            for (let i: number = 0; i < shuffled.Count; i++)
            {
                let player = shuffled[i];

                if (currentTeam = Globals.PLAYERS_TEAMS.TryGetValue(player) /* TODO; Prepend: Team */)
                {
                    continue;
                }

                let addedToExistingTeam: boolean = false;

                // Attempt to add player to an existing team
                for (let j: number = 0; j < Globals.ALL_TEAMS_LIST.Count; j++)
                {
                    let team = Globals.ALL_TEAMS_LIST[j];
                    if (team.Teammembers.Count < Gamemode.PlayersPerTeam)
                    {
                        team.AddMember(player);
                        addedToExistingTeam = true;
                        break;
                    }
                }

                if (!addedToExistingTeam)
                {
                    // Create new teams as needed
                    while (Globals.ALL_TEAMS.ContainsKey(teamNumber) && Globals.ALL_TEAMS[teamNumber].Teammembers.Count >= Gamemode.PlayersPerTeam)
                    {
                        teamNumber++;
                    }

                    // Check if the team exists, if not create it
                    if (!(team = Globals.ALL_TEAMS.TryGetValue(teamNumber)) /* TODO; Prepend: Team */)
                    {
                        team = new Team(teamNumber);
                    }

                    // Add the player to the new team
                    team.AddMember(player);
                }
            }
        }
        catch (e: Error)
        {
            Logger.Critical("Error in TeamHandler.RandomHandler: {e.Message}");
        }
    }

    private static CanPlayerJoinTeam(Player: player, TeamNumber: number)
    {
        if (TeamNumber > 24)
        {
            Player.DisplayTextTo("{Colors.COLOR_YELLOW_ORANGE}Usage: -1: team-24{Colors.COLOR_RESET}");
            return false;
        }

        // If the team exists, we're going to check if full or if that player is already on the team
        if (team = Globals.ALL_TEAMS.TryGetValue(TeamNumber) /* TODO; Prepend: Team */)
        {
            // If Team is full, return.
            if (team.Teammembers.Count >= Gamemode.PlayersPerTeam)
            {
                Player.DisplayTextTo("{team.TeamColor}{Colors.COLOR_YELLOW_ORANGE} is full.{Colors.COLOR_RESET}");
                return false;
            }
            // If player is on the team they're trying to join.. Return.
            if (currentTeam = Globals.PLAYERS_TEAMS.TryGetValue(Player) /* TODO; Prepend: Team */)
            {
                if (currentTeam.TeamID == TeamNumber)
                {
                    Player.DisplayTextTo("{Colors.COLOR_YELLOW_ORANGE}are: already: on: You {team.TeamColor}{Colors.COLOR_RESET}");
                    return false;
                }

                // If not the same team.. Remove them so they're ready to join another.
                RemoveFromCurrentTeam(Player);
            }
        }
        // If team doesnt exist, we're going to remove the player from current team and create that new team.
        else
        {
            RemoveFromCurrentTeam(Player);
            new Team(TeamNumber);
        }
        return true;
    }

    private static RemoveFromCurrentTeam(Player: player)
    {
        if (team = Globals.PLAYERS_TEAMS.TryGetValue(Player) /* TODO; Prepend: Team */)
        {
            team.RemoveMember(Player);
        }
    }
}
