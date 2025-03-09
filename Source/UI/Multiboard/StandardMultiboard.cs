using System;
using System.Linq;
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
        BestTimes = multiboard.Create();
        OverallStats = multiboard.Create();
        CurrentStats = multiboard.Create();
        Init();
    }

    /// <summary>
    /// Wait till difficulty is chosen, then begin..
    /// </summary>
    private static void Init()
    {
        var t = timer.Create();
        t.Start(1.0f, true, () =>
        {
            if (!Difficulty.IsDifficultyChosen) return;
            MakeMultiboard();
            RegisterTriggers();
            GC.RemoveTimer(ref t);
        });
    }

    private static void RegisterTriggers()
    {
        Updater = trigger.Create();
        ESCTrigger = trigger.Create();

        _ = Updater.RegisterTimerEvent(1.00f, true);
        _ = Updater.AddAction(CurrentStatsRoundTimes);

        foreach (var player in Globals.ALL_PLAYERS)
            _ = ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        _ = ESCTrigger.AddAction(ESCPressed);
    }

    private static void MakeMultiboard()
    {
        OverallGamesStatsMultiboard();
        BestTimesMultiboard();
        CurrentGameStatsMultiboard();
        CurrentGameStats();
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
        CurrentStats.SetChildWidth(0.055f);
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
        BestTimes.SetChildWidth(0.05f);
        BestTimes.GetItem(0, 0).SetWidth(0.07f);
        BestTimes.IsDisplayed = false;
        UpdateBestTimesMB();
    }

    private static void CurrentStatsRoundTimes()
    {
        var color = Colors.COLOR_GREEN;
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            CurrentStats.GetItem(0, i).SetText($"{color}{Utility.ConvertFloatToTimeInt(GameTimer.RoundTime[i])}|r");
        }
    }

    private static void CurrentGameStats()
    {
        try
        {
            CurrentStats.Title = $"Current Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
            CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2;
            var rowIndex = 2;

            // Array to hold keys for manual sorting
            var players = Globals.ALL_KITTIES.Keys.ToArray();

            // Sort the array of keys based on custom criteria
            Array.Sort(players, (p1, p2) =>
            {
                var stats1 = Globals.ALL_KITTIES[p1].CurrentStats;
                var stats2 = Globals.ALL_KITTIES[p2].CurrentStats;
                var score1 = stats1.TotalSaves - stats1.TotalDeaths;
                var score2 = stats2.TotalSaves - stats2.TotalDeaths;

                int compareScore = score2.CompareTo(score1);
                return compareScore != 0 ? compareScore : p1.Id.CompareTo(p2.Id);
            });

            foreach (var player in players)
            {
                var currentStats = Globals.ALL_KITTIES[player].CurrentStats;
                var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

                var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
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
                    if (i == 0) CurrentStats.GetItem(rowIndex, i).SetWidth(0.07f);
                }

                rowIndex++;
            }

            players = null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{Colors.COLOR_DARK_RED}Error in CurrentGameStats multiboard: {ex.Message}");
        }
    }



    private static void OverallGameStats()
    {
        OverallStats.Title = $"Overall Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        // Use an array to hold keys for sorting
        var players = Globals.ALL_KITTIES.Keys.ToArray();

        // Sort the array of keys based on custom criteria
        Array.Sort(players, (p1, p2) =>
        {
            var stats1 = Globals.ALL_KITTIES[p1].SaveData.GameStats;
            var stats2 = Globals.ALL_KITTIES[p2].SaveData.GameStats;
            var score1 = stats1.Saves - stats1.Deaths;
            var score2 = stats2.Saves - stats2.Deaths;

            int compareScore = score2.CompareTo(score1);
            return compareScore != 0 ? compareScore : p1.Id.CompareTo(p2.Id);
        });

        foreach (var player in players)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

            var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            var allSaves = saveData.GameStats.Saves;
            var allDeaths = saveData.GameStats.Deaths;
            var score = allSaves - allDeaths;
            var kda = allDeaths == 0 ? allSaves.ToString("F2") : (allSaves / (double)allDeaths).ToString("F2");
            var (games, wins) = GetGameStatData(saveData);

            var stats = new[]
            {
            name,
            score.ToString(),
            allSaves.ToString(),
            allDeaths.ToString(),
            saveData.GameStats.HighestSaveStreak.ToString(),
            kda,
            games.ToString(),
            wins.ToString()
        };

            for (int i = 0; i < stats.Length; i++)
            {
                OverallStats.GetItem(rowIndex, i).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");
                if (i == 0) OverallStats.GetItem(rowIndex, i).SetWidth(0.07f);
            }

            rowIndex++;
        }
    }



    private static void BestTimesStats()
    {
        BestTimes.Title = $"Best Times {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyChosen}]|r {Colors.COLOR_RED}[Press ESC]|r";
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

            var roundTimes = GetGameRoundTime(saveData);

            for (int i = 0; i < roundTimes.Length; i++)
            {
                if (roundTimes[i] != 0)
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
        CurrentGameStats();
    }

    public static void UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        MultiboardUtil.FillPlayers(BestTimes, 1);
        BestTimesStats();
    }

    private static (int gameCount, int winCount) GetGameStatData(KittyData data)
    {
        var gameData = data.GameStats;
        int numberOfGames;
        int numberOfWins;
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                numberOfGames = gameData.NormalGames;
                numberOfWins = gameData.NormalWins;
                break;
            case (int)DifficultyLevel.Hard:
                numberOfGames = gameData.HardGames;
                numberOfWins = gameData.HardWins;
                break;
            case (int)DifficultyLevel.Impossible:
                numberOfGames = gameData.ImpossibleGames;
                numberOfWins = gameData.ImpossibleWins;
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return (0, 0);
        }
        return (numberOfGames, numberOfWins);
    }

    private static float[] GetGameRoundTime(KittyData data)
    {
        var gameData = data.RoundTimes;
        var roundTimes = new float[5];

        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                roundTimes[0] = gameData.RoundOneNormal;
                roundTimes[1] = gameData.RoundTwoNormal;
                roundTimes[2] = gameData.RoundThreeNormal;
                roundTimes[3] = gameData.RoundFourNormal;
                roundTimes[4] = gameData.RoundFiveNormal;
                break;
            case (int)DifficultyLevel.Hard:
                roundTimes[0] = gameData.RoundOneHard;
                roundTimes[1] = gameData.RoundTwoHard;
                roundTimes[2] = gameData.RoundThreeHard;
                roundTimes[3] = gameData.RoundFourHard;
                roundTimes[4] = gameData.RoundFiveHard;
                break;
            case (int)DifficultyLevel.Impossible:
                roundTimes[0] = gameData.RoundOneImpossible;
                roundTimes[1] = gameData.RoundTwoImpossible;
                roundTimes[2] = gameData.RoundThreeImpossible;
                roundTimes[3] = gameData.RoundFourImpossible;
                roundTimes[4] = gameData.RoundFiveImpossible;
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return new float[5];
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