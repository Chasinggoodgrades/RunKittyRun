using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class SoloMultiboard
{
    private static multiboard OverallBoard;
    private static multiboard BestTimes;
    private static trigger ESCTrigger;
    private static Dictionary<player, int> MBSlot;
    private static string color = Colors.COLOR_YELLOW_ORANGE;
    private static string roundColor = Colors.COLOR_GREEN;
    private static string[] PlayerStats = new string[9];
    private static float[] RoundTimes = new float[5];
    private static List<player> PlayersList = new List<player>();

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static void Initialize()
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
            OverallBoard = multiboard.Create();
            BestTimes = multiboard.Create();
            MBSlot = new Dictionary<player, int>();
            MakeMultiboard();
            RegisterTriggers();
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in SoloMultiboard: {ex.Message}");
            throw;
        }
    }

    private static void MakeMultiboard()
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
        OverallBoard.Columns = 9;
        OverallBoard.GetItem(0, 0).SetText($"{color}Player|r");
        OverallBoard.GetItem(0, 1).SetText($"{color}Deaths|r");
        OverallBoard.GetItem(0, 2).SetText($"{color}Round 1|r");
        OverallBoard.GetItem(0, 3).SetText($"{color}Round 2|r");
        OverallBoard.GetItem(0, 4).SetText($"{color}Round 3|r");
        OverallBoard.GetItem(0, 5).SetText($"{color}Round 4|r");
        OverallBoard.GetItem(0, 6).SetText($"{color}Round 5|r");
        OverallBoard.GetItem(0, 7).SetText($"{color}Total|r");
        OverallBoard.GetItem(0, 8).SetText($"{color}Status|r");

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
        BestTimes.GetItem(0, 6).SetWidth(0.06f);
        BestTimes.GetItem(0, 0).SetWidth(0.07f);
        BestTimes.IsDisplayed = false;
        UpdateBestTimesMB();
    }

    private static void OverallStats()
    {
        OverallBoard.Title = $"{roundColor}[R{Globals.ROUND}]{Colors.COLOR_RESET} Current Game {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        var rowIndex = 1;

        PlayersList.Clear();
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            PlayersList.Add(Globals.ALL_PLAYERS[i]);
        }

        var isProgressMode = Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0];

        for (int i = 0; i < PlayersList.Count; i++)
        {
            for (int j = i + 1; j < PlayersList.Count; j++)
            {
                var kitty1 = Globals.ALL_KITTIES[PlayersList[i]];
                var kitty2 = Globals.ALL_KITTIES[PlayersList[j]];

                var shouldSwap = false;
                if (isProgressMode)
                {
                    var progress1 = kitty1.TimeProg.GetOverallProgress();
                    var progress2 = kitty2.TimeProg.GetOverallProgress();
                    shouldSwap = progress2 > progress1 || (progress2 == progress1 && PlayersList[j].Id < PlayersList[i].Id);
                }
                else
                {
                    var time1 = kitty1.TimeProg.GetTotalTime();
                    var time2 = kitty2.TimeProg.GetTotalTime();
                    shouldSwap = time2 < time1
                        || (time2 == time1 && PlayersList[j].Id < PlayersList[i].Id)
                        || (time2 == time1 && PlayersList[j].Id == PlayersList[i].Id && !kitty2.Finished && kitty1.Finished);
                }

                if (shouldSwap)
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
            var kitty = Globals.ALL_KITTIES[player];
            var times = kitty.TimeProg;
            var playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);
            var totalDeaths = kitty.CurrentStats.TotalDeaths;
            var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            var status = kitty.Finished ? "Finished" : "Racing";
            MBSlot[player] = rowIndex;

            int statCount;
            if (isProgressMode)
            {
                PlayerStats[0] = name;
                PlayerStats[1] = times.GetRoundProgress(1).ToString("F2") + "%";
                PlayerStats[2] = times.GetRoundProgress(2).ToString("F2") + "%";
                PlayerStats[3] = times.GetRoundProgress(3).ToString("F2") + "%";
                PlayerStats[4] = times.GetRoundProgress(4).ToString("F2") + "%";
                PlayerStats[5] = times.GetRoundProgress(5).ToString("F2") + "%";
                PlayerStats[6] = times.GetOverallProgress().ToString("F2") + "%";
                statCount = 7;
            }
            else
            {
                PlayerStats[0] = name;
                PlayerStats[1] = totalDeaths.ToString();
                PlayerStats[2] = times.GetRoundTimeFormatted(1);
                PlayerStats[3] = times.GetRoundTimeFormatted(2);
                PlayerStats[4] = times.GetRoundTimeFormatted(3);
                PlayerStats[5] = times.GetRoundTimeFormatted(4);
                PlayerStats[6] = times.GetRoundTimeFormatted(5);
                PlayerStats[7] = times.GetTotalTimeFormatted();
                PlayerStats[8] = status;
                statCount = 9;
            }

            for (int j = 0; j < statCount; j++)
            {
                OverallBoard.GetItem(rowIndex, j).SetText($"{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}");
                if (j == 0) OverallBoard.GetItem(rowIndex, j).SetWidth(0.07f);
            }

            rowIndex++;
        }
    }

    private static void BestTimeStats()
    {
        BestTimes.Title = $"{roundColor}[R{Globals.ROUND}]{Colors.COLOR_RESET} Best Times [{Colors.COLOR_YELLOW_ORANGE}{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[Press ESC]|r";
        var rowIndex = 1;

        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
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
            var sum = 0.0f;
            for (int j = 0; j < roundTimes.Length; j++)
            {
                sum += roundTimes[j];
            }
            BestTimes.GetItem(rowIndex, 6).SetText($"{playerColor}{Utility.ConvertFloatToTime(sum)}");
            rowIndex++;
        }
    }

    public static void UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        OverallStats();
    }

    public static void UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        MultiboardUtil.FillPlayers(BestTimes, 1);
        BestTimeStats();
    }

    public static void UpdateDeathCount(player player)
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
            int rowIndex = MBSlot.TryGetValue(player, out int value) ? value : 0;
            if (rowIndex == 0) return;
            OverallBoard.GetItem(rowIndex, 1).SetText($"{Colors.GetStringColorOfPlayer(player.Id + 1)}{Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths}");
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in SoloMultiboard.UpdateDeathCount: {ex.Message}");
            throw;
        }
    }

    private static float[] GetGameRoundTime(KittyData data)
    {
        var gameData = data.RoundTimes;
        switch (Gamemode.CurrentGameMode)
        {
            case GameMode.SoloTournament:
                RoundTimes[0] = gameData.RoundOneSolo;
                RoundTimes[1] = gameData.RoundTwoSolo;
                RoundTimes[2] = gameData.RoundThreeSolo;
                RoundTimes[3] = gameData.RoundFourSolo;
                RoundTimes[4] = gameData.RoundFiveSolo;
                break;

            default:
                Console.WriteLine($"{Colors.COLOR_DARK_RED}Error multiboard getting gamestat data.");
                return RoundTimes;
        }
        return RoundTimes;
    }

    private static void ESCPressed()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return; // Solo mode
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
}
