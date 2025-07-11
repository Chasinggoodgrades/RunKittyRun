using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Team
{
    public int TeamID { get; private set; }
    public string TeamColor { get; private set; }
    public Dictionary<int, float> TeamTimes { get; set; }
    public List<player> Teammembers { get; private set; }
    public string TeamMembersString { get; private set; }
    public Dictionary<int, string> RoundProgress { get; private set; }
    public bool Finished { get; set; }
    private static timer TeamTimer { get; set; }

    public Team(int id)
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

    public static void Initialize()
    {
        Globals.ALL_TEAMS = new Dictionary<int, Team>();
        Globals.ALL_TEAMS_LIST = new List<Team>();
        Globals.PLAYERS_TEAMS = new Dictionary<player, Team>();
        TeamTimer = timer.Create();
        TeamTimer.Start(0.1f, false, ErrorHandler.Wrap(TeamSetup));
    }

    public void AddMember(player player)
    {
        AssignTeamMember(player, true);
        Globals.PLAYERS_TEAMS.Add(player, this);
        TeamsUtil.UpdateTeamsMB();
    }

    public void RemoveMember(player player)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        if (!Globals.PLAYERS_TEAMS.ContainsKey(player)) return;
        AssignTeamMember(player, false);
        if (Teammembers.Count == 0)
        {
            Globals.ALL_TEAMS.Remove(TeamID);
            Globals.ALL_TEAMS_LIST.Remove(this);
        }
        TeamsUtil.UpdateTeamsMB();
    }

    public void TeamIsDeadActions()
    {
        for (int i = 0; i < Teammembers.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES[Teammembers[i]];
            kitty.Finished = true;
        }
        Finished = true;
        RoundManager.RoundEndCheck();
    }

    public void UpdateRoundProgress(int round, string progress)
    {
        RoundProgress[round] = progress;
    }

    private void InitRoundStats()
    {
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            RoundProgress.Add(i, "0.0");
            TeamTimes.Add(i, 0.0f);
        }
    }

    public static void UpdateTeamsMB()
    {
        var t = timer.Create();
        t.Start(0.1f, false, ErrorHandler.Wrap(() =>
        {
            TeamsMultiboard.UpdateCurrentTeamsMB();
            TeamsMultiboard.UpdateTeamStatsMB();
            t.Dispose();
        }));
    }

    private static void TeamSetup()
    {
        if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[0]) // free pick
        {
            RoundManager.ROUND_INTERMISSION += 15.0f;
            TeamHandler.FreepickEnabled = true;
            foreach (var player in Globals.ALL_PLAYERS)
            {
                player.DisplayTimedTextTo(RoundManager.ROUND_INTERMISSION - 5.0f, Colors.COLOR_YELLOW_ORANGE + Globals.TEAM_MODES[0] +
                    " has been enabled. Use " + Colors.COLOR_GOLD + "-team <#> " + Colors.COLOR_YELLOW_ORANGE + "to join a team");
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0f, TeamHandler.RandomHandler);
        }
        else if (Gamemode.CurrentGameModeType == Globals.TEAM_MODES[1]) // random
            Utility.SimpleTimer(2.5f, TeamHandler.RandomHandler);
    }

    /// <summary>
    /// Assigns or removes a player from a team and updates their color accordingly.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="adding"></param>
    private void AssignTeamMember(player player, bool adding)
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
        for (int i = 0; i < Teammembers.Count; i++)
        {
            var member = Teammembers[i];
            string name = member.Name.Split('#')[0];
            if (name.Length > 7)
                name = name.Substring(0, 7);

            if (TeamMembersString.Length > 0)
                TeamMembersString += ", ";

            TeamMembersString += name;
        }
    }

}
