using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection.Metadata.Ecma335;
using System.Threading;
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
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0] && !RoundManager.GAME_STARTED)
        {
            FreepickHandler(Player, TeamNumber);
        }
        else
        {
            Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "The -team command is not available for this gamemode or the time to pick has expired.");
        }
    }

    private static void FreepickHandler(player Player, int TeamNumber)
    {
        if (CanPlayerJoinTeam(Player, TeamNumber))
        {

            ApplyPlayerToTeam(Player, TeamNumber);
            //var timer = CreateTimer();
            //TimerStart(timer, 0.00f, false, () => { ApplyPlayerToTeam(Player, TeamNumber); DestroyTimer(timer); });
        }
    }

    private static void ApplyPlayerToTeam(player Player, int TeamNumber)
    {
        if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
        {
            team.AddMember(Player);
            Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "You have joined team " + team.TeamColor);
        }
    }

    public static void RandomHandler()
    {
        var random = new Random(Globals.GAME_SEED); // Must Set To Specific Seed to avoid desyncs.
        List<player> shuffled = new List<player>(Globals.ALL_PLAYERS);

        shuffled = shuffled.OrderBy(x => random.Next()).ToList();
        var teamNumber = 1;

        try
        {
            foreach (var player in shuffled)
            {
                if (Globals.PLAYERS_TEAMS.TryGetValue(player, out Team currentTeam))
                {
                    continue;
                }

                bool addedToExistingTeam = false;

                // Attempt to add player to an existing team
                foreach (var team in Globals.ALL_TEAMS.Values)
                {
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
                    while (Globals.ALL_TEAMS.ContainsKey(teamNumber) &&
                           Globals.ALL_TEAMS[teamNumber].Teammembers.Count >= Gamemode.PlayersPerTeam)
                    {
                        teamNumber++;
                    }

                    // Check if the team exists, if not create it
                    if (!Globals.ALL_TEAMS.TryGetValue(teamNumber, out Team team))
                    {
                        team = new Team(teamNumber);
                        Globals.ALL_TEAMS[teamNumber] = team;

                    }

                    // Add the player to the new team
                    team.AddMember(player);
                }
            }
        }
        catch (Exception e)
        {
            Console.WriteLine("Error: " + e.Message);
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
        {
            RemoveFromCurrentTeam(Player);
            new Team(TeamNumber);
        }
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
