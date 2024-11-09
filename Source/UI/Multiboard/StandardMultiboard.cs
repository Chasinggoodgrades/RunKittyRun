using System;
using System.Diagnostics;
using System.Linq;
using System.Linq.Expressions;
using WCSharp.Api;

public static class StandardMultiboard
{
    public static multiboard OverallStats;
    public static multiboard CurrentStats;
    public static multiboard BestTimes;
    private static trigger Updater;
    private static trigger ESCTrigger;

    private static string color = Colors.COLOR_YELLOW_ORANGE;
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        try
        {
            BestTimes = multiboard.Create();
            OverallStats = multiboard.Create();
            CurrentStats = multiboard.Create();
            CreateMultiboards();
            RegisterTriggers();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            Console.WriteLine(e.StackTrace);
            throw;
        }
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
        OverallGamesStatsMultiboard();
        BestTimesMultiboard();
        CurrentGameStatsMultiboard();
    }

    /// <summary>
    /// Fills the players going down the rows on most left side of multiboard. Passing thru rowIndex for which starting row.
    /// </summary>
    /// <param name="mb"></param>
    /// <param name="rowIndex"></param>
    private static void FillPlayers(multiboard mb, int rowIndex = 2)
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            mb.GetItem(rowIndex, 0).SetText(Colors.PlayerNameColored(player));
            mb.GetItem(rowIndex, 0).SetWidth(0.08f);
            rowIndex++;
        }
    }

    private static void CurrentGameStatsMultiboard()
    {
        CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2;
        CurrentStats.Columns = 7;
        CurrentStats.GetItem(0, 0).SetText($"{color}Round Time|r");
        CurrentStats.GetItem(1, 0).SetText($"{color}Player|r");
        CurrentStats.GetItem(1, 1).SetText($"{color}Score|r");
        CurrentStats.GetItem(1, 2).SetText($"{color}Saves|r");
        CurrentStats.GetItem(1, 3).SetText($"{color}Deaths|r");
        CurrentStats.GetItem(1, 4).SetText($"{color}Streak|r");
        CurrentStats.GetItem(1, 5).SetText($"{color}Ratio|r");
        CurrentStats.GetItem(1, 6).SetText($"{color}S / D|r");
        CurrentStats.SetChildVisibility(true, false);
        CurrentStats.SetChildWidth(0.052f);
        CurrentStats.GetItem(1, 0).SetWidth(0.07f);
        CurrentStats.IsDisplayed = true;
    }

    private static void OverallGamesStatsMultiboard()
    {
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 1;
        OverallStats.Columns = 8;
        OverallStats.GetItem(0, 0).SetText($"{color}Player|r");
        OverallStats.GetItem(0, 1).SetText($"{color}Score:|r");
        OverallStats.GetItem(0, 2).SetText($"{color}Saves|r");
        OverallStats.GetItem(0, 3).SetText($"{color}Deaths|r");
        OverallStats.GetItem(0, 4).SetText($"{color}MaxStreak|r");
        OverallStats.GetItem(0, 5).SetText($"{color}  Ratio|r");
        OverallStats.GetItem(0, 6).SetText($"{color}Games|r");
        OverallStats.GetItem(0, 7).SetText($"{color}Wins|r");
        OverallStats.SetChildVisibility(true, false);
        OverallStats.SetChildWidth(0.052f);
        OverallStats.GetItem(0, 0).SetWidth(0.07f);
        OverallStats.IsDisplayed = false;
        UpdateOverallStatsMB();
    }

    private static void BestTimesMultiboard()
    {
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1;
        BestTimes.Columns = 6;
        BestTimes.GetItem(0, 0).SetText($"{color}Player|r");
        BestTimes.GetItem(0, 1).SetText($"{color}Round 1|r");
        BestTimes.GetItem(0, 2).SetText($"{color}Round 2|r");
        BestTimes.GetItem(0, 3).SetText($"{color}Round 3|r");
        BestTimes.GetItem(0, 4).SetText($"{color}Round 4|r");
        BestTimes.GetItem(0, 5).SetText($"{color}Round 5|r");
        BestTimes.SetChildVisibility(true, false);
        BestTimes.SetChildWidth(0.04f);
        BestTimes.GetItem(0, 0).SetWidth(0.07f);
        BestTimes.IsDisplayed = false;
        UpdateBestTimesMB();
    }

    private static void CurrentStatsRoundTimes()
    {
        var color = Colors.COLOR_GREEN;
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            CurrentStats.GetItem(0, i).SetText($"{color}{Utility.ConvertFloatToTime(GameTimer.RoundTime[i])}|r");
    }

    private static void CurrentGameStats()
    {
        CurrentStats.Title = $"Current Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2;
        var rowIndex = 2;

        var sortedPlayers = Globals.ALL_KITTIES.OrderByDescending(kvp => kvp.Value.CurrentStats.TotalSaves - kvp.Value.CurrentStats.TotalDeaths).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

        foreach (var player in sortedPlayers.Keys)
        {
            var currentStats = Globals.ALL_KITTIES[player].CurrentStats;
            var playerColor = Colors.GetPlayerColor(player.Id+1);

            var name = player.Name;
            var totalSaves = currentStats.TotalSaves;
            var totalDeaths = currentStats.TotalDeaths;
            var score = totalSaves - totalDeaths;
            var kda = totalDeaths == 0 ? totalSaves.ToString("F2") : (totalSaves / (double)totalDeaths).ToString("F2");

            var stats = new[] {
                name,
                score.ToString(),
                totalSaves.ToString(),
                totalDeaths.ToString(),
                currentStats.SaveStreak.ToString(),
                kda,
                currentStats.RoundSaves + " / " + currentStats.RoundDeaths
            };

            for (int i = 0; i < stats.Length; i++)
            {
                CurrentStats.GetItem(rowIndex, i).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");
                if (i == 0) CurrentStats.GetItem(rowIndex, i).SetWidth(0.08f);
            }

            rowIndex++;
        }
    }

    private static void OverallGameStats()
    {
        OverallStats.Title = $"Overall Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        var rowIndex = 1;

        var sortedPlayers = Globals.ALL_KITTIES.OrderByDescending(kvp => kvp.Value.SaveData.GameStats[StatTypes.Saves] - kvp.Value.SaveData.GameStats[StatTypes.Deaths]).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

        foreach (var player in sortedPlayers.Keys)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetPlayerColor(player.Id + 1);

            var name = player.Name;
            var allSaves = saveData.GameStats[StatTypes.Saves];
            var allDeaths = saveData.GameStats[StatTypes.Deaths];
            var score = allSaves - allDeaths;
            var kda = allDeaths == 0 ? allSaves.ToString("F2") : (allSaves / (double)allDeaths).ToString("F2");
            var (games, wins) = GetGameStatData(saveData);

            var stats = new[]
            {
                name,
                score.ToString(),
                allSaves.ToString(),
                allDeaths.ToString(),
                saveData.GameStats[StatTypes.HighestSaveStreak].ToString(),
                kda,
                games.ToString(),
                wins.ToString()
            };

            for (int i = 0; i < stats.Length; i++) {
                OverallStats.GetItem(rowIndex, i).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");
                if (i == 0) OverallStats.GetItem(rowIndex, i).SetWidth(0.08f);
            }

            rowIndex++;
        }
    }

    private static void BestTimesStats()
    {
        BestTimes.Title = $"Best Times {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        var rowIndex = 1;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetPlayerColor(player.Id + 1);

            var roundTimes = GetGameRoundTime(saveData);

            for (int i = 0; i < roundTimes.Length; i++)
            {
                if(roundTimes[i] != 0)
                    BestTimes.GetItem(rowIndex, i + 1).SetText($"{playerColor}{Utility.ConvertFloatToTime(roundTimes[i])}{Colors.COLOR_RESET}");
                else
                    BestTimes.GetItem(rowIndex, i + 1).SetText($"{playerColor}---{Colors.COLOR_RESET}");
            }
            rowIndex++;
        }
    }
    public static void UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        OverallGameStats();
    }


    public static void UpdateStandardCurrentStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        CurrentStatsRoundTimes();
        CurrentGameStats();
    }

    public static void UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        FillPlayers(BestTimes, 1);
        BestTimesStats();
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

    private static int[] GetGameRoundTime(KittyData data)
    {
        var gameData = data.GameTimes;
        var roundTimes = new int[5];

        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                roundTimes[0] = gameData[RoundTimes.ROneNormal];
                roundTimes[1] = gameData[RoundTimes.RTwoNormal];
                roundTimes[2] = gameData[RoundTimes.RThreeNormal];
                roundTimes[3] = gameData[RoundTimes.RFourNormal];
                roundTimes[4] = gameData[RoundTimes.RFiveNormal];
                break;
            case (int)DifficultyLevel.Hard:
                roundTimes[0] = gameData[RoundTimes.ROneHard];
                roundTimes[1] = gameData[RoundTimes.RTwoHard];
                roundTimes[2] = gameData[RoundTimes.RThreeHard];
                roundTimes[3] = gameData[RoundTimes.RFourHard];
                roundTimes[4] = gameData[RoundTimes.RFiveHard];
                break;
            case (int)DifficultyLevel.Impossible:
                roundTimes[0] = gameData[RoundTimes.ROneImpossible];
                roundTimes[1] = gameData[RoundTimes.RTwoImpossible];
                roundTimes[2] = gameData[RoundTimes.RThreeImpossible];
                roundTimes[3] = gameData[RoundTimes.RFourImpossible];
                roundTimes[4] = gameData[RoundTimes.RFiveImpossible];
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return new int[5];
        }
        return roundTimes;

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