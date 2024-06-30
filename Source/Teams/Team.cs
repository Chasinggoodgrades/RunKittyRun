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
    private int TeamID {  get; set; }
    private group Teammembers { get; set; }

    public Team(int id)
    {
        TeamID = id;
        Teammembers = CreateGroup();
    }

    public void AddMember(player player)
    {
        Teammembers.Add(Globals.ALL_KITTIES[player].Unit);
    }

    public void RemoveMember(player player)
    {
        Teammembers.Remove(Globals.ALL_KITTIES[player].Unit);
        if(Teammembers.Count == 0)
        {
            Teammembers.Dispose();
        }
    }

    public static void SetupTeams()
    {
        multiboard mb = CreateMultiboard();
        mb.Title = "Teams";
        mb.SetChildText("Team 1");
        mb.Rows = 5;
        mb.Columns = 2;
        mb.IsDisplayed = true;
        mb.GetItem(1, 1).SetWidth(4.0f);
        mb.GetItem(1, 1).SetText("Team 1");
    }
}

