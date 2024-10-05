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
        if (Gamemode.CurrentGameMode == "Standard")
        {

        }
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            TeamsStatsMultiboard();
            CurrentTeamsMultiboard();
        }
    }

    #region Standard Multiboards

    private static void CurrentGameStatsMultiboard()
    {

    }

    private static void OverallGameStatsMultiboard()
    {

    }

    private static void BestTimesMultiboard()
    {

    }

    #endregion

    #region Teams Multiboards
    private static void TeamsStatsMultiboard()
    {
        TeamsStatsMB = CreateMultiboard();
        TeamsStatsMB.Title = $"Teams Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        TeamsStatsMB.IsDisplayed = false;
    }
    public static void CurrentTeamsMultiboard()
    {
        CurrentTeamsMB = CreateMultiboard();
        CurrentTeamsMB.Title = $"Current Teams {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
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
        TeamsStatsMB.Columns = 3 + Gamemode.NumberOfRounds;
        TeamsStatsMB.GetItem(0, 0).SetText("Team");
        TeamsStatsMB.GetItem(0, 0).SetVisibility(true, false);
        TeamsStatsMB.GetItem(0, 0).SetWidth(0.05f);
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            if(Globals.ROUND == i)
                TeamsStatsMB.GetItem(0, i).SetText($"|c0000FF00Round {i}|r");
            else
                TeamsStatsMB.GetItem(0, i).SetText($"Round {i}");
            TeamsStatsMB.GetItem(0, i).SetVisibility(true, false);
            TeamsStatsMB.GetItem(0, i).SetWidth(0.05f);
        }
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetText(Colors.COLOR_GOLD + "Overall");
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetVisibility(true, false);
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 1).SetWidth(0.05f);
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetText(Colors.COLOR_GOLD + "Time");
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetVisibility(true, false);
        TeamsStatsMB.GetItem(0, Gamemode.NumberOfRounds + 2).SetWidth(0.05f);

        // Actual Stats
        int rowIndex = 1;
        float overallProgress;
        foreach (var team in Globals.ALL_TEAMS)
        {
            // Team Name / Colors
            overallProgress = 0.0f;
            TeamsStatsMB.GetItem(rowIndex, 0).SetText(team.Value.TeamColor);
            TeamsStatsMB.GetItem(rowIndex, 0).SetVisibility(true, false);
            TeamsStatsMB.GetItem(rowIndex, 0).SetWidth(0.05f);
            // Each Round Progress
            for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            {
                TeamsStatsMB.GetItem(rowIndex, i).SetText("_");
                TeamsStatsMB.GetItem(rowIndex, i).SetText($"{team.Value.RoundProgress[i]}%");
                TeamsStatsMB.GetItem(rowIndex, i).SetVisibility(true, false);
                TeamsStatsMB.GetItem(rowIndex, i).SetWidth(0.05f);
            }
            // Overall Progress
            for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            {
                overallProgress = overallProgress + float.Parse(team.Value.RoundProgress[i], CultureInfo.InvariantCulture);
            }
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetText((overallProgress / Gamemode.NumberOfRounds).ToString("F2") + "%");
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetVisibility(true, false);
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 1).SetWidth(0.05f);

            // Overall Time
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetText(Utility.ConvertFloatToTime(GameTimer.TeamTotalTime(team.Value), team.Value.TeamID));
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetVisibility(true, false);
            TeamsStatsMB.GetItem(rowIndex, Gamemode.NumberOfRounds + 2).SetWidth(0.05f);
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
                    return Colors.ColorString(name, member.Id + 1);
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
