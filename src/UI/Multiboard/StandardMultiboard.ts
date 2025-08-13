import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Multiboard, Timer, Trigger } from 'w3ts'
import { MultiboardUtil } from './MultiboardUtil'

export class StandardMultiboard {
    public static OverallStats: Multiboard
    public static CurrentStats: Multiboard
    public static BestTimes: Multiboard
    private static Updater: Trigger
    private static ESCTrigger: Trigger

    private static color: string = Colors.COLOR_YELLOW_ORANGE
    private static PlayerStats: string[] = []
    private static RoundTimes: number[] = []
    private static PlayersList: MapPlayer[] = []

    public static Initialize() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let BestTimes = Multiboard.create()!
        let OverallStats = Multiboard.create()!
        let CurrentStats = Multiboard.create()!
        StandardMultiboard.Init()
    }

    /// <summary>
    /// Wait till difficulty is chosen, then begin..
    /// </summary>
    private static Init() {
        let t = Timer.create()
        TimerStart(
            t,
            1.0,
            true,
            ErrorHandler.Wrap(() => {
                if (!Difficulty.IsDifficultyChosen) return
                StandardMultiboard.MakeMultiboard()
                StandardMultiboard.RegisterTriggers()
                DestroyTimer(t)
            })
        )
    }

    private static RegisterTriggers() {
        let Updater = Trigger.create()!
        let ESCTrigger = Trigger.create()!

        Updater.registerTimerEvent(1.0, true)
        Updater.addAction(StandardMultiboard.CurrentStatsRoundTimes)

        for (let player of Globals.ALL_PLAYERS) ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        ESCTrigger.addAction(StandardMultiboard.ESCPressed)
    }

    private static MakeMultiboard() {
        StandardMultiboard.OverallGamesStatsMultiboard()
        StandardMultiboard.BestTimesMultiboard()
        StandardMultiboard.CurrentGameStatsMultiboard()
        StandardMultiboard.CurrentGameStats()
    }

    private static CurrentGameStatsMultiboard() {
        StandardMultiboard.CurrentStats.rows = Globals.ALL_PLAYERS.length + 2
        StandardMultiboard.CurrentStats.columns = 7
        StandardMultiboard.CurrentStats.GetItem(0, 0).setText('{color}Time: Round|r')
        StandardMultiboard.CurrentStats.GetItem(1, 0).setText('{color}Player|r')
        StandardMultiboard.CurrentStats.GetItem(1, 1).setText('{color}Score|r')
        StandardMultiboard.CurrentStats.GetItem(1, 2).setText('{color}Saves|r')
        StandardMultiboard.CurrentStats.GetItem(1, 3).setText('{color}Deaths|r')
        StandardMultiboard.CurrentStats.GetItem(1, 4).setText('{color}Streak|r')
        StandardMultiboard.CurrentStats.GetItem(1, 5).setText('{color}Ratio|r')
        StandardMultiboard.CurrentStats.GetItem(1, 6).setText('{color}S / D|r')
        StandardMultiboard.CurrentStats.SetChildVisibility(true, false)
        StandardMultiboard.CurrentStats.setItemsWidth(0.055)
        StandardMultiboard.CurrentStats.GetItem(1, 0).SetWidth(0.07)
        StandardMultiboard.CurrentStats.display = true
    }

    private static OverallGamesStatsMultiboard() {
        StandardMultiboard.OverallStats.rows = Globals.ALL_PLAYERS.length + 1
        StandardMultiboard.OverallStats.columns = 8
        StandardMultiboard.OverallStats.GetItem(0, 0).setText('{color}Player|r')
        StandardMultiboard.OverallStats.GetItem(0, 1).setText('{color}Score:|r')
        StandardMultiboard.OverallStats.GetItem(0, 2).setText('{color}Saves|r')
        StandardMultiboard.OverallStats.GetItem(0, 3).setText('{color}Deaths|r')
        StandardMultiboard.OverallStats.GetItem(0, 4).setText('{color}MaxStreak|r')
        StandardMultiboard.OverallStats.GetItem(0, 5).setText('{color}  Ratio|r')
        StandardMultiboard.OverallStats.GetItem(0, 6).setText('{color}Games|r')
        StandardMultiboard.OverallStats.GetItem(0, 7).setText('{color}Wins|r')
        StandardMultiboard.OverallStats.SetChildVisibility(true, false)
        StandardMultiboard.OverallStats.setItemsWidth(0.052)
        StandardMultiboard.OverallStats.GetItem(0, 0).SetWidth(0.07)
        StandardMultiboard.OverallStats.display = false
        StandardMultiboard.UpdateOverallStatsMB()
    }

    private static BestTimesMultiboard() {
        StandardMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        StandardMultiboard.BestTimes.columns = 6
        StandardMultiboard.BestTimes.GetItem(0, 0).setText('{color}Player|r')
        StandardMultiboard.BestTimes.GetItem(0, 1).setText('{color}1: Round|r')
        StandardMultiboard.BestTimes.GetItem(0, 2).setText('{color}2: Round|r')
        StandardMultiboard.BestTimes.GetItem(0, 3).setText('{color}3: Round|r')
        StandardMultiboard.BestTimes.GetItem(0, 4).setText('{color}4: Round|r')
        StandardMultiboard.BestTimes.GetItem(0, 5).setText('{color}5: Round|r')
        StandardMultiboard.BestTimes.SetChildVisibility(true, false)
        StandardMultiboard.BestTimes.setItemsWidth(0.05)
        StandardMultiboard.BestTimes.GetItem(0, 0).SetWidth(0.07)
        StandardMultiboard.BestTimes.display = false
        StandardMultiboard.UpdateBestTimesMB()
    }

    private static CurrentStatsRoundTimes() {
        let color = Colors.COLOR_GREEN
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) {
            StandardMultiboard.CurrentStats.GetItem(0, i).setText(
                '{color}{Utility.ConvertFloatToTimeInt(GameTimer.RoundTime[i])}|r'
            )
        }
    }

    private static CurrentGameStats() {
        try {
            StandardMultiboard.CurrentStats.title =
                'Stats: Current {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.toString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
            StandardMultiboard.CurrentStats.rows = Globals.ALL_PLAYERS.length + 2
            let rowIndex = 2

            // Use a list to hold keys for manual sorting
            StandardMultiboard.PlayersList.clear()

            for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                StandardMultiboard.PlayersList.push(Globals.ALL_PLAYERS[i])
            }

            // Sort the array of keys based on custom criteria
            for (let i: number = 0; i < StandardMultiboard.PlayersList.length; i++) {
                for (let j: number = i + 1; j < StandardMultiboard.PlayersList.length; j++) {
                    let stats1 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[i])!.CurrentStats
                    let stats2 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[j])!.CurrentStats
                    let score1 = stats1.TotalSaves - stats1.TotalDeaths
                    let score2 = stats2.TotalSaves - stats2.TotalDeaths

                    if (
                        score2 > score1 ||
                        (score2 == score1 &&
                            StandardMultiboard.PlayersList[j].id < StandardMultiboard.PlayersList[i].id)
                    ) {
                        let temp = StandardMultiboard.PlayersList[i]
                        StandardMultiboard.PlayersList[i] = StandardMultiboard.PlayersList[j]
                        StandardMultiboard.PlayersList[j] = temp
                    }
                }
            }

            for (let i: number = 0; i < StandardMultiboard.PlayersList.length; i++) {
                let player = StandardMultiboard.PlayersList[i]
                let currentStats = Globals.ALL_KITTIES.get(player)!.CurrentStats
                let playerColor = Colors.GetStringColorOfPlayer(player.id + 1)

                let name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
                let score = currentStats.TotalSaves - currentStats.TotalDeaths
                let kda =
                    currentStats.TotalDeaths == 0
                        ? currentStats.TotalSaves.ToString('F2')
                        : (currentStats.TotalSaves / currentStats.TotalDeaths).ToString('F2')

                StandardMultiboard.PlayerStats[0] = name
                StandardMultiboard.PlayerStats[1] = score.toString()
                StandardMultiboard.PlayerStats[2] = currentStats.TotalSaves.toString()
                StandardMultiboard.PlayerStats[3] = currentStats.TotalDeaths.toString()
                StandardMultiboard.PlayerStats[4] = currentStats.SaveStreak.toString()
                StandardMultiboard.PlayerStats[5] = kda
                StandardMultiboard.PlayerStats[6] = '{currentStats.RoundSaves} / {currentStats.RoundDeaths}'

                for (
                    let j: number = 0;
                    j < StandardMultiboard.PlayerStats.length - 1;
                    j++ // skip last element
                ) {
                    StandardMultiboard.CurrentStats.GetItem(rowIndex, j).setText(
                        '{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}'
                    )
                    if (j == 0) StandardMultiboard.CurrentStats.GetItem(rowIndex, j).SetWidth(0.07)
                }

                rowIndex++
            }
        } catch (ex: any) {
            print('{Colors.COLOR_DARK_RED}Error in multiboard: CurrentGameStats: {ex.Message}')
        }
    }

    private static OverallGameStats() {
        StandardMultiboard.OverallStats.title =
            'Stats: Overall {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.toString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        StandardMultiboard.OverallStats.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        StandardMultiboard.PlayersList.clear()
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            StandardMultiboard.PlayersList.push(Globals.ALL_PLAYERS[i])
        }

        // Sort the array of keys based on custom criteria
        for (let i: number = 0; i < StandardMultiboard.PlayersList.length; i++) {
            for (let j: number = i + 1; j < StandardMultiboard.PlayersList.length; j++) {
                let stats1 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[i])!.SaveData.GameStats
                let stats2 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[j])!.SaveData.GameStats
                let score1 = stats1.Saves - stats1.Deaths
                let score2 = stats2.Saves - stats2.Deaths

                if (
                    score2 > score1 ||
                    (score2 == score1 && StandardMultiboard.PlayersList[j].id < StandardMultiboard.PlayersList[i].id)
                ) {
                    let temp = StandardMultiboard.PlayersList[i]
                    StandardMultiboard.PlayersList[i] = StandardMultiboard.PlayersList[j]
                    StandardMultiboard.PlayersList[j] = temp
                }
            }
        }

        for (let i: number = 0; i < StandardMultiboard.PlayersList.length; i++) {
            let player = StandardMultiboard.PlayersList[i]
            let saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            let playerColor = Colors.GetStringColorOfPlayer(player.id + 1)

            let name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            let allSaves = saveData.GameStats.Saves
            let allDeaths = saveData.GameStats.Deaths
            let score = allSaves - allDeaths
            let kda = allDeaths == 0 ? allSaves.ToString('F2') : (allSaves / allDeaths).ToString('F2')
            let gameCount = StandardMultiboard.GetGameCount(saveData)
            let winCount = StandardMultiboard.GetWinCount(saveData)

            StandardMultiboard.PlayerStats[0] = name
            StandardMultiboard.PlayerStats[1] = score.toString()
            StandardMultiboard.PlayerStats[2] = allSaves.toString()
            StandardMultiboard.PlayerStats[3] = allDeaths.toString()
            StandardMultiboard.PlayerStats[4] = saveData.GameStats.HighestSaveStreak.toString()
            StandardMultiboard.PlayerStats[5] = kda
            StandardMultiboard.PlayerStats[6] = gameCount.toString()
            StandardMultiboard.PlayerStats[7] = winCount.toString()

            for (let j: number = 0; j < StandardMultiboard.PlayerStats.length; j++) {
                StandardMultiboard.OverallStats.GetItem(rowIndex, j).setText(
                    '{playerColor}{PlayerStats[j]}{Colors.COLOR_RESET}'
                )
                if (j == 0) StandardMultiboard.OverallStats.GetItem(rowIndex, j).SetWidth(0.07)
            }

            rowIndex++
        }
    }

    private static BestTimesStats() {
        StandardMultiboard.BestTimes.title =
            'Times: Best {Colors.COLOR_YELLOW_ORANGE}[{Gamemode.CurrentGameMode}-{Difficulty.DifficultyOption.toString()}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        StandardMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let player = Globals.ALL_PLAYERS[i]
            let saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            let playerColor = Colors.GetStringColorOfPlayer(player.id + 1)

            let roundTimes = StandardMultiboard.GetGameRoundTime(saveData)

            for (let j: number = 0; j < roundTimes.length; j++) {
                if (roundTimes[j] != 0)
                    StandardMultiboard.BestTimes.GetItem(rowIndex, j + 1).setText(
                        '{playerColor}{Utility.ConvertFloatToTime(roundTimes[j])}{Colors.COLOR_RESET}'
                    )
                else
                    StandardMultiboard.BestTimes.GetItem(rowIndex, j + 1).setText(
                        '{playerColor}---{Colors.COLOR_RESET}'
                    )
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
        MultiboardUtil.FillPlayers(StandardMultiboard.BestTimes, 1)
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
                print('{Colors.COLOR_DARK_RED}getting: game: count: Error.')
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
                print('{Colors.COLOR_DARK_RED}getting: win: count: Error.')
                return 0
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        let gameData = data.RoundTimes

        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                StandardMultiboard.RoundTimes[0] = gameData.RoundOneNormal
                StandardMultiboard.RoundTimes[1] = gameData.RoundTwoNormal
                StandardMultiboard.RoundTimes[2] = gameData.RoundThreeNormal
                StandardMultiboard.RoundTimes[3] = gameData.RoundFourNormal
                StandardMultiboard.RoundTimes[4] = gameData.RoundFiveNormal
                break

            case DifficultyLevel.Hard:
                StandardMultiboard.RoundTimes[0] = gameData.RoundOneHard
                StandardMultiboard.RoundTimes[1] = gameData.RoundTwoHard
                StandardMultiboard.RoundTimes[2] = gameData.RoundThreeHard
                StandardMultiboard.RoundTimes[3] = gameData.RoundFourHard
                StandardMultiboard.RoundTimes[4] = gameData.RoundFiveHard
                break

            case DifficultyLevel.Impossible:
                StandardMultiboard.RoundTimes[0] = gameData.RoundOneImpossible
                StandardMultiboard.RoundTimes[1] = gameData.RoundTwoImpossible
                StandardMultiboard.RoundTimes[2] = gameData.RoundThreeImpossible
                StandardMultiboard.RoundTimes[3] = gameData.RoundFourImpossible
                StandardMultiboard.RoundTimes[4] = gameData.RoundFiveImpossible
                break
            case DifficultyLevel.Nightmare:
                StandardMultiboard.RoundTimes[0] = gameData.RoundOneNightmare
                StandardMultiboard.RoundTimes[1] = gameData.RoundTwoNightmare
                StandardMultiboard.RoundTimes[2] = gameData.RoundThreeNightmare
                StandardMultiboard.RoundTimes[3] = gameData.RoundFourNightmare
                StandardMultiboard.RoundTimes[4] = gameData.RoundFiveNightmare
                break
            default:
                print('{Colors.COLOR_DARK_RED}multiboard: getting: gamestat: data: Error.')
                return StandardMultiboard.RoundTimes
        }
        return StandardMultiboard.RoundTimes
    }

    private static ESCPressed() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        if (!getTriggerPlayer().isLocal()) return
        if (StandardMultiboard.CurrentStats.displayed) {
            StandardMultiboard.CurrentStats.display = false
            StandardMultiboard.OverallStats.display = true
        } else if (StandardMultiboard.OverallStats.displayed) {
            StandardMultiboard.OverallStats.display = false
            StandardMultiboard.BestTimes.display = true
        } else if (StandardMultiboard.BestTimes.displayed) {
            StandardMultiboard.BestTimes.display = false
            StandardMultiboard.CurrentStats.display = true
        }
    }
}
