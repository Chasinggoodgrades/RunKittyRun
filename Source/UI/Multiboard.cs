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
    private static multiboard CurrentTeamsMB;
    private static multiboard TeamsStatsMB;
    private static multiboard StandardOverallStatsMB;
    private static multiboard StandardCurrentStatsMB;
    private static multiboard SoloOverallStatsMB;
    private static multiboard SoloBestTimesMB;
    private static trigger ESCTrigger;
    public static void Initialize()
    {
        ESCTrigger = CreateTrigger();
        CreateMultiboards();
        ESCInit();
    }

    private static void CreateMultiboards()
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            TeamsStatsMultiboard();
            CurrentTeamsMultiboard();
        }
    }

    #region Teams Multiboards
    private static void TeamsStatsMultiboard()
    {
        TeamsStatsMB = CreateMultiboard();
        TeamsStatsMB.Title = $"[ESC FOR CURRENT TEAMS] Teams Stats {Color.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]";
        TeamsStatsMB.IsDisplayed = false;
    }
    public static void CurrentTeamsMultiboard()
    {
        CurrentTeamsMB = CreateMultiboard();
        CurrentTeamsMB.Title = $"Current Teams {Color.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]";
        CurrentTeamsMB.IsDisplayed = true;
        CurrentTeamsMB.Rows = Globals.ALL_TEAMS.Count + 1;
        CurrentTeamsMB.Columns = Gamemode.PlayersPerTeam;
        CurrentTeamsMB.GetItem(0, 0).SetText("Team 1");
        CurrentTeamsMB.GetItem(0, 0).SetVisibility(true, false);
        CurrentTeamsMB.GetItem(0, 1).SetText("Player 1");
        CurrentTeamsMB.GetItem(0, 1).SetVisibility(true, false);
    }

    public static void UpdateTeamStatsMB()
    {
        // Top Portion Setup
        TeamsStatsMB.Rows = Globals.ALL_TEAMS.Count + 1;
        TeamsStatsMB.Columns = 2 + Gamemode.NumberOfRounds;
        TeamsStatsMB.GetItem(0, 0).SetText("Team");
        TeamsStatsMB.GetItem(0, 0).SetVisibility(true, false);
        TeamsStatsMB.GetItem(0, 0).SetWidth(0.05f);
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            TeamsStatsMB.GetItem(0, i).SetText($"Round {i}");
            TeamsStatsMB.GetItem(0, i).SetVisibility(true, false);
            TeamsStatsMB.GetItem(0, i).SetWidth(0.05f);
        }
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetText("Overall");
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetVisibility(true, false);
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetWidth(0.05f);


        // Actual Stats
        int rowIndex = 1;
        foreach (var team in Globals.ALL_TEAMS)
        {
            TeamsStatsMB.GetItem(rowIndex, 0).SetText(team.Value.TeamColor);
            TeamsStatsMB.GetItem(rowIndex, 0).SetVisibility(true, false);
            TeamsStatsMB.GetItem(rowIndex, 0).SetWidth(0.05f);
            for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            {
                TeamsStatsMB.GetItem(rowIndex, i).SetText($"{Globals.TEAM_PROGRESS[team.Value]}");
                TeamsStatsMB.GetItem(rowIndex, i).SetVisibility(true, false);
                TeamsStatsMB.GetItem(rowIndex, i).SetWidth(0.05f);
            }
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetText("0");
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetVisibility(true, false);
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetWidth(0.05f);
            rowIndex++;
        }
    }

    public static void UpdateCurrentTeamsMB()
    {
        CurrentTeamsMB.Rows = Globals.ALL_TEAMS.Count;
        CurrentTeamsMB.Columns = 2;

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
            CurrentTeamsMB.GetItem(rowIndex, 0).SetWidth(0.05f);
            CurrentTeamsMB.GetItem(rowIndex, 0).SetText($"{team.Value.TeamColor}:");
            CurrentTeamsMB.GetItem(rowIndex, 0).SetVisibility(true, false);
            CurrentTeamsMB.GetItem(rowIndex, 1).SetWidth(widthSize);
            CurrentTeamsMB.GetItem(rowIndex, 1).SetText($"{teamMembers}");
            CurrentTeamsMB.GetItem(rowIndex, 1).SetVisibility(true, false);

            rowIndex++;
        }
    }
    #endregion

    #region ESC Key Event & Actions
    private static void ESCInit()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            ESCTrigger.RegisterPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC);
        }
        ESCTrigger.AddAction(ESCPressed);

    }

    private static void ESCPressed()
    {
        var player = GetTriggerPlayer();
        if(Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            ESCPressTeams(player);
        }
    }

    private static void ESCPressTeams(player Player)
    {
        var localPlayer = GetLocalPlayer();
        if (localPlayer != Player) return;
        // Swap multiboards
        if(CurrentTeamsMB.IsDisplayed)
        {
            CurrentTeamsMB.IsDisplayed = false;
            TeamsStatsMB.IsDisplayed = true;
        }
        else
        {
            TeamsStatsMB.IsDisplayed = false;
            CurrentTeamsMB.IsDisplayed = true;
        }
    }
    #endregion
}
