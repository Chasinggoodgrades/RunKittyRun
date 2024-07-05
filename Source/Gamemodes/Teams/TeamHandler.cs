using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class TeamHandler
{
    public static void Handler(player Player, int TeamNumber)
    {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0])
        {
            FreepickHandler(Player, TeamNumber);
        }
        else
        {
            Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "The -team command is not available for this gamemode.");
        }
    }

    private static void FreepickHandler(player Player, int TeamNumber)
    {
        if(CanPlayerJoinTeam(Player, TeamNumber))
        {
            if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
            {
                RemoveFromCurrentTeam(Player);
                team.AddMember(Player);
                Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "You have joined team " + team.TeamColor);
            }
        }
    }

    public static void RandomHandler()
    {
        var random = new Random();
        List<player> shuffled = new List<player>(Globals.ALL_PLAYERS);

        shuffled = shuffled.OrderBy(x => random.Next()).ToList();
        var teamNumber = 1;

        foreach (var player in shuffled)
        {
            // Check if the team exists
            if (!Globals.ALL_TEAMS.TryGetValue(teamNumber, out Team team))
            {
                team = new Team(teamNumber);
                Globals.ALL_TEAMS[teamNumber] = team;
            }

            // Check if the team is full
            if (team.Teammembers.Count >= Gamemode.PlayersPerTeam)
            {
                // If the team is full, increment the team number and create a new team
                teamNumber++;
                if (!Globals.ALL_TEAMS.TryGetValue(teamNumber, out team))
                {
                    team = new Team(teamNumber);
                    Globals.ALL_TEAMS[teamNumber] = team;
                }
            }

            // Add the player to the team
            team.AddMember(player);
        }
    }

    private static bool CanPlayerJoinTeam(player Player, int TeamNumber)
    {
        if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
        {
            if (team.Teammembers.Count >= Gamemode.PlayersPerTeam)
            {
                Player.DisplayTextTo(team.TeamColor + Color.COLOR_YELLOW_ORANGE + " is full.");
                return false;
            }
            if (Globals.PLAYERS_TEAMS.TryGetValue(Player, out Team currentTeam))
            {
                if (currentTeam.TeamID == TeamNumber)
                {
                    Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "You are already on " + team.TeamColor);
                    return false;
                }
            }
        }
        else
            new Team(TeamNumber);
        return true;
    }

    private static void RemoveFromCurrentTeam(player Player)
    {
        if(Globals.PLAYERS_TEAMS.TryGetValue(Player, out Team team))
        {
            team.RemoveMember(Player);
        }   
    }
}
