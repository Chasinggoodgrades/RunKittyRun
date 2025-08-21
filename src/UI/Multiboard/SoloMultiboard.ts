import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Multiboard, Trigger } from 'w3ts'
import { sumNumbers, Utility } from '../../Utility/Utility'

export class SoloMultiboard {
    private static OverallBoard: Multiboard
    private static BestTimes: Multiboard
    private static ESCTrigger: Trigger
    private static sortedDict: Map<MapPlayer, Kitty>
    private static MBSlot: Map<MapPlayer, number>
    private static color = Colors.COLOR_YELLOW_ORANGE

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static Initialize = () => {
        try {
            if (CurrentGameMode.active !== GameMode.SoloTournament) return
            SoloMultiboard.OverallBoard = Multiboard.create()!
            SoloMultiboard.BestTimes = Multiboard.create()!
            SoloMultiboard.sortedDict = new Map()
            SoloMultiboard.MBSlot = new Map()
            SoloMultiboard.MakeMultiboard()
            SoloMultiboard.RegisterTriggers()
        } catch (e) {
            Logger.Critical(`Error in SoloMultiboard: ${e}`)
            throw e
        }
    }

    private static MakeMultiboard = () => {
        SoloMultiboard.BestTimesMultiboard()
        SoloMultiboard.OverallMultiboardRacemode()
        SoloMultiboard.OverallMultiboardProgressmode()
    }

    private static RegisterTriggers = () => {
        SoloMultiboard.ESCTrigger = Trigger.create()!
        for (const player of Globals.ALL_PLAYERS)
            SoloMultiboard.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        SoloMultiboard.ESCTrigger.addAction(() => SoloMultiboard.ESCPressed())
    }

    private static OverallMultiboardRacemode = () => {
        if (Globals.CurrentGameModeType !== Globals.SOLO_MODES[1]) return // Race mode
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.columns = 9
        SoloMultiboard.OverallBoard.GetItem(0, 0).setText(`${Colors.COLOR_YELLOW}Player|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 1).setText(`${Colors.COLOR_YELLOW}Deaths|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 2).setText(`${Colors.COLOR_YELLOW}1: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 3).setText(`${Colors.COLOR_YELLOW}2: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 4).setText(`${Colors.COLOR_YELLOW}3: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 5).setText(`${Colors.COLOR_YELLOW}4: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 6).setText(`${Colors.COLOR_YELLOW}5: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 7).setText(`${Colors.COLOR_YELLOW}Total|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 8).setText(`${Colors.COLOR_YELLOW}Status|r`)

        SoloMultiboard.OverallBoard.SetChildVisibility(true, false)
        SoloMultiboard.OverallBoard.setItemsWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.OverallBoard.display(true)
        SoloMultiboard.UpdateOverallStatsMB()
    }

