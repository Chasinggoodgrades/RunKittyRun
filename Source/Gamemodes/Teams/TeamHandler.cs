using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public static class TeamHandler
{
    public static bool FreepickEnabled = false;

    public static void Handler(player player, int teamNumber, bool adminForced = false)
    {
        try
        {
            if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0] && (adminForced || !RoundManager.GAME_STARTED && FreepickEnabled))
            {
                FreepickHandler(player, teamNumber);
            }
            else
            {
                player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}The -team command is not available for this gamemode or the time to pick has expired.{Colors.COLOR_RESET}");
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in TeamHandler.Handler: {e.Message}");
        }
    }

    private static void FreepickHandler(player player, int teamNumber)
    {
        if (CanPlayerJoinTeam(player, teamNumber))
        {
            ApplyPlayerToTeam(player, teamNumber);
        }
    }

    private static void ApplyPlayerToTeam(player player, int teamNumber)
    {
        if (TeamRegistry.TryGetTeam(teamNumber, out var team))
        {
            team.AddMember(player);
            player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You have joined team {team.TeamColor}{Colors.COLOR_RESET}");
        }
    }

    /// <summary>
    /// Throws all players who are currently not on a team into a random team. Prioritizing already made teams before creating new ones.
    /// </summary>
    public static void RandomHandler()
    {
        FreepickEnabled = false;
        var random = Globals.RANDOM_GEN;
        var shuffled = new List<player>(Globals.ALL_PLAYERS).OrderBy(x => random.Next()).ToList(); // seeded random shuffle, no desyncs -- this is only ever called once so its ok.
        var teamNumber = 1;

        try
        {
            foreach (var player in shuffled)
            {
                if (TeamRegistry.TryGetTeamForPlayer(player, out _)) continue;

                var addedToExistingTeam = false;
                foreach (var team in TeamRegistry.All)
                {
                    if (team.Teammembers.Count < Gamemode.PlayersPerTeam)
                    {
                        team.AddMember(player);
                        addedToExistingTeam = true;
                        break;
                    }
                }

                if (addedToExistingTeam) continue;

                // Create new teams as needed
                while (TeamRegistry.TryGetTeam(teamNumber, out var full) && full.Teammembers.Count >= Gamemode.PlayersPerTeam)
                {
                    teamNumber++;
                }

                if (!TeamRegistry.TryGetTeam(teamNumber, out var team2))
                {
                    team2 = new Team(teamNumber);
                }

                team2.AddMember(player);
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in TeamHandler.RandomHandler: {e.Message}");
        }
    }

    private static bool CanPlayerJoinTeam(player player, int teamNumber)
    {
        if (teamNumber > Globals.MAX_TEAM_SIZE)
        {
            player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}Usage: -team 1-{Globals.MAX_TEAM_SIZE}{Colors.COLOR_RESET}");
            return false;
        }

        // If the team exists, check if it's full or if the player is already on it.
        if (TeamRegistry.TryGetTeam(teamNumber, out var team))
        {
            if (team.Teammembers.Count >= Gamemode.PlayersPerTeam)
            {
                player.DisplayTextTo($"{team.TeamColor}{Colors.COLOR_YELLOW_ORANGE} is full.{Colors.COLOR_RESET}");
                return false;
            }

            if (TeamRegistry.TryGetTeamForPlayer(player, out var currentTeam))
            {
                if (currentTeam.TeamID == teamNumber)
                {
                    player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You are already on {team.TeamColor}{Colors.COLOR_RESET}");
                    return false;
                }

                RemoveFromCurrentTeam(player);
            }
        }
        else
        {
            // Team doesn't exist yet — remove the player from their current team and create it.
            RemoveFromCurrentTeam(player);
            new Team(teamNumber);
        }
        return true;
    }

    private static void RemoveFromCurrentTeam(player player)
    {
        try
        {
            if (TeamRegistry.TryGetTeamForPlayer(player, out var team))
            {
                team.RemoveMember(player);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in TeamHandler.RemoveFromCurrentTeam: {e.Message}");
        }
    }
}
