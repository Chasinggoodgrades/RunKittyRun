

class SoloMultiboard
{
    private static OverallBoard: multiboard;
    private static BestTimes: multiboard;
    private static ESCTrigger: trigger;
    private static Dictionary<player, Kitty> sortedDict;
    private static Dictionary<player, int> MBSlot;
    private static color: string = Colors.COLOR_YELLOW_ORANGE;

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static Initialize()
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
            OverallBoard = multiboard.Create();
            BestTimes = multiboard.Create();
            sortedDict = new Dictionary<player, Kitty>();
            MBSlot = new Dictionary<player, int>();
            MakeMultiboard();
            RegisterTriggers();
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in SoloMultiboard: {ex.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static MakeMultiboard()
    {
        BestTimesMultiboard();
        OverallMultiboardRacemode();
        OverallMultiboardProgressmode();
    }

    private static RegisterTriggers()
    {
        ESCTrigger = trigger.Create();
        for (let player in Globals.ALL_PLAYERS)
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        ESCTrigger.AddAction(ESCPressed);
    }

    private static OverallMultiboardRacemode()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[1]) return; // Race mode
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        OverallBoard.Columns = 9;
        OverallBoard.GetItem(0, 0).SetText("{color}Player|r");
        OverallBoard.GetItem(0, 1).SetText("{color}Deaths|r");
        OverallBoard.GetItem(0, 2).SetText("{color}1: Round|r");
        OverallBoard.GetItem(0, 3).SetText("{color}2: Round|r");
        OverallBoard.GetItem(0, 4).SetText("{color}3: Round|r");
        OverallBoard.GetItem(0, 5).SetText("{color}4: Round|r");
        OverallBoard.GetItem(0, 6).SetText("{color}5: Round|r");
        OverallBoard.GetItem(0, 7).SetText("{color}Total|r");
        OverallBoard.GetItem(0, 8).SetText("{color}Status|r");

