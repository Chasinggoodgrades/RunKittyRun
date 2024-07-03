using System;
using System.Globalization;
using Source.Init;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class Multiboard
{
    private static multiboard TeamsMB = CreateMultiboard();
    public static void Initialize()
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

    public static void TeamsMultiboard()
    {
        TeamsMB.Title = "Current Teams";
        TeamsMB.IsDisplayed = true;
        TeamsMB.Rows = Globals.ALL_TEAMS.Count + 1;
        TeamsMB.Columns = Gamemode.PlayersPerTeam;
        TeamsMB.GetItem(0, 0).SetText("Team 1");
        TeamsMB.GetItem(0, 0).SetVisibility(true, false);
        TeamsMB.GetItem(0, 1).SetText("Player 1");
        TeamsMB.GetItem(0, 1).SetVisibility(true, false);

    }

    public static void UpdateTeamsMultiboard()
    {
        TeamsMB.Rows = Globals.ALL_TEAMS.Count;
        TeamsMB.Columns = Gamemode.PlayersPerTeam + 1;

        int rowIndex = 0;
        foreach (var team in Globals.ALL_TEAMS )
        {
            // Set team ID in the first column of the current row
            TeamsMB.GetItem(rowIndex, 0).SetWidth(0.05f);
            TeamsMB.GetItem(rowIndex, 0).SetText(team.Value.TeamColor);
            TeamsMB.GetItem(rowIndex, 0).SetVisibility(true, false);

            int colIndex = 1; // Start from the second column for team members
            foreach (var member in team.Value.Teammembers)
            {
                if (member != null && member.Name != null)
                {
                    TeamsMB.GetItem(rowIndex, colIndex).SetWidth(0.05f);
                    TeamsMB.GetItem(rowIndex, colIndex).SetText(Color.PlayerNameColored(member));
                    TeamsMB.GetItem(rowIndex, colIndex).SetVisibility(true, false);
                }
                colIndex++;
                if (colIndex >= Gamemode.PlayersPerTeam + 1)
                {
                    break; // Just incase ... i guess 
                }
            }

            // Fills the remaining columns with empty strings
            for (int j = colIndex; j < Gamemode.PlayersPerTeam + 1; j++)
            {
                TeamsMB.GetItem(rowIndex, colIndex).SetWidth(0.05f);
                TeamsMB.GetItem(rowIndex, j).SetText("");
                TeamsMB.GetItem(rowIndex, j).SetVisibility(true, false);
            }

            rowIndex++;
        }
    }



    public static void Update()
    {

    }
}
