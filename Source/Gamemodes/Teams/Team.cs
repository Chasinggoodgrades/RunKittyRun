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
    }

    public void AddMember(player player)
    {
        Teammembers.Add(player);
        Globals.PLAYERS_TEAMS.Add(player, this);
        Globals.ALL_KITTIES[player].TeamID = TeamID;
        Multiboard.UpdateTeamsMultiboard();
    }

    public void RemoveMember(player player)
    {
        Teammembers.Remove(player);
        Globals.PLAYERS_TEAMS.Remove(player);
        Globals.ALL_KITTIES[player].TeamID = 0;
        if (Teammembers.Count == 0)
        {
            Globals.ALL_TEAMS.Remove(TeamID);
        }
        Multiboard.UpdateTeamsMultiboard();
    }
}

