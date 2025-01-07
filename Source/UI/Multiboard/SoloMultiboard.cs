using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using WCSharp.Api;

public static class SoloMultiboard
{
    private static multiboard OverallBoard;
    private static multiboard BestTimes;
    private static trigger ESCTrigger;
    private static string color = Colors.COLOR_YELLOW_ORANGE;

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        OverallBoard = multiboard.Create();
        BestTimes = multiboard.Create();
        CreateMultiboards();    
        RegisterTriggers();
    }

    private static void CreateMultiboards()
    {
        BestTimesMultiboard();
        OverallMultiboardRacemode();
        OverallMultiboardProgressmode();
    }

    private static void RegisterTriggers()
    {
        ESCTrigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        ESCTrigger.AddAction(ESCPressed);
    }

    private static void OverallMultiboardRacemode()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[1]) return; // Race mode
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        OverallBoard.Columns = 8;
        OverallBoard.GetItem(0, 0).SetText($"{color}Player|r");
        OverallBoard.GetItem(0, 1).SetText($"{color}Deaths|r");
        OverallBoard.GetItem(0, 2).SetText($"{color}Round 1|r");
        OverallBoard.GetItem(0, 3).SetText($"{color}Round 2|r");
        OverallBoard.GetItem(0, 4).SetText($"{color}Round 3|r");
        OverallBoard.GetItem(0, 5).SetText($"{color}Round 4|r");
        OverallBoard.GetItem(0, 6).SetText($"{color}Round 5|r");
        OverallBoard.GetItem(0, 7).SetText($"{color}Total|r");

        OverallBoard.SetChildVisibility(true, false);
        OverallBoard.SetChildWidth(0.05f);
        OverallBoard.GetItem(0, 0).SetWidth(0.07f);
        OverallBoard.IsDisplayed = true;
        UpdateOverallStatsMB();
    }

    private static void OverallMultiboardProgressmode()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return; // Progression mode
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        OverallBoard.Columns = 7;
        OverallBoard.GetItem(0, 0).SetText($"{color}Player|r");
        OverallBoard.GetItem(0, 1).SetText($"{color}Round 1|r");
        OverallBoard.GetItem(0, 2).SetText($"{color}Round 2|r");
        OverallBoard.GetItem(0, 3).SetText($"{color}Round 3|r");
        OverallBoard.GetItem(0, 4).SetText($"{color}Round 4|r");
        OverallBoard.GetItem(0, 5).SetText($"{color}Round 5|r");
        OverallBoard.GetItem(0, 6).SetText($"{color}Total|r");

        OverallBoard.SetChildVisibility(true, false);
        OverallBoard.SetChildWidth(0.05f);
        OverallBoard.GetItem(0, 0).SetWidth(0.07f);
        OverallBoard.IsDisplayed = true;
        OverallStats();
    }

    private static void BestTimesMultiboard()
    {
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1;
        BestTimes.Columns = 7;
        BestTimes.GetItem(0, 0).SetText($"{color}Player|r");
        BestTimes.GetItem(0, 1).SetText($"{color}Round 1|r");
        BestTimes.GetItem(0, 2).SetText($"{color}Round 2|r");
        BestTimes.GetItem(0, 3).SetText($"{color}Round 3|r");
        BestTimes.GetItem(0, 4).SetText($"{color}Round 4|r");
        BestTimes.GetItem(0, 5).SetText($"{color}Round 5|r");
        BestTimes.GetItem(0, 6).SetText($"{color}Total Time|r");
        BestTimes.SetChildVisibility(true, false);
        BestTimes.SetChildWidth(0.05f);
        BestTimes.GetItem(0,6).SetWidth(0.06f);
        BestTimes.GetItem(0, 0).SetWidth(0.07f);
        BestTimes.IsDisplayed = false;
        UpdateBestTimesMB();
    }

    private static void OverallStats()
    {
        OverallBoard.Title = $"Current Game {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        // Create a shallow copy of Globals.ALL_KITTIES and sort it
        var sortedPlayers = (Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0])
            ? Globals.ALL_KITTIES.OrderByDescending(kvp => kvp.Value.TimeProg.GetOverallProgress()).ThenBy(kvp => kvp.Key.Id) // Progression mode
            : Globals.ALL_KITTIES.OrderBy(kvp => kvp.Value.TimeProg.GetTotalTime()).ThenBy(kvp => kvp.Key.Id); // Race Mode

        var sortedDict = new Dictionary<player, Kitty>(sortedPlayers.ToDictionary(kvp => kvp.Key, kvp => kvp.Value)); // Avoid pass by reference

        foreach (var player in sortedDict.Keys)
        {
            var times = sortedDict[player].TimeProg;
            var playerColor = Colors.GetPlayerColor(player.Id + 1);
            var totalDeaths = sortedDict[player].CurrentStats.TotalDeaths;
            var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            var stats = (Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0])
                ? new[]
                {
                    name,
                    times.GetRoundProgress(1).ToString("F2") + "%",
                    times.GetRoundProgress(2).ToString("F2") + "%",
                    times.GetRoundProgress(3).ToString("F2") + "%",
                    times.GetRoundProgress(4).ToString("F2") + "%",
                    times.GetRoundProgress(5).ToString("F2") + "%",
                    times.GetOverallProgress().ToString("F2") + "%"
                }
                : new[]
                {
                    name,
                    totalDeaths.ToString(),
                    times.GetRoundTimeFormatted(1),
                    times.GetRoundTimeFormatted(2),
                    times.GetRoundTimeFormatted(3),
                    times.GetRoundTimeFormatted(4),
                    times.GetRoundTimeFormatted(5),
                    times.GetTotalTimeFormatted()
                };

            for (int i = 0; i < stats.Length; i++)
            {
                OverallBoard.GetItem(rowIndex, i).SetText($"{playerColor}{stats[i]}{Colors.COLOR_RESET}");
                if (i == 0) OverallBoard.GetItem(rowIndex, i).SetWidth(0.07f);
            }

            rowIndex++;
        }

        sortedDict.Clear();
    }

    private static void BestTimeStats()
    {
        BestTimes.Title = $"Best Times {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        var rowIndex = 1;

        foreach (var player in Globals.ALL_PLAYERS)
        {
            var saveData = Globals.ALL_KITTIES[player].SaveData;
            var playerColor = Colors.GetPlayerColor(player.Id + 1);

            var roundTimes = GetGameRoundTime(saveData);

            for (int i = 0; i < roundTimes.Length; i++)
            {
                if (roundTimes[i] != 0)
                    BestTimes.GetItem(rowIndex, i + 1).SetText($"{playerColor}{Utility.ConvertFloatToTime(roundTimes[i])}{Colors.COLOR_RESET}");
                else
                    BestTimes.GetItem(rowIndex, i + 1).SetText($"{playerColor}---{Colors.COLOR_RESET}");
            }
            float sum = roundTimes.Sum();
            BestTimes.GetItem(rowIndex, 6).SetText($"{playerColor}{Utility.ConvertFloatToTime(sum)}");
            rowIndex++;
        }
    }

    public static void UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        OverallStats();
    }

    public static void UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        MultiboardUtil.FillPlayers(BestTimes, 1);
        BestTimeStats();
    }

    private static float[] GetGameRoundTime(KittyData data)
    {   
        var gameData = data.RoundTimes;
        var roundTimes = new float[5];

        switch (Gamemode.CurrentGameMode)
        {
            case "Tournament Solo":
                roundTimes[0] = gameData.RoundOneSolo;
                roundTimes[1] = gameData.RoundTwoSolo;
                roundTimes[2] = gameData.RoundThreeSolo;
                roundTimes[3] = gameData.RoundFourSolo;
                roundTimes[4] = gameData.RoundFiveSolo;
                break;
            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return new float[5];
        }
        return roundTimes;
    }

    private static void ESCPressed()
    {
        var player = @event.Player;
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return; // Solo mode
        if (!@event.Player.IsLocal) return;
        if (OverallBoard.IsDisplayed)
        {
            OverallBoard.IsDisplayed = false;
            BestTimes.IsDisplayed = true;
        }
        else
        {
            BestTimes.IsDisplayed = false;
            OverallBoard.IsDisplayed = true;
        }
    }

    private static string Decode64(string str)
    {
        byte[] bytes = Convert.FromBase64String(str);
        return System.Text.Encoding.UTF8.GetString(bytes);
    }

}