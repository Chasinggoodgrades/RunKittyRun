using System;
using WCSharp.Api;

public static class StandardMultiboard
{
    private static multiboard OverallStats;
    private static multiboard CurrentStats;
    private static multiboard BestTimes;
    private static trigger Updater;
    private static trigger ESCTrigger;

    private static string color = Colors.COLOR_YELLOW_ORANGE;
    private static string CurrentTitle = $"Current Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
    private static string OverallTitle = $"Overall Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
    private static string BestTimesTitle = $"Best Times {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        BestTimes = multiboard.Create();
        OverallStats = multiboard.Create();
        CurrentStats = multiboard.Create();
        CreateMultiboards();
        RegisterTriggers();
    }

    private static void RegisterTriggers()
    {
        Updater = trigger.Create();
        ESCTrigger = trigger.Create();

        Updater.RegisterTimerEvent(1.03f, true);
        Updater.AddAction(UpdateStandardCurrentStatsMB);

        foreach(var player in Globals.ALL_PLAYERS)
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        ESCTrigger.AddAction(ESCPressed);
    }

    private static void CreateMultiboards()
    {
        CurrentGameStatsMultiboard();
        OverallGamesStatsMultiboard();
        BestTimesMultiboard();
    }

    /// <summary>
    /// Fills the players going down the rows on most left side of multiboard. Passing thru rowIndex for which starting row.
    /// </summary>
    /// <param name="mb"></param>
    /// <param name="rowIndex"></param>
    private static void FillPlayers(multiboard mb, int rowIndex = 2)
    {
        mb.Rows = Globals.ALL_PLAYERS.Count + 2;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            mb.GetItem(rowIndex, 0).SetText(Colors.PlayerNameColored(player));
            mb.GetItem(rowIndex, 0).SetWidth(0.08f);
            rowIndex++;
        }
    }

    private static void CurrentGameStatsMultiboard()
    {
        CurrentStats.Title = CurrentTitle;
        CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2;
        CurrentStats.Columns = 6;
        CurrentStats.GetItem(0, 0).SetText($"{color}Round Time|r");
        CurrentStats.GetItem(1, 0).SetText($"{color}Player|r");
        CurrentStats.GetItem(1, 1).SetText($"{color}Saves|r");
        CurrentStats.GetItem(1, 2).SetText($"{color}Deaths|r");
        CurrentStats.GetItem(1, 3).SetText($"{color}Streak|r");
        CurrentStats.GetItem(1, 4).SetText($"{color}Ratio|r");
        CurrentStats.GetItem(1, 5).SetText($"{color}S / D|r");
        CurrentStats.SetChildVisibility(true, false);
        CurrentStats.SetChildWidth(0.05f);
        CurrentStats.GetItem(1, 0).SetWidth(0.08f);
        CurrentStats.IsDisplayed = true;
    }

    private static void OverallGamesStatsMultiboard()
    {
        OverallStats.Title = OverallTitle;
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 2;
        OverallStats.Columns = 6;
        OverallStats.GetItem(0, 0).SetText($"{color}Player|r");
        OverallStats.GetItem(0, 1).SetText($"{color}Saves|r");
        OverallStats.GetItem(0, 2).SetText($"{color}Deaths|r");
        OverallStats.GetItem(0, 3).SetText($"{color}MaxStreak|r");
        OverallStats.GetItem(0, 4).SetText($"{color}Ratio|r");
        OverallStats.GetItem(0, 5).SetText($"{color}Games|r");
        OverallStats.GetItem(0, 6).SetText($"{color}Wins|r");
        OverallStats.SetChildVisibility(true, false);
        OverallStats.SetChildWidth(0.05f);
        OverallStats.GetItem(0, 0).SetWidth(0.08f);
        OverallStats.IsDisplayed = false;
        UpdateOverallStatsMB();
    }

    private static void BestTimesMultiboard()
    {

    }

    private static void CurrentStatsRoundTimes()
    {
        var color = Colors.COLOR_GREEN;
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            CurrentStats.GetItem(0, i).SetText($"{color}{Utility.ConvertFloatToTime(GameTimer.RoundTime[i])}|r");
    }

    private static void CurrentGameStats()
    {
        var rowIndex = 2;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var currentStats = Globals.ALL_KITTIES[player].CurrentStats;
            var playerColor = Colors.GetPlayerColor(player.Id+1);

            var totalSaves = currentStats.TotalSaves;
            var totalDeaths = currentStats.TotalDeaths;
            var kda = totalDeaths == 0 ? totalSaves.ToString("F2") : (totalSaves / (double)totalDeaths).ToString("F2");

            var stats = new[] {
                totalSaves.ToString(),
                totalDeaths.ToString(),
                currentStats.SaveStreak.ToString(),
                kda,
                currentStats.RoundSaves + " / " + currentStats.RoundDeaths
            };

            for (int i = 0; i < stats.Length; i++)
                CurrentStats.GetItem(rowIndex, i + 1).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");

            rowIndex++;
        }
    }

    private static void OverallGameStats()
    {
        var rowIndex = 1;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetPlayerColor(player.Id + 1);

            var allSaves = saveData.GameStats[StatTypes.Saves];
            var allDeaths = saveData.GameStats[StatTypes.Deaths];
            var kda = allDeaths == 0 ? allSaves.ToString("F2") : (allSaves / (double)allDeaths).ToString("F2");
            var (games, wins) = GetGameStatData(saveData);

            var stats = new[]
            {
                allSaves.ToString(),
                allDeaths.ToString(),
                saveData.GameStats[StatTypes.HighestSaveStreak].ToString(),
                kda,
                games.ToString(),
                wins.ToString()
            };

            for (int i = 0; i < stats.Length; i++)
                OverallStats.GetItem(rowIndex, i + 1).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");

            rowIndex++;
        }
    }

    public static void UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        FillPlayers(OverallStats, 1);
        OverallGameStats();
    }


    public static void UpdateStandardCurrentStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        FillPlayers(CurrentStats);
        CurrentStatsRoundTimes();
        CurrentGameStats();
    }

    private static (int gameCount, int winCount) GetGameStatData(KittyData data)
    {
        var gameData = data.GameStats;

        var numberOfGames = 0;
        var numberOfWins = 0;

        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                numberOfGames = gameData[StatTypes.NormalGames];
                numberOfWins = gameData[StatTypes.WinsNormal];
                break;
            case (int)DifficultyLevel.Hard:
                numberOfGames = gameData[StatTypes.HardGames];
                numberOfWins = gameData[StatTypes.WinsHard];
                break;
            case (int)DifficultyLevel.Impossible:
                numberOfGames = gameData[StatTypes.ImpossibleGames];
                numberOfWins = gameData[StatTypes.WinsImpossible];
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return (0, 0);
        }
        return (numberOfGames, numberOfWins);
    }

    private static void ESCPressed()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (!@event.Player.IsLocal) return;
        if (CurrentStats.IsDisplayed)
        {
            CurrentStats.IsDisplayed = false;
            OverallStats.IsDisplayed = true;
        }
        else if (OverallStats.IsDisplayed)
        {
            OverallStats.IsDisplayed = false;
            BestTimes.IsDisplayed = true;
        }
        else if (BestTimes.IsDisplayed)
        {
            BestTimes.IsDisplayed = false;
            CurrentStats.IsDisplayed = true;
        }
    }

}