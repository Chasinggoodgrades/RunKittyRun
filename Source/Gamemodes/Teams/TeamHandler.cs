using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public static class TeamHandler
{
    public static bool FreepickEnabled = false;

    public static void Handler(player Player, int TeamNumber, bool adminForced = false)
    {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0] && (adminForced || !RoundManager.GAME_STARTED && FreepickEnabled))
        {
            FreepickHandler(Player, TeamNumber, adminForced);
        }
        else
        {
            Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}The -team command is not available for this gamemode or the time to pick has expired.{Colors.COLOR_RESET}");
        }
    }

    private static void FreepickHandler(player Player, int TeamNumber, bool adminForced)
    {
        if (CanPlayerJoinTeam(Player, TeamNumber))
        {
            ApplyPlayerToTeam(Player, TeamNumber);
        }
    }

    private static void ApplyPlayerToTeam(player Player, int TeamNumber)
    {
        if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
        {
            team.AddMember(Player);
            Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You have joined team {team.TeamColor}{Colors.COLOR_RESET}");
        }
    }

    /// <summary>
    /// Throws all players who are currently not on a team into a random team. Prioritizing already made teams before creating new ones.
    /// </summary>
    public static void RandomHandler()
    {
        FreepickEnabled = false;
        var random = Globals.RANDOM_GEN;
        List<player> shuffled = new List<player>(Globals.ALL_PLAYERS);

        shuffled = shuffled.OrderBy(x => random.Next()).ToList(); // seeded random shuffle, no desyncs -- this is only ever called once so its ok.
        var teamNumber = 1;

        try
        {
            for (int i = 0; i < shuffled.Count; i++)
            {
                var player = shuffled[i];

                if (Globals.PLAYERS_TEAMS.TryGetValue(player, out Team currentTeam))
                {
                    continue;
                }

                bool addedToExistingTeam = false;

                // Attempt to add player to an existing team
                for (int j = 0; j < Globals.ALL_TEAMS_LIST.Count; j++)
                {
                    var team = Globals.ALL_TEAMS_LIST[j];
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
                    if (!Globals.ALL_TEAMS.TryGetValue(teamNumber, out Team team))
                    {
                        team = new Team(teamNumber);
                    }


                    // Add the player to the new team
                    team.AddMember(player);
                }
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TeamHandler.RandomHandler: {e.Message}");
        }
    }

    private static bool CanPlayerJoinTeam(player Player, int TeamNumber)
    {
        if (TeamNumber > 24)
        {
            Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}Usage: -team 1-24{Colors.COLOR_RESET}");
            return false;
        }

        // If the team exists, we're going to check if full or if that player is already on the team
        if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
        {
            // If Team is full, return.
            if (team.Teammembers.Count >= Gamemode.PlayersPerTeam)
            {
                Player.DisplayTextTo($"{team.TeamColor}{Colors.COLOR_YELLOW_ORANGE} is full.{Colors.COLOR_RESET}");
                return false;
            }
            // If player is on the team they're trying to join.. Return.
            if (Globals.PLAYERS_TEAMS.TryGetValue(Player, out Team currentTeam))
            {
                if (currentTeam.TeamID == TeamNumber)
                {
                    Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You are already on {team.TeamColor}{Colors.COLOR_RESET}");
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

    private static void RemoveFromCurrentTeam(player Player)
    {
        if (Globals.PLAYERS_TEAMS.TryGetValue(Player, out Team team))
        {
            team.RemoveMember(Player);
        }
    }
}
