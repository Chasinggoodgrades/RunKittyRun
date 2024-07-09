using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public class Team
{
    public int TeamID { get; private set; }
    public string TeamColor { get; private set; }
    public List<player> Teammembers { get; private set; }
    private static timer TeamTimer { get; set; }

    public Team(int id)
    {
        TeamID = id;
        Teammembers = new List<player>();
        TeamColor = Color.playerColors[TeamID] + "Team " + TeamID;
        Globals.ALL_TEAMS.Add(TeamID, this);
    }
    public static void Initialize()
    {
        Globals.ALL_TEAMS = new Dictionary<int, Team>();
        Globals.PLAYERS_TEAMS = new Dictionary<player, Team>();
        TeamTimer = CreateTimer();
        TimerStart(TeamTimer, 0.1f, false, TeamSetup);
    }

    public void AddMember(player player)
    {
        Teammembers.Add(player);
        Globals.ALL_KITTIES[player].TeamID = TeamID;
        Globals.ALL_KITTIES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
        Globals.ALL_CIRCLES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
        Globals.PLAYERS_TEAMS.Add(player, this);
        UpdateTeamsMB();
    }

    public void RemoveMember(player player)
    {
        Globals.PLAYERS_TEAMS.Remove(player);
        Teammembers.Remove(player);
        Globals.ALL_KITTIES[player].TeamID = 0;
        if (Teammembers.Count == 0)
        {
            Globals.ALL_TEAMS.Remove(TeamID);
        }
        UpdateTeamsMB();
    }

    private static void TeamSetup()
    {
        if(Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0]) // free pick
        {
            RoundManager.ROUND_INTERMISSION += 15.0f;
            foreach(var player in Globals.ALL_PLAYERS)
            {
                player.DisplayTimedTextTo(RoundManager.ROUND_INTERMISSION - 5.0f, Color.COLOR_YELLOW_ORANGE + Globals.TEAM_MODES[0] +
                    " has been enabled. Use " + Color.COLOR_GOLD + "-team <#> " + Color.COLOR_YELLOW_ORANGE + "to join a team");
            }
            var timer = CreateTimer();
            TimerStart(timer, RoundManager.ROUND_INTERMISSION - 15.0f, false, () =>
            {
                TeamHandler.RandomHandler();
                DestroyTimer(timer);
            });
        }
        else if(Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1]) // random
        {
            TeamHandler.RandomHandler();
        }
    }

    private static void UpdateTeamsMB()
    {
        var timer = CreateTimer();
        TimerStart(timer, 0.1f, false, () => 
        {
            Multiboard.UpdateCurrentTeamsMB();
            Multiboard.UpdateTeamStatsMB();
            timer.Dispose();
        });

    }
}

