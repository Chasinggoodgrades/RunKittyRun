using WCSharp.Api;

public static class StandardMultiboard
{
    private static multiboard StandardOverallStatsMB;
    private static multiboard StandardCurrentStatsMB;
    private static trigger ESCTrigger;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        StandardCurrentStatsMB = multiboard.Create();

        CurrentGameStatsMultiboard();
    }

    private static void CurrentGameStatsMultiboard()
    {
        StandardCurrentStatsMB.Title = $"Current Game Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        StandardCurrentStatsMB.Rows = Globals.ALL_PLAYERS.Count + 2;
        StandardCurrentStatsMB.Columns = 5;
        CurrentStatsRoundTimes();
        StandardCurrentStatsMB.GetItem(1, 0).SetText("Player");
        StandardCurrentStatsMB.GetItem(1, 0).SetVisibility(true, false);
        StandardCurrentStatsMB.GetItem(1, 1).SetText("Saves");
        StandardCurrentStatsMB.GetItem(1, 1).SetVisibility(true, false);
        StandardCurrentStatsMB.GetItem(1, 2).SetText("Deaths");
        StandardCurrentStatsMB.GetItem(1, 2).SetVisibility(true, false);
        StandardCurrentStatsMB.GetItem(1, 3).SetText("Streak");
        StandardCurrentStatsMB.GetItem(1, 3).SetVisibility(true, false);
        StandardCurrentStatsMB.GetItem(1, 4).SetText("Ratio");
        StandardCurrentStatsMB.GetItem(1, 4).SetVisibility(true, false);
        StandardCurrentStatsMB.GetItem(0, 0).SetText("Round Time");
        StandardCurrentStatsMB.GetItem(0, 0).SetVisibility(true, false);

        StandardCurrentStatsMB.SetChildVisibility(true, false);

        StandardCurrentStatsMB.IsDisplayed = true;
    }
    private static void CurrentStatsRoundTimes()
    {
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            StandardCurrentStatsMB.GetItem(0, i).SetText($"{Colors.COLOR_GREEN}{GameTimer.RoundTime[i]}{Colors.COLOR_RESET}");
            StandardCurrentStatsMB.GetItem(0, i).SetVisibility(true, false);
        }
    }

    private static void OverallGameStatsMultiboard()
    {

    }

    private static void BestTimesMultiboard()
    {

    }

    private static void UpdateStandardCurrentStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        StandardCurrentStatsMB.Rows = Globals.ALL_PLAYERS.Count + 1;
        StandardCurrentStatsMB.Columns = 3;

        int rowIndex = 1;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            StandardCurrentStatsMB.GetItem(rowIndex, 0).SetText(player.Name);
            StandardCurrentStatsMB.GetItem(rowIndex, 0).SetVisibility(true, false);
            //StandardCurrentStatsMB.GetItem(rowIndex, 1).SetText(Utility.ConvertFloatToTime(GameTimer.PlayerTotalTime(player), player.Id));
            StandardCurrentStatsMB.GetItem(rowIndex, 1).SetVisibility(true, false);
            //StandardCurrentStatsMB.GetItem(rowIndex, 2).SetText(player.Deaths.ToString());
            StandardCurrentStatsMB.GetItem(rowIndex, 2).SetVisibility(true, false);
            rowIndex++;
        }
    }
}