        OverallBoard.SetChildVisibility(true, false);
        OverallBoard.SetChildWidth(0.05);
        OverallBoard.GetItem(0, 0).SetWidth(0.07);
        OverallBoard.IsDisplayed = true;
        UpdateOverallStatsMB();
    }

    private static OverallMultiboardProgressmode()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return; // Progression mode
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        OverallBoard.Columns = 7;
        OverallBoard.GetItem(0, 0).SetText("{color}Player|r");
        OverallBoard.GetItem(0, 1).SetText("{color}1: Round|r");
        OverallBoard.GetItem(0, 2).SetText("{color}2: Round|r");
        OverallBoard.GetItem(0, 3).SetText("{color}3: Round|r");
        OverallBoard.GetItem(0, 4).SetText("{color}4: Round|r");
        OverallBoard.GetItem(0, 5).SetText("{color}5: Round|r");
        OverallBoard.GetItem(0, 6).SetText("{color}Total|r");

        OverallBoard.SetChildVisibility(true, false);
        OverallBoard.SetChildWidth(0.05);
        OverallBoard.GetItem(0, 0).SetWidth(0.07);
        OverallBoard.IsDisplayed = true;
        OverallStats();
    }

    private static BestTimesMultiboard()
    {
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1;
        BestTimes.Columns = 7;
        BestTimes.GetItem(0, 0).SetText("{color}Player|r");
        BestTimes.GetItem(0, 1).SetText("{color}1: Round|r");
        BestTimes.GetItem(0, 2).SetText("{color}2: Round|r");
        BestTimes.GetItem(0, 3).SetText("{color}3: Round|r");
        BestTimes.GetItem(0, 4).SetText("{color}4: Round|r");
        BestTimes.GetItem(0, 5).SetText("{color}5: Round|r");
        BestTimes.GetItem(0, 6).SetText("{color}Time: Total|r");
        BestTimes.SetChildVisibility(true, false);
        BestTimes.SetChildWidth(0.05);
        BestTimes.GetItem(0, 6).SetWidth(0.06);
        BestTimes.GetItem(0, 0).SetWidth(0.07);
        BestTimes.IsDisplayed = false;
        UpdateBestTimesMB();
    }

    private static OverallStats()
    {
        OverallBoard.Title = "Game: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r";
        OverallBoard.Rows = Globals.ALL_PLAYERS.Count + 1;
        let rowIndex = 1;

        // Create a shallow copy of Globals.ALL_KITTIES and sort it
        let sortedPlayers = (Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0])
            ? Globals.ALL_KITTIES.OrderByDescending(kvp => kvp.Value.TimeProg.GetOverallProgress()).ThenBy(kvp => kvp.Key.Id) // Progression mode
            : Globals.ALL_KITTIES.OrderBy(kvp => kvp.Value.TimeProg.GetTotalTime()).ThenBy(kvp => kvp.Key.Id).ThenBy(kvp => kvp.Value.Finished); // Race Mode       -- Holy BAD LEAKS

        sortedDict = sortedPlayers.ToDictionary(kvp => kvp.Key, kvp => kvp.Value); // Avoid pass by reference

        for (let player in sortedDict.Keys)
        {
            let times = sortedDict[player].TimeProg;
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);
            let totalDeaths = sortedDict[player].CurrentStats.TotalDeaths;
            let name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            let status = Globals.ALL_KITTIES[player].Finished ? "Finished" : "Racing";
            MBSlot[player] = rowIndex;
            let stats = (Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0])
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
                    times.GetTotalTimeFormatted(),
                    status
                };

            for (let i: number = 0; i < stats.Length; i++)
            {
                OverallBoard.GetItem(rowIndex, i).SetText("{playerColor}{stats[i]}{Colors.COLOR_RESET}");
                if (i == 0) OverallBoard.GetItem(rowIndex, i).SetWidth(0.07);
            }

            rowIndex++;
            stats = null;
        }

        sortedDict.Clear();
    }

    private static BestTimeStats()
    {
        BestTimes.Title = "Times: Best {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r";
        let rowIndex = 1;

        for (let player in Globals.ALL_PLAYERS) // bad
        {
            let saveData = Globals.ALL_KITTIES[player].SaveData;
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1);

            let roundTimes = GetGameRoundTime(saveData);

            for (let i: number = 0; i < roundTimes.Length; i++)
            {
                if (roundTimes[i] != 0)
                    BestTimes.GetItem(rowIndex, i + 1).SetText("{playerColor}{Utility.ConvertFloatToTime(roundTimes[i])}{Colors.COLOR_RESET}");
                else
                    BestTimes.GetItem(rowIndex, i + 1).SetText("{playerColor}---{Colors.COLOR_RESET}");
            }
            let sum = roundTimes.Sum(); // IEnumerable
            BestTimes.GetItem(rowIndex, 6).SetText("{playerColor}{Utility.ConvertFloatToTime(sum)}");
            rowIndex++;
            roundTimes = null;
        }
    }

    public static UpdateOverallStatsMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        OverallStats();
    }

    public static UpdateBestTimesMB()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
        MultiboardUtil.FillPlayers(BestTimes, 1);
        BestTimeStats();
    }

    public static UpdateDeathCount(player: player)
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return;
            let rowIndex: number = value = MBSlot.TryGetValue(player) /* TODO; Prepend: number */ ? value : 0;
            if (rowIndex == 0) return;
            OverallBoard.GetItem(rowIndex, 1).SetText("{Colors.GetStringColorOfPlayer(player.Id + 1)}{Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths}");
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in SoloMultiboard.UpdateDeathCount: {ex.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static number[] GetGameRoundTime(data: KittyData)
    {
        let gameData = data.RoundTimes;
        let roundTimes = new number[5];

        switch (Gamemode.CurrentGameMode)
        {
            case GameMode.SoloTournament:
                roundTimes[0] = gameData.RoundOneSolo;
                roundTimes[1] = gameData.RoundTwoSolo;
                roundTimes[2] = gameData.RoundThreeSolo;
                roundTimes[3] = gameData.RoundFourSolo;
                roundTimes[4] = gameData.RoundFiveSolo;
                break;

            default:
                Console.WriteLine("{Colors.COLOR_DARK_RED}multiboard: getting: gamestat: data: Error.");
                return new number[5];
        }
        return roundTimes;
    }

    private static ESCPressed()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return; // Solo mode
        if (!GetTriggerPlayer().IsLocal) return;
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
