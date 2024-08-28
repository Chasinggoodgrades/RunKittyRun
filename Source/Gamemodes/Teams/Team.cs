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
    public Dictionary<int, float> TeamTimes { get; set; }
    public List<player> Teammembers { get; private set; }
    public Dictionary<int, string> RoundProgress { get; private set; }
    public bool Finished { get; set; }
    private static timer TeamTimer { get; set; }

    public Team(int id)
    {
        TeamID = id;
        Teammembers = new List<player>();
        RoundProgress = new Dictionary<int, string>();
        TeamTimes = new Dictionary<int, float>();
        TeamColor = Colors.GetPlayerColor(TeamID) + "Team " + TeamID;
        InitRoundStats();
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
        if(Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        Globals.PLAYERS_TEAMS.Remove(player);
        Teammembers.Remove(player);
        Globals.ALL_KITTIES[player].TeamID = 0;
        if (Teammembers.Count == 0) Globals.ALL_TEAMS.Remove(TeamID);
        UpdateTeamsMB();
    }

    public static void CheckTeamDead(Kitty k)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        var team = Globals.ALL_TEAMS[k.TeamID];
        foreach(var player in team.Teammembers)
            if (Globals.ALL_KITTIES[player].Alive) return;
        team.TeamIsDeadActions();
    }

    private void TeamIsDeadActions()
    {
        foreach(var player in Teammembers)
        {
            var kitty = Globals.ALL_KITTIES[player];
            kitty.Finished = true;
        }
        Finished = true;
        RoundManager.RoundEndCheck();
    }

    public void UpdateRoundProgress(int round, string progress)
    {
        RoundProgress[round] = progress;
    }

    public static void RoundResetAllTeams()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        foreach(var team in Globals.ALL_TEAMS.Values)
            team.Finished = false;
    }

    private static void TeamSetup()
    {
        if(Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0]) // free pick
        {
            RoundManager.ROUND_INTERMISSION += 15.0f;
            foreach(var player in Globals.ALL_PLAYERS)
            {
                player.DisplayTimedTextTo(RoundManager.ROUND_INTERMISSION - 5.0f, Colors.COLOR_YELLOW_ORANGE + Globals.TEAM_MODES[0] +
                    " has been enabled. Use " + Colors.COLOR_GOLD + "-team <#> " + Colors.COLOR_YELLOW_ORANGE + "to join a team");
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0f, () => TeamHandler.RandomHandler());
        }
        else if(Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1]) // random
            Utility.SimpleTimer(1.0f, () => TeamHandler.RandomHandler());
    }

    private void InitRoundStats()
    {
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            RoundProgress.Add(i, "0.0");
            TeamTimes.Add(i, 0.0f);
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

