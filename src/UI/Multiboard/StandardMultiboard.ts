import { GameTimer } from 'src/Game/Rounds/GameTimer'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Multiboard, Timer, Trigger } from 'w3ts'

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

    public static Initialize = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        StandardMultiboard.BestTimes = Multiboard.create()!
        StandardMultiboard.OverallStats = Multiboard.create()!
        StandardMultiboard.CurrentStats = Multiboard.create()!
        StandardMultiboard.Init()
    }

    /// <summary>
    /// Wait till difficulty is chosen, then begin..
    /// </summary>
    private static Init = () => {
        const t = Timer.create()
        t.start(1.0, true, () => {
            if (!Difficulty.IsDifficultyChosen) return
            StandardMultiboard.MakeMultiboard()
            StandardMultiboard.RegisterTriggers()
            t.destroy()
        })
    }

    private static RegisterTriggers = () => {
        StandardMultiboard.Updater = Trigger.create()!
        StandardMultiboard.ESCTrigger = Trigger.create()!

        StandardMultiboard.Updater.registerTimerEvent(1.0, true)
        StandardMultiboard.Updater.addAction(() => StandardMultiboard.CurrentStatsRoundTimes())

        for (const player of Globals.ALL_PLAYERS)
            StandardMultiboard.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        StandardMultiboard.ESCTrigger.addAction(() => StandardMultiboard.ESCPressed())
    }

    private static MakeMultiboard = () => {
        print('Making Standard Multiboard')
        StandardMultiboard.OverallGamesStatsMultiboard()
        StandardMultiboard.BestTimesMultiboard()
        StandardMultiboard.CurrentGameStatsMultiboard()
        StandardMultiboard.CurrentGameStats()
    }

    private static CurrentGameStatsMultiboard = () => {
        StandardMultiboard.CurrentStats.rows = Globals.ALL_PLAYERS.length + 2
        StandardMultiboard.CurrentStats.columns = 7
        StandardMultiboard.CurrentStats.GetItem(0, 0).setText(`${StandardMultiboard.color}Time: Round|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 0).setText(`${StandardMultiboard.color}Player|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 1).setText(`${StandardMultiboard.color}Score|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 2).setText(`${StandardMultiboard.color}Saves|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 3).setText(`${StandardMultiboard.color}Deaths|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 4).setText(`${StandardMultiboard.color}Streak|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 5).setText(`${StandardMultiboard.color}Ratio|r`)
        StandardMultiboard.CurrentStats.GetItem(1, 6).setText(`${StandardMultiboard.color}S / D|r`)
        StandardMultiboard.CurrentStats.SetChildVisibility(true, false)
        StandardMultiboard.CurrentStats.setItemsWidth(0.055)
        StandardMultiboard.CurrentStats.GetItem(1, 0).setWidth(0.07)
        StandardMultiboard.CurrentStats.display(true)
    }

    private static OverallGamesStatsMultiboard = () => {
        StandardMultiboard.OverallStats.rows = Globals.ALL_PLAYERS.length + 1
        StandardMultiboard.OverallStats.columns = 8
        StandardMultiboard.OverallStats.GetItem(0, 0).setText(`${StandardMultiboard.color}Player|r`)
        StandardMultiboard.OverallStats.GetItem(0, 1).setText(`${StandardMultiboard.color}Score:|r`)
        StandardMultiboard.OverallStats.GetItem(0, 2).setText(`${StandardMultiboard.color}Saves|r`)
        StandardMultiboard.OverallStats.GetItem(0, 3).setText(`${StandardMultiboard.color}Deaths|r`)
        StandardMultiboard.OverallStats.GetItem(0, 4).setText(`${StandardMultiboard.color}MaxStreak|r`)
        StandardMultiboard.OverallStats.GetItem(0, 5).setText(`${StandardMultiboard.color}  Ratio|r`)
        StandardMultiboard.OverallStats.GetItem(0, 6).setText(`${StandardMultiboard.color}Games|r`)
        StandardMultiboard.OverallStats.GetItem(0, 7).setText(`${StandardMultiboard.color}Wins|r`)
        StandardMultiboard.OverallStats.SetChildVisibility(true, false)
        StandardMultiboard.OverallStats.setItemsWidth(0.052)
        StandardMultiboard.OverallStats.GetItem(0, 0).setWidth(0.07)
        StandardMultiboard.OverallStats.display(false)
        StandardMultiboard.UpdateOverallStatsMB()
    }

    private static BestTimesMultiboard = () => {
        StandardMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        StandardMultiboard.BestTimes.columns = 6
        StandardMultiboard.BestTimes.GetItem(0, 0).setText(`${StandardMultiboard.color}Player|r`)
        StandardMultiboard.BestTimes.GetItem(0, 1).setText(`${StandardMultiboard.color}1: Round|r`)
        StandardMultiboard.BestTimes.GetItem(0, 2).setText(`${StandardMultiboard.color}2: Round|r`)
        StandardMultiboard.BestTimes.GetItem(0, 3).setText(`${StandardMultiboard.color}3: Round|r`)
        StandardMultiboard.BestTimes.GetItem(0, 4).setText(`${StandardMultiboard.color}4: Round|r`)
        StandardMultiboard.BestTimes.GetItem(0, 5).setText(`${StandardMultiboard.color}5: Round|r`)
        StandardMultiboard.BestTimes.SetChildVisibility(true, false)
        StandardMultiboard.BestTimes.setItemsWidth(0.05)
        StandardMultiboard.BestTimes.GetItem(0, 0).setWidth(0.07)
        StandardMultiboard.BestTimes.display(false)
        StandardMultiboard.UpdateBestTimesMB()
    }

    private static CurrentStatsRoundTimes = () => {
        const color = Colors.COLOR_GREEN
        for (let i = 1; i <= Globals.NumberOfRounds; i++) {
            StandardMultiboard.CurrentStats.GetItem(0, i).setText(
                `${color}${Utility.ConvertFloatToTimeInt(GameTimer.RoundTime[i] || 0)}|r`
            )
        }
    }

    private static CurrentGameStats = () => {
        try {
            StandardMultiboard.CurrentStats.title = `${Colors.COLOR_YELLOW_ORANGE}Current Stats [${CurrentGameMode.active}-${Difficulty.DifficultyOption.toString()}]|r ${Colors.COLOR_RED}[Press ESC]|r`
            StandardMultiboard.CurrentStats.rows = Globals.ALL_PLAYERS.length + 2
            let rowIndex = 2

            // Use a list to hold keys for manual sorting
            StandardMultiboard.PlayersList.length = 0

            for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
                StandardMultiboard.PlayersList.push(Globals.ALL_PLAYERS[i])
            }

            // Sort the array of keys based on custom criteria
            for (let i = 0; i < StandardMultiboard.PlayersList.length; i++) {
                for (let j: number = i + 1; j < StandardMultiboard.PlayersList.length; j++) {
                    const stats1 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[i])!.CurrentStats
                    const stats2 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[j])!.CurrentStats
                    const score1 = stats1.TotalSaves - stats1.TotalDeaths
                    const score2 = stats2.TotalSaves - stats2.TotalDeaths

                    if (
                        score2 > score1 ||
                        (score2 === score1 &&
                            StandardMultiboard.PlayersList[j].id < StandardMultiboard.PlayersList[i].id)
                    ) {
                        const temp = StandardMultiboard.PlayersList[i]
                        StandardMultiboard.PlayersList[i] = StandardMultiboard.PlayersList[j]
                        StandardMultiboard.PlayersList[j] = temp
                    }
                }
            }

            for (let i = 0; i < StandardMultiboard.PlayersList.length; i++) {
                const player = StandardMultiboard.PlayersList[i]
                const currentStats = Globals.ALL_KITTIES.get(player)!.CurrentStats
                const playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)

                const name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
                const score = currentStats.TotalSaves - currentStats.TotalDeaths
                const kda =
                    currentStats.TotalDeaths === 0
                        ? currentStats.TotalSaves.toFixed(2)
                        : (currentStats.TotalSaves / currentStats.TotalDeaths).toFixed(2)

                StandardMultiboard.PlayerStats[0] = name
                StandardMultiboard.PlayerStats[1] = score.toString()
                StandardMultiboard.PlayerStats[2] = currentStats.TotalSaves.toString()
                StandardMultiboard.PlayerStats[3] = currentStats.TotalDeaths.toString()
                StandardMultiboard.PlayerStats[4] = currentStats.SaveStreak.toString()
                StandardMultiboard.PlayerStats[5] = kda
                StandardMultiboard.PlayerStats[6] = `${currentStats.RoundSaves} / ${currentStats.RoundDeaths}`

                for (
                    let j = 0;
                    j < StandardMultiboard.PlayerStats.length - 1;
                    j++ // skip last element
                ) {
                    StandardMultiboard.CurrentStats.GetItem(rowIndex, j).setText(
                        `${playerColor}${StandardMultiboard.PlayerStats[j]}${Colors.COLOR_RESET}`
                    )
                    if (j === 0) StandardMultiboard.CurrentStats.GetItem(rowIndex, j).setWidth(0.07)
                }

                rowIndex++
            }
        } catch (ex: any) {
            print(`${Colors.COLOR_DARK_RED}Error in CurrentGameStats multiboard: ${ex}`)
        }
    }

    private static OverallGameStats = () => {
        StandardMultiboard.OverallStats.title = `Overall Stats ${Colors.COLOR_YELLOW_ORANGE}[${CurrentGameMode.active}-${Difficulty.DifficultyOption.toString()}]|r ${Colors.COLOR_RED}[Press ESC]|r`
        StandardMultiboard.OverallStats.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        StandardMultiboard.PlayersList.length = 0
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            StandardMultiboard.PlayersList.push(Globals.ALL_PLAYERS[i])
        }

        // Sort the array of keys based on custom criteria
        for (let i = 0; i < StandardMultiboard.PlayersList.length; i++) {
            for (let j: number = i + 1; j < StandardMultiboard.PlayersList.length; j++) {
                const stats1 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[i])!.SaveData.GameStats
                const stats2 = Globals.ALL_KITTIES.get(StandardMultiboard.PlayersList[j])!.SaveData.GameStats
                const score1 = stats1.Saves - stats1.Deaths
                const score2 = stats2.Saves - stats2.Deaths

                if (
                    score2 > score1 ||
                    (score2 === score1 && StandardMultiboard.PlayersList[j].id < StandardMultiboard.PlayersList[i].id)
                ) {
                    const temp = StandardMultiboard.PlayersList[i]
                    StandardMultiboard.PlayersList[i] = StandardMultiboard.PlayersList[j]
                    StandardMultiboard.PlayersList[j] = temp
                }
            }
        }

        for (let i = 0; i < StandardMultiboard.PlayersList.length; i++) {
            const player = StandardMultiboard.PlayersList[i]
            const saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            const playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)

            const name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            const allSaves = saveData.GameStats.Saves
            const allDeaths = saveData.GameStats.Deaths
            const score = allSaves - allDeaths
            const kda = allDeaths === 0 ? allSaves.toFixed(2) : (allSaves / allDeaths).toFixed(2)
            const gameCount = StandardMultiboard.GetGameCount(saveData)
            const winCount = StandardMultiboard.GetWinCount(saveData)

            StandardMultiboard.PlayerStats[0] = name
            StandardMultiboard.PlayerStats[1] = score.toString()
            StandardMultiboard.PlayerStats[2] = allSaves.toString()
            StandardMultiboard.PlayerStats[3] = allDeaths.toString()
            StandardMultiboard.PlayerStats[4] = saveData.GameStats.HighestSaveStreak.toString()
            StandardMultiboard.PlayerStats[5] = kda
            StandardMultiboard.PlayerStats[6] = gameCount.toString()
            StandardMultiboard.PlayerStats[7] = winCount.toString()

            for (let j = 0; j < StandardMultiboard.PlayerStats.length; j++) {
                StandardMultiboard.OverallStats.GetItem(rowIndex, j).setText(
                    `${playerColor}${StandardMultiboard.PlayerStats[j]}${Colors.COLOR_RESET}`
                )
                if (j === 0) StandardMultiboard.OverallStats.GetItem(rowIndex, j).setWidth(0.07)
            }

            rowIndex++
        }
    }

    private static BestTimesStats = () => {
        StandardMultiboard.BestTimes.title = `Best Times ${Colors.COLOR_YELLOW_ORANGE}[${CurrentGameMode.active}-${Difficulty.DifficultyOption.toString()}]|r ${Colors.COLOR_RED}[Press ESC]|r`
        StandardMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const player = Globals.ALL_PLAYERS[i]
            const saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            const playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)

            const roundTimes = StandardMultiboard.GetGameRoundTime(saveData)

            for (let j = 0; j < roundTimes.length; j++) {
                if (roundTimes[j] !== 0)
                    StandardMultiboard.BestTimes.GetItem(rowIndex, j + 1).setText(
                        `${playerColor}${Utility.ConvertFloatToTime(roundTimes[j])}${Colors.COLOR_RESET}`
                    )
                else
                    StandardMultiboard.BestTimes.GetItem(rowIndex, j + 1).setText(
                        `${playerColor}---${Colors.COLOR_RESET}`
                    )
            }
            rowIndex++
        }
    }

    public static UpdateOverallStatsMB = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        StandardMultiboard.OverallGameStats()
    }

    public static UpdateStandardCurrentStatsMB = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        StandardMultiboard.CurrentGameStats()
    }

    public static UpdateBestTimesMB = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        StandardMultiboard.FillPlayers(StandardMultiboard.BestTimes, 1)
        StandardMultiboard.BestTimesStats()
    }

    public static FillPlayers(mb: Multiboard, rowIndex = 2) {
        for (const player of Globals.ALL_PLAYERS) {
            const name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            mb.GetItem(rowIndex, 0).setText(`${ColorUtils.GetStringColorOfPlayer(player.id + 1)}${name}|r`)
            mb.GetItem(rowIndex, 0).setWidth(0.07)
            rowIndex++
        }
    }

    private static GetGameCount(data: KittyData) {
        const gameData = data.GameStats
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
                print(`${Colors.COLOR_DARK_RED}Error getting game count.`)
                return 0
        }
    }

    private static GetWinCount(data: KittyData) {
        const gameData = data.GameStats
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
                print(`${Colors.COLOR_DARK_RED}Error getting win count.`)
                return 0
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        const gameData = data.RoundTimes

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
                print(`${Colors.COLOR_DARK_RED}Error getting gamestat data for multiboard.`)
                return StandardMultiboard.RoundTimes
        }
        return StandardMultiboard.RoundTimes
    }

    private static ESCPressed = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        if (!getTriggerPlayer().isLocal()) return
        if (StandardMultiboard.CurrentStats.displayed) {
            StandardMultiboard.CurrentStats.display(false)
            StandardMultiboard.OverallStats.display(true)
        } else if (StandardMultiboard.OverallStats.displayed) {
            StandardMultiboard.OverallStats.display(false)
            StandardMultiboard.BestTimes.display(true)
        } else if (StandardMultiboard.BestTimes.displayed) {
            StandardMultiboard.BestTimes.display(false)
            StandardMultiboard.CurrentStats.display(true)
        }
    }
}
