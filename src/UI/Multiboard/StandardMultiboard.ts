import { Gamemode } from '../Gamemodes/Gamemode'

class StandardMultiboard {
    public static OverallStats: multiboard
    public static CurrentStats: multiboard
    public static BestTimes: multiboard
    private static Updater: trigger
    private static ESCTrigger: trigger

    private static color: string = Colors.COLOR_YELLOW_ORANGE
    private static PlayerStats: string[] = []
    private static RoundTimes: number[] = []
    private static PlayersList: player[] = []

    public static Initialize() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let BestTimes = CreateMultiboard()
        let OverallStats = CreateMultiboard()
        let CurrentStats = CreateMultiboard()
        StandardMultiboard.Init()
    }

    /// <summary>
    /// Wait till difficulty is chosen, then begin..
    /// </summary>
    private static Init() {
        let t = CreateTimer()
        TimerStart(
            t,
            1.0,
            true,
            ErrorHandler.Wrap(() => {
                if (!Difficulty.IsDifficultyChosen) return
                StandardMultiboard.MakeMultiboard()
                StandardMultiboard.this.RegisterTriggers()
                DestroyTimer(t)
            })
        )
    }

    private static RegisterTriggers() {
        let Updater = CreateTrigger()
        let ESCTrigger = CreateTrigger()

        TriggerRegisterTimerEvent(Updater, 1.0, true)
        Updater.AddAction(CurrentStatsRoundTimes)

        for (let player in Globals.ALL_PLAYERS) TriggerRegisterPlayerEvent(ESCTrigger, player, playerevent.EndCinematic)
        ESCTrigger.AddAction(ESCPressed)
    }

    private static MakeMultiboard() {
        StandardMultiboard.OverallGamesStatsMultiboard()
        StandardMultiboard.BestTimesMultiboard()
        StandardMultiboard.CurrentGameStatsMultiboard()
        StandardMultiboard.CurrentGameStats()
    }

    private static CurrentGameStatsMultiboard() {
        CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2
        CurrentStats.Columns = 7
        CurrentStats.GetItem(0, 0).SetText('{color}Time: Round|r')
        CurrentStats.GetItem(1, 0).SetText('{color}Player|r')
        CurrentStats.GetItem(1, 1).SetText('{color}Score|r')
        CurrentStats.GetItem(1, 2).SetText('{color}Saves|r')
        CurrentStats.GetItem(1, 3).SetText('{color}Deaths|r')
        CurrentStats.GetItem(1, 4).SetText('{color}Streak|r')
        CurrentStats.GetItem(1, 5).SetText('{color}Ratio|r')
        CurrentStats.GetItem(1, 6).SetText('{color}S / D|r')
        CurrentStats.SetChildVisibility(true, false)
        CurrentStats.SetChildWidth(0.055)
        CurrentStats.GetItem(1, 0).SetWidth(0.07)
        CurrentStats.IsDisplayed = true
    }

    private static OverallGamesStatsMultiboard() {
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 1
        OverallStats.Columns = 8
        OverallStats.GetItem(0, 0).SetText('{color}Player|r')
        OverallStats.GetItem(0, 1).SetText('{color}Score:|r')
        OverallStats.GetItem(0, 2).SetText('{color}Saves|r')
        OverallStats.GetItem(0, 3).SetText('{color}Deaths|r')
        OverallStats.GetItem(0, 4).SetText('{color}MaxStreak|r')
        OverallStats.GetItem(0, 5).SetText('{color}  Ratio|r')
        OverallStats.GetItem(0, 6).SetText('{color}Games|r')
        OverallStats.GetItem(0, 7).SetText('{color}Wins|r')
        OverallStats.SetChildVisibility(true, false)
        OverallStats.SetChildWidth(0.052)
        OverallStats.GetItem(0, 0).SetWidth(0.07)
        OverallStats.IsDisplayed = false
        StandardMultiboard.UpdateOverallStatsMB()
    }

    private static BestTimesMultiboard() {
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1
        BestTimes.Columns = 6
        BestTimes.GetItem(0, 0).SetText('{color}Player|r')
        BestTimes.GetItem(0, 1).SetText('{color}1: Round|r')
        BestTimes.GetItem(0, 2).SetText('{color}2: Round|r')
        BestTimes.GetItem(0, 3).SetText('{color}3: Round|r')
        BestTimes.GetItem(0, 4).SetText('{color}4: Round|r')
        BestTimes.GetItem(0, 5).SetText('{color}5: Round|r')
        BestTimes.SetChildVisibility(true, false)
        BestTimes.SetChildWidth(0.05)
        BestTimes.GetItem(0, 0).SetWidth(0.07)
        BestTimes.IsDisplayed = false
        StandardMultiboard.UpdateBestTimesMB()
    }

    private static CurrentStatsRoundTimes() {
        let color = Colors.COLOR_GREEN
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) {
            CurrentStats.GetItem(0, i).SetText('{color}{Utility.ConvertFloatToTimeInt(GameTimer.RoundTime[i])}|r')
        }
    }

    private static CurrentGameStats() {
        try {
            CurrentStats.Title =
                'Stats: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
            CurrentStats.Rows = Globals.ALL_PLAYERS.Count + 2
            let rowIndex = 2

            // Use a list to hold keys for manual sorting
            PlayersList.Clear()

            for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
                PlayersList.Add(Globals.ALL_PLAYERS[i])
            }

            // Sort the array of keys based on custom criteria
            for (let i: number = 0; i < PlayersList.Count; i++) {
                for (let j: number = i + 1; j < PlayersList.Count; j++) {
                    let stats1 = Globals.ALL_KITTIES[PlayersList[i]].CurrentStats
                    let stats2 = Globals.ALL_KITTIES[PlayersList[j]].CurrentStats
                    let score1 = stats1.TotalSaves - stats1.TotalDeaths
                    let score2 = stats2.TotalSaves - stats2.TotalDeaths

                    if (score2 > score1 || (score2 == score1 && PlayersList[j].Id < PlayersList[i].Id)) {
                        let temp = PlayersList[i]
                        PlayersList[i] = PlayersList[j]
                        PlayersList[j] = temp
                    }
                }
            }

            for (let i: number = 0; i < PlayersList.Count; i++) {
                let player = PlayersList[i]
                let currentStats = Globals.ALL_KITTIES[player].CurrentStats
                let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1)

                let name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name
                let score = currentStats.TotalSaves - currentStats.TotalDeaths
                let kda =
                    currentStats.TotalDeaths == 0
                        ? currentStats.TotalSaves.ToString('F2')
                        : (currentStats.TotalSaves / currentStats.TotalDeaths).ToString('F2')

                PlayerStats[0] = name
                PlayerStats[1] = score.ToString()
                PlayerStats[2] = currentStats.TotalSaves.ToString()
                PlayerStats[3] = currentStats.TotalDeaths.ToString()
                PlayerStats[4] = currentStats.SaveStreak.ToString()
                PlayerStats[5] = kda
                PlayerStats[6] = '{currentStats.RoundSaves} / {currentStats.RoundDeaths}'

                for (
                    let j: number = 0;
                    j < PlayerStats.Length - 1;
                    j++ // skip last element
                ) {
                    CurrentStats.GetItem(rowIndex, j).SetText('{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}')
                    if (j == 0) CurrentStats.GetItem(rowIndex, j).SetWidth(0.07)
                }

                rowIndex++
            }
        } catch (ex: Error) {
            Console.WriteLine('{Colors.COLOR_DARK_RED}Error in multiboard: CurrentGameStats: {ex.Message}')
        }
    }

    private static OverallGameStats() {
        OverallStats.Title =
            'Stats: Overall {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        OverallStats.Rows = Globals.ALL_PLAYERS.Count + 1
        let rowIndex = 1

        PlayersList.Clear()
        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
            PlayersList.push(Globals.ALL_PLAYERS[i])
        }

        // Sort the array of keys based on custom criteria
        for (let i: number = 0; i < PlayersList.Count; i++) {
            for (let j: number = i + 1; j < PlayersList.Count; j++) {
                let stats1 = Globals.ALL_KITTIES[PlayersList[i]].SaveData.GameStats
                let stats2 = Globals.ALL_KITTIES[PlayersList[j]].SaveData.GameStats
                let score1 = stats1.Saves - stats1.Deaths
                let score2 = stats2.Saves - stats2.Deaths

                if (score2 > score1 || (score2 == score1 && PlayersList[j].Id < PlayersList[i].Id)) {
                    let temp = PlayersList[i]
                    PlayersList[i] = PlayersList[j]
                    PlayersList[j] = temp
                }
            }
        }

        for (let i: number = 0; i < PlayersList.Count; i++) {
            let player = PlayersList[i]
            let saveData = Globals.ALL_KITTIES[player].SaveData
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1)

            let name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name
            let allSaves = saveData.GameStats.Saves
            let allDeaths = saveData.GameStats.Deaths
            let score = allSaves - allDeaths
            let kda = allDeaths == 0 ? allSaves.ToString('F2') : (allSaves / allDeaths).ToString('F2')
            let gameCount = GetGameCount(saveData)
            let winCount = GetWinCount(saveData)

            PlayerStats[0] = name
            PlayerStats[1] = score.ToString()
            PlayerStats[2] = allSaves.ToString()
            PlayerStats[3] = allDeaths.ToString()
            PlayerStats[4] = saveData.GameStats.HighestSaveStreak.ToString()
            PlayerStats[5] = kda
            PlayerStats[6] = gameCount.ToString()
            PlayerStats[7] = winCount.ToString()

            for (let j: number = 0; j < PlayerStats.Length; j++) {
                OverallStats.GetItem(rowIndex, j).SetText('{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}')
                if (j == 0) OverallStats.GetItem(rowIndex, j).SetWidth(0.07)
            }

            rowIndex++
        }
    }

    private static BestTimesStats() {
        BestTimes.Title =
            'Times: Best {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.ToString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        BestTimes.Rows = Globals.ALL_PLAYERS.Count + 1
        let rowIndex = 1

        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
            let player = Globals.ALL_PLAYERS[i]
            let saveData = Globals.ALL_KITTIES[player].SaveData
            let playerColor = Colors.GetStringColorOfPlayer(player.Id + 1)

            let roundTimes = GetGameRoundTime(saveData)

            for (let j: number = 0; j < roundTimes.Length; j++) {
                if (roundTimes[j] != 0)
                    BestTimes.GetItem(rowIndex, j + 1).SetText(
                        '{playerColor}{Utility.ConvertFloatToTime(roundTimes[j])}{Colors.COLOR_RESET}'
                    )
                else BestTimes.GetItem(rowIndex, j + 1).SetText('{playerColor}---{Colors.COLOR_RESET}')
            }
            rowIndex++
        }
    }

    public static UpdateOverallStatsMB() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        StandardMultiboard.OverallGameStats()
    }

    public static UpdateStandardCurrentStatsMB() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        StandardMultiboard.CurrentGameStats()
    }

    public static UpdateBestTimesMB() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        MultiboardUtil.FillPlayers(BestTimes, 1)
        StandardMultiboard.BestTimesStats()
    }

    private static GetGameCount(data: KittyData) {
        let gameData = data.GameStats
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                return gameData.NormalGames
            case DifficultyLevel.Hard:
                return gameData.HardGames
            case DifficultyLevel.Impossible:
                return gameData.ImpossibleGames
            case DifficultyLevel.Nightmare:
                return gameData.NightmareGames
            default:
                Console.WriteLine('{Colors.COLOR_DARK_RED}getting: game: count: Error.')
                return 0
        }
    }

    private static GetWinCount(data: KittyData) {
        let gameData = data.GameStats
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                return gameData.NormalWins
            case DifficultyLevel.Hard:
                return gameData.HardWins
            case DifficultyLevel.Impossible:
                return gameData.ImpossibleWins
            case DifficultyLevel.Nightmare:
                return gameData.NightmareWins
            default:
                Console.WriteLine('{Colors.COLOR_DARK_RED}getting: win: count: Error.')
                return 0
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        let gameData = data.RoundTimes

        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                RoundTimes[0] = gameData.RoundOneNormal
                RoundTimes[1] = gameData.RoundTwoNormal
                RoundTimes[2] = gameData.RoundThreeNormal
                RoundTimes[3] = gameData.RoundFourNormal
                RoundTimes[4] = gameData.RoundFiveNormal
                break

            case DifficultyLevel.Hard:
                RoundTimes[0] = gameData.RoundOneHard
                RoundTimes[1] = gameData.RoundTwoHard
                RoundTimes[2] = gameData.RoundThreeHard
                RoundTimes[3] = gameData.RoundFourHard
                RoundTimes[4] = gameData.RoundFiveHard
                break

            case DifficultyLevel.Impossible:
                RoundTimes[0] = gameData.RoundOneImpossible
                RoundTimes[1] = gameData.RoundTwoImpossible
                RoundTimes[2] = gameData.RoundThreeImpossible
                RoundTimes[3] = gameData.RoundFourImpossible
                RoundTimes[4] = gameData.RoundFiveImpossible
                break
            case DifficultyLevel.Nightmare:
                RoundTimes[0] = gameData.RoundOneNightmare
                RoundTimes[1] = gameData.RoundTwoNightmare
                RoundTimes[2] = gameData.RoundThreeNightmare
                RoundTimes[3] = gameData.RoundFourNightmare
                RoundTimes[4] = gameData.RoundFiveNightmare
                break
            default:
                Console.WriteLine('{Colors.COLOR_DARK_RED}multiboard: getting: gamestat: data: Error.')
                return RoundTimes
        }
        return RoundTimes
    }

    private static ESCPressed() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        if (!GetTriggerPlayer().IsLocal) return
        if (CurrentStats.IsDisplayed) {
            CurrentStats.IsDisplayed = false
            OverallStats.IsDisplayed = true
        } else if (OverallStats.IsDisplayed) {
            OverallStats.IsDisplayed = false
            BestTimes.IsDisplayed = true
        } else if (BestTimes.IsDisplayed) {
            BestTimes.IsDisplayed = false
            CurrentStats.IsDisplayed = true
        }
    }
}
