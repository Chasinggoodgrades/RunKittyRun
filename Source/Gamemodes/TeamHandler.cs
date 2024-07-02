using System;
using System.Collections.Generic;
using System.Drawing;
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
        else if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1])
        {
            RandomHandler(Player);
        }
        else
        {
            Player.DisplayTextTo("Unknown gamemode: " + Gamemode.CurrentGameModeType + " please report bug to developer.");
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
                Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "You have joined team " + TeamNumber);
            }
        }
    }

    private static void RandomHandler(player Player)
    {

    }

    private static bool CanPlayerJoinTeam(player Player, int TeamNumber)
    {
        if (Globals.ALL_TEAMS.TryGetValue(TeamNumber, out Team team))
        {
            if (team.GetMemberCount() >= Gamemode.PlayersPerTeam)
            {
                Player.DisplayTextTo(Color.COLOR_YELLOW_ORANGE + "Team " + TeamNumber + " is full.");
                return false;
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