    private static OverallMultiboardProgressmode = () => {
        if (Globals.CurrentGameModeType !== Globals.SOLO_MODES[0]) return // Progression mode
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.columns = 7
        SoloMultiboard.OverallBoard.GetItem(0, 0).setText(`${Colors.COLOR_YELLOW}Player|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 1).setText(`${Colors.COLOR_YELLOW}1: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 2).setText(`${Colors.COLOR_YELLOW}2: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 3).setText(`${Colors.COLOR_YELLOW}3: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 4).setText(`${Colors.COLOR_YELLOW}4: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 5).setText(`${Colors.COLOR_YELLOW}5: Round|r`)
        SoloMultiboard.OverallBoard.GetItem(0, 6).setText(`${Colors.COLOR_YELLOW}Total|r`)

        SoloMultiboard.OverallBoard.SetChildVisibility(true, false)
        SoloMultiboard.OverallBoard.setItemsWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.OverallBoard.display(true)
        SoloMultiboard.OverallStats()
    }

    private static BestTimesMultiboard = () => {
        SoloMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.BestTimes.columns = 7
        SoloMultiboard.BestTimes.GetItem(0, 0).setText(`${Colors.COLOR_YELLOW}Player|r`)
        SoloMultiboard.BestTimes.GetItem(0, 1).setText(`${Colors.COLOR_YELLOW}1: Round|r`)
        SoloMultiboard.BestTimes.GetItem(0, 2).setText(`${Colors.COLOR_YELLOW}2: Round|r`)
        SoloMultiboard.BestTimes.GetItem(0, 3).setText(`${Colors.COLOR_YELLOW}3: Round|r`)
        SoloMultiboard.BestTimes.GetItem(0, 4).setText(`${Colors.COLOR_YELLOW}4: Round|r`)
        SoloMultiboard.BestTimes.GetItem(0, 5).setText(`${Colors.COLOR_YELLOW}5: Round|r`)
        SoloMultiboard.BestTimes.GetItem(0, 6).setText(`${Colors.COLOR_YELLOW}Time: Total|r`)
        SoloMultiboard.BestTimes.SetChildVisibility(true, false)
        SoloMultiboard.BestTimes.setItemsWidth(0.05)
        SoloMultiboard.BestTimes.GetItem(0, 6).setWidth(0.06)
        SoloMultiboard.BestTimes.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.BestTimes.display(false)
        SoloMultiboard.UpdateBestTimesMB()
    }

    private static OverallStats = () => {
        SoloMultiboard.OverallBoard.title = `Current Game ${Colors.COLOR_YELLOW_ORANGE}[${CurrentGameMode.active}-${Globals.CurrentGameModeType}]|r ${Colors.COLOR_RED}[Press ESC]|r`
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        // Create a shallow copy of Globals.ALL_KITTIES and sort it
        const sortedPlayers =
            Globals.CurrentGameModeType === Globals.SOLO_MODES[0]
                ? Array.from(Globals.ALL_KITTIES.entries()).sort((a, b) => {
                      const progDiff = b[1].TimeProg.GetOverallProgress() - a[1].TimeProg.GetOverallProgress()
                      if (progDiff !== 0) return progDiff
                      return a[0].id - b[0].id
                  }) // Progression mode
                : Array.from(Globals.ALL_KITTIES.entries()).sort((a, b) => {
                      const timeDiff = a[1].TimeProg.GetTotalTime() - b[1].TimeProg.GetTotalTime()
                      if (timeDiff !== 0) return timeDiff
                      const idDiff = a[0].id - b[0].id
                      if (idDiff !== 0) return idDiff
                      return a[1].Finished === b[1].Finished ? 0 : a[1].Finished ? 1 : -1
                  }) // Race Mode       -- Holy BAD LEAKS

        SoloMultiboard.sortedDict = new Map(sortedPlayers) // Avoid pass by reference

        for (const [player, _] of SoloMultiboard.sortedDict) {
            const times = SoloMultiboard.sortedDict.get(player)!.TimeProg
            const playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)
            const totalDeaths = SoloMultiboard.sortedDict.get(player)!.CurrentStats.TotalDeaths
            const name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            const status = Globals.ALL_KITTIES.get(player)!.Finished ? 'Finished' : 'Racing'
            SoloMultiboard.MBSlot.set(player, rowIndex)
            let stats =
                Globals.CurrentGameModeType === Globals.SOLO_MODES[0]
                    ? [
                          name,
                          times.GetRoundProgress(1).toFixed(2) + '%',
                          times.GetRoundProgress(2).toFixed(2) + '%',
                          times.GetRoundProgress(3).toFixed(2) + '%',
                          times.GetRoundProgress(4).toFixed(2) + '%',
                          times.GetRoundProgress(5).toFixed(2) + '%',
                          times.GetOverallProgress().toFixed(2) + '%',
                      ]
                    : [
                          name,
                          totalDeaths.toString(),
                          times.GetRoundTimeFormatted(1),
                          times.GetRoundTimeFormatted(2),
                          times.GetRoundTimeFormatted(3),
                          times.GetRoundTimeFormatted(4),
                          times.GetRoundTimeFormatted(5),
                          times.GetTotalTimeFormatted(),
                          status,
                      ]

            for (let i = 0; i < stats.length; i++) {
                SoloMultiboard.OverallBoard.GetItem(rowIndex, i).setText(
                    `${playerColor}${stats[i]}${Colors.COLOR_RESET}`
                )
                if (i === 0) SoloMultiboard.OverallBoard.GetItem(rowIndex, i).setWidth(0.07)
            }

            rowIndex++
            stats = []
        }

        SoloMultiboard.sortedDict = new Map()
    }

    private static BestTimeStats = () => {
        SoloMultiboard.BestTimes.title = `Best Times ${Colors.COLOR_YELLOW_ORANGE}[${CurrentGameMode.active}-${Globals.CurrentGameModeType}]|r ${Colors.COLOR_RED}[Press ESC]|r`
        let rowIndex = 1

        for (const player of Globals.ALL_PLAYERS) {
            // bad
            const saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            const playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)

            const roundTimes = SoloMultiboard.GetGameRoundTime(saveData)

            for (let i = 0; i < roundTimes.length; i++) {
                if (roundTimes[i] !== 0)
                    SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText(
                        `${playerColor}${Utility.ConvertFloatToTime(roundTimes[i])}${Colors.COLOR_RESET}`
                    )
                else SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText(`${playerColor}---${Colors.COLOR_RESET}`)
            }
            const sum = sumNumbers(roundTimes)
            SoloMultiboard.BestTimes.GetItem(rowIndex, 6).setText(
                `${playerColor}${Utility.ConvertFloatToTime(sum)}${Colors.COLOR_RESET}`
            )
            rowIndex++
            roundTimes.length = 0
        }
    }

    public static UpdateOverallStatsMB = () => {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        SoloMultiboard.OverallStats()
    }

    public static UpdateBestTimesMB = () => {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        SoloMultiboard.FillPlayers(SoloMultiboard.BestTimes, 1)
        SoloMultiboard.BestTimeStats()
    }

    public static FillPlayers = (mb: Multiboard, rowIndex = 2) => {
        for (const player of Globals.ALL_PLAYERS) {
            const name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            mb.GetItem(rowIndex, 0).setText(`${ColorUtils.GetStringColorOfPlayer(player.id + 1)}${name}|r`)
            mb.GetItem(rowIndex, 0).setWidth(0.07)
            rowIndex++
        }
    }

    public static UpdateDeathCount = (player: MapPlayer) => {
        try {
            if (CurrentGameMode.active !== GameMode.SoloTournament) return
            let value
            const rowIndex = (value = SoloMultiboard.MBSlot.get(player) ? value : 0)
            if (!rowIndex || rowIndex === 0) return
            SoloMultiboard.OverallBoard.GetItem(rowIndex, 1).setText(
                `${ColorUtils.GetStringColorOfPlayer(player.id + 1)}${Globals.ALL_KITTIES.get(player)!.CurrentStats.TotalDeaths}`
            )
        } catch (e) {
            Logger.Critical(`Error in SoloMultiboard.UpdateDeathCount: ${e}`)
            throw e
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        const gameData = data.RoundTimes
        const roundTimes = []

        switch (CurrentGameMode.active) {
            case GameMode.SoloTournament:
                roundTimes[0] = gameData.RoundOneSolo
                roundTimes[1] = gameData.RoundTwoSolo
                roundTimes[2] = gameData.RoundThreeSolo
                roundTimes[3] = gameData.RoundFourSolo
                roundTimes[4] = gameData.RoundFiveSolo
                break

            default:
                print(`${Colors.COLOR_DARK_RED}Error getting gamestat data for multiboard.`)
                return []
        }
        return roundTimes
    }

    private static ESCPressed = () => {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return // Solo mode
        const triggerPlayer = getTriggerPlayer()
        if (!triggerPlayer || !triggerPlayer.isLocal()) return
        if (SoloMultiboard.OverallBoard.displayed) {
            SoloMultiboard.OverallBoard.display(false)
            SoloMultiboard.BestTimes.display(true)
        } else {
            SoloMultiboard.BestTimes.display(false)
            SoloMultiboard.OverallBoard.display(true)
        }
    }
}
