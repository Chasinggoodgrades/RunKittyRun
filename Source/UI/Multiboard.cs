using System;
using System.Globalization;
using System.Linq;
using Source.Init;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class Multiboard
{
    private static multiboard TeamsMB;
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
        TeamsMB = CreateMultiboard();
        TeamsMB.Title = $"Current Teams {Color.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]";
        TeamsMB.IsDisplayed = true;
        TeamsMB.Rows = Globals.ALL_TEAMS.Count + 1;
        TeamsMB.Columns = Gamemode.PlayersPerTeam;
        TeamsMB.GetItem(0, 0).SetText("Team 1");
        TeamsMB.GetItem(0, 0).SetVisibility(true, false);
        TeamsMB.GetItem(0, 1).SetText("Player 1");
        TeamsMB.GetItem(0, 1).SetVisibility(true, false);
        var timer = CreateTimer();
        timer.Start(1.0f, false, TeamHandler.RandomHandler);
    }

    public static void UpdateTeamsMultiboard()
    {
        TeamsMB.Rows = Globals.ALL_TEAMS.Count;
        TeamsMB.Columns = 2;
        var widthSize = 0.05f * Gamemode.PlayersPerTeam;

        int rowIndex = 0;
        foreach (var team in Globals.ALL_TEAMS)
        {
            string teamMembers = string.Join(", ", team.Value.Teammembers
                .Where(member => member != null && member.Name != null)
                .Select(member =>
                {
                    string name = member.Name.Split('#')[0];
                    if (name.Length > 7) name = name.Substring(0, 7);
                    return Color.ColorString(name, member.Id + 1);
                }));


            TeamsMB.GetItem(rowIndex, 0).SetWidth(0.05f);
            TeamsMB.GetItem(rowIndex, 0).SetText($"{team.Value.TeamColor}:");
            TeamsMB.GetItem(rowIndex, 0).SetVisibility(true, false);
            TeamsMB.GetItem(rowIndex, 1).SetWidth(widthSize);
            TeamsMB.GetItem(rowIndex, 1).SetText($"{teamMembers}");
            TeamsMB.GetItem(rowIndex, 1).SetVisibility(true, false);


            rowIndex++;
        }
    }

    public static void Update()
    {

    }
}
