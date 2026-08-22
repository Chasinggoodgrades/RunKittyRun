using System.Globalization;
using System.Linq;
using WCSharp.Api;

public static class TeamsMultiboard
{
    private static multiboard CurrentTeamsMB;
    private static multiboard TeamsStatsMB;
    private static trigger ESCTrigger;

    public static void Initialize()
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.Team) return;
            ESCTrigger ??= trigger.Create();
            TeamsMultiboardInit();
            ESCInit();
        }
        catch (System.Exception e)
        {
            Logger.Critical($"Error in TeamsMultiboard.Initialize: {e.Message}");
            throw;
        }
    }

    private static void TeamsMultiboardInit()
    {
        TeamsStatsMultiboard();
        CurrentTeamsMultiboard();
    }

    #region Teams Multiboards

    private static void TeamsStatsMultiboard()
    {
        TeamsStatsMB ??= multiboard.Create();
        TeamsStatsMB.Title = $"Teams Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        TeamsStatsMB.IsDisplayed = false;
    }

    public static void CurrentTeamsMultiboard()
    {
        CurrentTeamsMB ??= multiboard.Create();
        CurrentTeamsMB.Title = $"Current Teams {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        CurrentTeamsMB.IsDisplayed = true;
        CurrentTeamsMB.Rows = TeamRegistry.All.Count + 1;
        CurrentTeamsMB.Columns = Gamemode.PlayersPerTeam;

        // Header row – properly dispose every item
        var item = CurrentTeamsMB.GetItem(0, 0);
        item.SetText("Team 1");
        item.SetVisibility(true, false);
        item.Dispose();
        item = null;

        item = CurrentTeamsMB.GetItem(0, 1);
        item.SetText("Player 1");
        item.SetVisibility(true, false);
        item.Dispose();
        item = null;
    }

    public static void UpdateTeamStatsMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.Team) return;

        TeamsStatsMB.Rows = TeamRegistry.All.Count + 1;
        TeamsStatsMB.Columns = 3 + Gamemode.NumberOfRounds;

        // Header row
        SetItem(TeamsStatsMB, 0, 0, "Team", 0.05f);

        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            string text = Globals.ROUND == i
                ? $"|c0000FF00Round {i}|r"
                : $"Round {i}";
            SetItem(TeamsStatsMB, 0, i, text, 0.05f);
        }

        SetItem(TeamsStatsMB, 0, Gamemode.NumberOfRounds + 1, Colors.COLOR_GOLD + "Overall", 0.05f);
        SetItem(TeamsStatsMB, 0, Gamemode.NumberOfRounds + 2, Colors.COLOR_GOLD + "Time", 0.05f);

        // Team rows
        int rowIndex = 1;
        var allTeams = TeamRegistry.All;

        for (int i = 0; i < allTeams.Count; i++)
        {
            var team = allTeams[i];
            float overallProgress = 0f;

            SetItem(TeamsStatsMB, rowIndex, 0, team.TeamColor, 0.05f);

            for (int j = 1; j <= Gamemode.NumberOfRounds; j++)
            {
                // Only one GetItem + one SetText now
                SetItem(TeamsStatsMB, rowIndex, j, $"{team.RoundProgress[j]}%", 0.05f);
                overallProgress += float.Parse(team.RoundProgress[j], CultureInfo.InvariantCulture);
            }

            string overallText = (overallProgress / Gamemode.NumberOfRounds).ToString("F2", CultureInfo.InvariantCulture) + "%";
            SetItem(TeamsStatsMB, rowIndex, Gamemode.NumberOfRounds + 1, overallText, 0.05f);

            string timeText = Utility.ConvertFloatToTime(GameTimer.TeamTotalTime(team), team.TeamID);
            SetItem(TeamsStatsMB, rowIndex, Gamemode.NumberOfRounds + 2, timeText, 0.05f);

            rowIndex++;
        }
    }

    public static void UpdateCurrentTeamsMB()
    {
        var allTeams = TeamRegistry.All;
        CurrentTeamsMB.Rows = allTeams.Count;
        CurrentTeamsMB.Columns = 2;

        float widthSize = 0.05f * Gamemode.PlayersPerTeam;
        int rowIndex = 0;

        for (int i = 0; i < allTeams.Count; i++)
        {
            var team = allTeams[i];
            string teamMembers = team.TeamMembersString;

            SetItem(CurrentTeamsMB, rowIndex, 0, $"{team.TeamColor}:", 0.05f);
            SetItem(CurrentTeamsMB, rowIndex, 1, teamMembers, widthSize);

            rowIndex++;
        }
    }

    /// <summary>
    /// Helper that gets an item, configures it, then immediately disposes the handle.
    /// </summary>
    private static void SetItem(multiboard board, int row, int column, string text, float width)
    {
        var item = board.GetItem(row, column);
        item.SetText(text);
        item.SetVisibility(true, false);
        item.SetWidth(width);
        item.Dispose();
        item = null;
    }

    #endregion Teams Multiboards

    #region ESC Key Event & Actions

    private static void ESCInit()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        }
        ESCTrigger.AddAction(ErrorHandler.Wrap(ESCPressed));
    }

    private static void ESCPressed()
    {
        var player = @event.Player;
        var localPlayer = player.LocalPlayer;
        if (localPlayer != player) return;

        if (CurrentTeamsMB.IsDisplayed)
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

    #endregion ESC Key Event & Actions
}
