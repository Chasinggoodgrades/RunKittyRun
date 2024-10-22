using System;
using System.Threading;
using WCSharp.Api;
using WCSharp.Events;

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
        CurrentStats = multiboard.Create();
        OverallStats = multiboard.Create();
        BestTimes = multiboard.Create();
        CreateMultiboards();
        RegisterTriggers();
    }

    private static void RegisterTriggers()
    {
        Updater = trigger.Create();
        ESCTrigger = trigger.Create();

        Updater.RegisterTimerEvent(1.0f, true);
        Updater.AddAction(UpdateStandardCurrentStatsMB);
    }

    private static void CreateMultiboards()
    {
        CurrentGameStatsMultiboard();
        OverallGamesStatsMultiboard();
        BestTimesMultiboard();
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

    private static void FillPlayers(multiboard mb)
    {
        var rowIndex = 2;
        mb.Rows = Globals.ALL_PLAYERS.Count + 2;
        foreach(var player in Globals.ALL_PLAYERS)
        {
            mb.GetItem(rowIndex, 0).SetText(Colors.PlayerNameColored(player));
            mb.GetItem(rowIndex, 0).SetWidth(0.08f);
            rowIndex++;
        }
    }

    private static void CurrentGameStats()
    {
        var rowIndex = 2;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var kitty = Globals.ALL_KITTIES[player];
            var playerColor = Colors.GetPlayerColor(player.Id+1);
            var currentStats = kitty.CurrentStats;

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


    private static void UpdateStandardCurrentStatsMB()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        FillPlayers(CurrentStats);
        CurrentStatsRoundTimes();
        CurrentGameStats();
    }


}