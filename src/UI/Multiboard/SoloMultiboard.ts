import { GameMode } from 'src/Gamemodes/GameModeEnum'

export class SoloMultiboard {
    private static OverallBoard: multiboard
    private static BestTimes: multiboard
    private static ESCTrigger: trigger
    private static sortedDict: Map<player, Kitty>
    private static MBSlot: Map<player, number>
    private static color: string = Colors.COLOR_YELLOW_ORANGE

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static Initialize() {
        try {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
            SoloMultiboard.OverallBoard = CreateMultiboard()!
            SoloMultiboard.BestTimes = CreateMultiboard()!
            SoloMultiboard.sortedDict = {}
            SoloMultiboard.MBSlot = {}
            SoloMultiboard.MakeMultiboard()
            SoloMultiboard.RegisterTriggers()
        } catch (ex) {
            Logger.Critical('Error in SoloMultiboard: {ex.Message}')
            throw ex
        }
    }

    private static MakeMultiboard() {
        SoloMultiboard.BestTimesMultiboard()
        SoloMultiboard.OverallMultiboardRacemode()
        SoloMultiboard.OverallMultiboardProgressmode()
    }

    private static RegisterTriggers() {
        SoloMultiboard.ESCTrigger = CreateTrigger()
        for (let player in Globals.ALL_PLAYERS)
            SoloMultiboard.TriggerRegisterPlayerEvent(ESCTrigger, player, EVENT_PLAYER_END_CINEMATIC)
        SoloMultiboard.ESCTrigger.AddAction(SoloMultiboard.ESCPressed)
    }

