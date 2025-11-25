using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class StandardMultiboard
{
    public static multiboard OverallStats;
    public static multiboard CurrentStats;
    public static multiboard BestTimes;
    private static trigger Updater;
    private static trigger ESCTrigger;

    private static string color = Colors.COLOR_YELLOW_ORANGE;
    private static string[] PlayerStats = new string[8];
    private static float[] RoundTimes = new float[5];
    private static List<player> PlayersList = new List<player>();

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
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
        var t = ObjectPool<AchesTimers>.GetEmptyObject();
        t.Timer.Start(1.0f, true, ErrorHandler.Wrap(() =>
        {
            if (!Difficulty.IsDifficultyChosen) return;
            MakeMultiboard();
            RegisterTriggers();
            t.Dispose();
        }));
    }

    private static void RegisterTriggers()
    {
        Updater = trigger.Create();
        ESCTrigger = trigger.Create();

        Updater.RegisterTimerEvent(1.00f, true);
        Updater.AddAction(CurrentStatsRoundTimes);

        foreach (var player in Globals.ALL_PLAYERS)
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        ESCTrigger.AddAction(ESCPressed);
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
        var roundColor = Colors.COLOR_GREEN;
        var totalColor = Colors.COLOR_YELLOW_ORANGE;
        var totalTime = 0.0f;
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            CurrentStats.GetItem(0, i).SetText($"{roundColor}{Utility.ConvertFloatToTimeInt(GameTimer.FinishedTimes[i])}|r");
            totalTime += GameTimer.FinishedTimes[i];
        }
        CurrentStats.GetItem(0, Gamemode.NumberOfRounds + 1).SetText($"{totalColor}{Utility.ConvertFloatToTimeInt(totalTime)}|r");

    }

    private static void CurrentGameStats()
    {
        try
        {
            CurrentStats.Title = $"Current Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[Press ESC]|r";
            CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2;
            var rowIndex = 2;

            // Use a list to hold keys for manual sorting
            PlayersList.Clear();

            for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
            {
                PlayersList.Add(Globals.ALL_PLAYERS[i]);
            }

            // Sort the array of keys based on custom criteria
            for (int i = 0; i < PlayersList.Count; i++)
            {
                for (int j = i + 1; j < PlayersList.Count; j++)
                {
                    var stats1 = Globals.ALL_KITTIES[PlayersList[i]].CurrentStats;
                    var stats2 = Globals.ALL_KITTIES[PlayersList[j]].CurrentStats;
                    var score1 = stats1.TotalSaves - stats1.TotalDeaths;
                    var score2 = stats2.TotalSaves - stats2.TotalDeaths;

                    if (score2 > score1 || (score2 == score1 && PlayersList[j].Id < PlayersList[i].Id))
                    {
                        var temp = PlayersList[i];
                        PlayersList[i] = PlayersList[j];
                        PlayersList[j] = temp;
                    }
                }
            }

            for (int i = 0; i < PlayersList.Count; i++)
            {
                var player = PlayersList[i];
                var currentStats = Globals.ALL_KITTIES[player].CurrentStats;
                var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

                var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
                var score = currentStats.TotalSaves - currentStats.TotalDeaths;
                var kda = currentStats.TotalDeaths == 0
                    ? currentStats.TotalSaves.ToString("F2")
                    : (currentStats.TotalSaves / (double)currentStats.TotalDeaths).ToString("F2");

                PlayerStats[0] = name;
                PlayerStats[1] = score.ToString();
                PlayerStats[2] = currentStats.TotalSaves.ToString();
                PlayerStats[3] = currentStats.TotalDeaths.ToString();
                PlayerStats[4] = currentStats.SaveStreak.ToString();
                PlayerStats[5] = kda;
                PlayerStats[6] = $"{currentStats.RoundSaves} / {currentStats.RoundDeaths}";

                for (int j = 0; j < PlayerStats.Length - 1; j++) // skip last element
                {
                    CurrentStats.GetItem(rowIndex, j).SetText($"{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}");
                    if (j == 0) CurrentStats.GetItem(rowIndex, j).SetWidth(0.07f);
                }

                rowIndex++;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{Colors.COLOR_DARK_RED}Error in CurrentGameStats multiboard: {ex.Message}");
        }
    }

    private static void OverallGameStats()
    {
        OverallStats.Title = $"Overall Stats {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[Press ESC]|r";
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        PlayersList.Clear();
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            PlayersList.Add(Globals.ALL_PLAYERS[i]);
        }

        // Sort the array of keys based on custom criteria
        for (int i = 0; i < PlayersList.Count; i++)
        {
            for (int j = i + 1; j < PlayersList.Count; j++)
            {
                var stats1 = Globals.ALL_KITTIES[PlayersList[i]].SaveData.GameStats;
                var stats2 = Globals.ALL_KITTIES[PlayersList[j]].SaveData.GameStats;
                var score1 = stats1.Saves - stats1.Deaths;
                var score2 = stats2.Saves - stats2.Deaths;

                if (score2 > score1 || (score2 == score1 && PlayersList[j].Id < PlayersList[i].Id))
                {
                    var temp = PlayersList[i];
                    PlayersList[i] = PlayersList[j];
                    PlayersList[j] = temp;
                }
            }
        }

        for(int i = 0; i < PlayersList.Count; i++)
        {
            var player = PlayersList[i];
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

            var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            var allSaves = saveData.GameStats.Saves;
            var allDeaths = saveData.GameStats.Deaths;
            var score = allSaves - allDeaths;
            var kda = allDeaths == 0 ? allSaves.ToString("F2") : (allSaves / (double)allDeaths).ToString("F2");
            var (games, wins) = GetGameStatData(saveData);

            PlayerStats[0] = name;
            PlayerStats[1] = score.ToString();
            PlayerStats[2] = allSaves.ToString();
            PlayerStats[3] = allDeaths.ToString();
            PlayerStats[4] = saveData.GameStats.HighestSaveStreak.ToString();
            PlayerStats[5] = kda;
            PlayerStats[6] = games.ToString();
            PlayerStats[7] = wins.ToString();

            for (int j = 0; j < PlayerStats.Length; j++)
            {
                OverallStats.GetItem(rowIndex, j).SetText($"{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}");
                if (j == 0) OverallStats.GetItem(rowIndex, j).SetWidth(0.07f);
            }

            rowIndex++;
        }
    }

    private static void BestTimesStats()
    {
        BestTimes.Title = $"Best Times {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[Press ESC]|r";
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

            var roundTimes = GetGameRoundTime(saveData);

            for (int j = 0; j < roundTimes.Length; j++)
            {
                if (roundTimes[j] != 0)
                    BestTimes.GetItem(rowIndex, j + 1).SetText($"{playerColor}{Utility.ConvertFloatToTime(roundTimes[j])}{Colors.COLOR_RESET}");
                else
                    BestTimes.GetItem(rowIndex, j + 1).SetText($"{playerColor}---{Colors.COLOR_RESET}");
            }
            rowIndex++;
        }
    }

    public static void UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        OverallGameStats();
    }

    public static void UpdateStandardCurrentStatsMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        CurrentGameStats();
    }

    public static void UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
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
            case (int)DifficultyLevel.Nightmare:
                numberOfGames = gameData.NightmareGames;
                numberOfWins = gameData.NightmareWins;
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

        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                RoundTimes[0] = gameData.RoundOneNormal;
                RoundTimes[1] = gameData.RoundTwoNormal;
                RoundTimes[2] = gameData.RoundThreeNormal;
                RoundTimes[3] = gameData.RoundFourNormal;
                RoundTimes[4] = gameData.RoundFiveNormal;
                break;

            case (int)DifficultyLevel.Hard:
                RoundTimes[0] = gameData.RoundOneHard;
                RoundTimes[1] = gameData.RoundTwoHard;
                RoundTimes[2] = gameData.RoundThreeHard;
                RoundTimes[3] = gameData.RoundFourHard;
                RoundTimes[4] = gameData.RoundFiveHard;
                break;

            case (int)DifficultyLevel.Impossible:
                RoundTimes[0] = gameData.RoundOneImpossible;
                RoundTimes[1] = gameData.RoundTwoImpossible;
                RoundTimes[2] = gameData.RoundThreeImpossible;
                RoundTimes[3] = gameData.RoundFourImpossible;
                RoundTimes[4] = gameData.RoundFiveImpossible;
                break;
            case (int)DifficultyLevel.Nightmare:
                RoundTimes[0] = gameData.RoundOneNightmare;
                RoundTimes[1] = gameData.RoundTwoNightmare;
                RoundTimes[2] = gameData.RoundThreeNightmare;
                RoundTimes[3] = gameData.RoundFourNightmare;
                RoundTimes[4] = gameData.RoundFiveNightmare;
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return RoundTimes;
        }
        return RoundTimes;
    }

    private static void ESCPressed()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
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