    private static OverallMultiboardRacemode() {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[1]) return // Race mode
        SoloMultiboard.OverallBoard.Rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.Columns = 9
        SoloMultiboard.OverallBoard.GetItem(0, 0).setText('{color}Player|r')
        SoloMultiboard.OverallBoard.GetItem(0, 1).setText('{color}Deaths|r')
        SoloMultiboard.OverallBoard.GetItem(0, 2).setText('{color}1: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 3).setText('{color}2: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 4).setText('{color}3: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 5).setText('{color}4: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 6).setText('{color}5: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 7).setText('{color}Total|r')
        SoloMultiboard.OverallBoard.GetItem(0, 8).setText('{color}Status|r')

        SoloMultiboard.OverallBoard.SetChildVisibility(true, false)
        SoloMultiboard.OverallBoard.SetChildWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).SetWidth(0.07)
        SoloMultiboard.OverallBoard.display = true
        SoloMultiboard.UpdateOverallStatsMB()
    }

    private static OverallMultiboardProgressmode() {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return // Progression mode
        SoloMultiboard.OverallBoard.Rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.Columns = 7
        SoloMultiboard.OverallBoard.GetItem(0, 0).setText('{color}Player|r')
        SoloMultiboard.OverallBoard.GetItem(0, 1).setText('{color}1: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 2).setText('{color}2: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 3).setText('{color}3: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 4).setText('{color}4: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 5).setText('{color}5: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 6).setText('{color}Total|r')

        SoloMultiboard.OverallBoard.SetChildVisibility(true, false)
        SoloMultiboard.OverallBoard.SetChildWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).SetWidth(0.07)
        SoloMultiboard.OverallBoard.display = true
        SoloMultiboard.OverallStats()
    }

    private static BestTimesMultiboard() {
        SoloMultiboard.BestTimes.Rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.BestTimes.Columns = 7
        SoloMultiboard.BestTimes.GetItem(0, 0).setText('{color}Player|r')
        SoloMultiboard.BestTimes.GetItem(0, 1).setText('{color}1: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 2).setText('{color}2: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 3).setText('{color}3: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 4).setText('{color}4: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 5).setText('{color}5: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 6).setText('{color}Time: Total|r')
        SoloMultiboard.BestTimes.SetChildVisibility(true, false)
        SoloMultiboard.BestTimes.SetChildWidth(0.05)
        SoloMultiboard.BestTimes.GetItem(0, 6).SetWidth(0.06)
        SoloMultiboard.BestTimes.GetItem(0, 0).SetWidth(0.07)
        SoloMultiboard.BestTimes.display = false
        SoloMultiboard.UpdateBestTimesMB()
    }

    private static OverallStats() {
        SoloMultiboard.OverallBoard.Title =
            'Game: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        SoloMultiboard.OverallBoard.Rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        // Create a shallow copy of Globals.ALL_KITTIES and sort it
        let sortedPlayers =
            Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0]
                ? Globals.ALL_KITTIES.OrderByDescending(kvp => kvp.Value.TimeProg.GetOverallProgress()).ThenBy(
                      kvp => kvp.Key.Id
                  ) // Progression mode
                : Globals.ALL_KITTIES.OrderBy(kvp => kvp.Value.TimeProg.GetTotalTime())
                      .ThenBy(kvp => kvp.Key.Id)
                      .ThenBy(kvp => kvp.Value.Finished) // Race Mode       -- Holy BAD LEAKS

        SoloMultiboard.sortedDict = sortedPlayers.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value
        ) // Avoid pass by reference

        for (let player in SoloMultiboard.sortedDict.Keys) {
            let times = SoloMultiboard.sortedDict[player].TimeProg
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1)
            let totalDeaths = SoloMultiboard.sortedDict[player].CurrentStats.TotalDeaths
            let name = player.Name.length > 8 ? player.Name.Substring(0, 8) : MapPlayer.Name
            let status = Globals.ALL_KITTIES.get(player).Finished ? 'Finished' : 'Racing'
            SoloMultiboard.MBSlot[player] = rowIndex
            let stats =
                Gamemode.CurrentGameModeType == Globals.SOLO_MODES[0]
                    ? [
                          name,
                          times.GetRoundProgress(1).ToString('F2') + '%',
                          times.GetRoundProgress(2).ToString('F2') + '%',
                          times.GetRoundProgress(3).ToString('F2') + '%',
                          times.GetRoundProgress(4).ToString('F2') + '%',
                          times.GetRoundProgress(5).ToString('F2') + '%',
                          times.GetOverallProgress().ToString('F2') + '%',
                      ]
                    : [
                          name,
                          totalDeaths.ToString(),
                          times.GetRoundTimeFormatted(1),
                          times.GetRoundTimeFormatted(2),
                          times.GetRoundTimeFormatted(3),
                          times.GetRoundTimeFormatted(4),
                          times.GetRoundTimeFormatted(5),
                          times.GetTotalTimeFormatted(),
                          status,
                      ]

            for (let i: number = 0; i < stats.length; i++) {
                SoloMultiboard.OverallBoard.GetItem(rowIndex, i).setText('{playerColor}{stats[i]}{Colors.COLOR_RESET}')
                if (i == 0) SoloMultiboard.OverallBoard.GetItem(rowIndex, i).SetWidth(0.07)
            }

            rowIndex++
            stats = []
        }

        SoloMultiboard.sortedDict = {}
    }

    private static BestTimeStats() {
        SoloMultiboard.BestTimes.Title =
            'Times: Best {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Gamemode.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        let rowIndex = 1

        for (let player in Globals.ALL_PLAYERS) {
            // bad
            let saveData = Globals.ALL_KITTIES.get(player).SaveData
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1)

            let roundTimes = GetGameRoundTime(saveData)

            for (let i: number = 0; i < roundTimes.length; i++) {
                if (roundTimes[i] != 0)
                    SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText(
                        '{playerColor}{Utility.ConvertFloatToTime(roundTimes[i])}{Colors.COLOR_RESET}'
                    )
                else SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText('{playerColor}---{Colors.COLOR_RESET}')
            }
            let sum = roundTimes.Sum() // IEnumerable
            SoloMultiboard.BestTimes.GetItem(rowIndex, 6).setText('{playerColor}{Utility.ConvertFloatToTime(sum)}')
            rowIndex++
            roundTimes = null
        }
    }

    public static UpdateOverallStatsMB() {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
        SoloMultiboard.OverallStats()
    }

    public static UpdateBestTimesMB() {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
        MultiboardUtil.FillPlayers(SoloMultiboard.BestTimes, 1)
        SoloMultiboard.BestTimeStats()
    }

    public static UpdateDeathCount(player: MapPlayer) {
        try {
            if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
            let rowIndex: number = (value = SoloMultiboard.MBSlot.TryGetValue(player) /* TODO; Prepend: number */
                ? value
                : 0)
            if (rowIndex == 0) return
            SoloMultiboard.OverallBoard.GetItem(rowIndex, 1).setText(
                '{Colors.GetStringColorOfPlayer(player.Id + 1)}{Globals.ALL_KITTIES.get(player).CurrentStats.TotalDeaths}'
            )
        } catch (ex) {
            Logger.Critical('Error in SoloMultiboard.UpdateDeathCount: {ex.Message}')
            throw ex
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        let gameData = data.RoundTimes
        let roundTimes = []

        switch (Gamemode.CurrentGameMode) {
            case GameMode.SoloTournament:
                roundTimes[0] = gameData.RoundOneSolo
                roundTimes[1] = gameData.RoundTwoSolo
                roundTimes[2] = gameData.RoundThreeSolo
                roundTimes[3] = gameData.RoundFourSolo
                roundTimes[4] = gameData.RoundFiveSolo
                break

            default:
                print('{Colors.COLOR_DARK_RED}multiboard: getting: gamestat: data: Error.')
                return []
        }
        return roundTimes
    }

    private static ESCPressed() {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return // Solo mode
        const triggerPlayer = GetTriggerPlayer()
        if (!triggerPlayer || GetLocalPlayer() != triggerPlayer) return
        if (SoloMultiboard.OverallBoard.IsDisplayed) {
            SoloMultiboard.OverallBoard.display = false
            SoloMultiboard.BestTimes.display = true
        } else {
            SoloMultiboard.BestTimes.display = false
            SoloMultiboard.OverallBoard.display = true
        }
    }
}
