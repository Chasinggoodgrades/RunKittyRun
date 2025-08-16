import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Multiboard, Trigger } from 'w3ts'
import { sumNumbers } from '../../Utility/Utility'
import { MultiboardUtil } from './MultiboardUtil'

export class SoloMultiboard {
    private static OverallBoard: Multiboard
    private static BestTimes: Multiboard
    private static ESCTrigger: Trigger
    private static sortedDict: Map<MapPlayer, Kitty>
    private static MBSlot: Map<MapPlayer, number>
    private static color: string = Colors.COLOR_YELLOW_ORANGE

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static Initialize() {
        try {
            if (CurrentGameMode.active !== GameMode.SoloTournament) return
            SoloMultiboard.OverallBoard = Multiboard.create()!
            SoloMultiboard.BestTimes = Multiboard.create()!
            SoloMultiboard.sortedDict = new Map()
            SoloMultiboard.MBSlot = new Map()
            SoloMultiboard.MakeMultiboard()
            SoloMultiboard.RegisterTriggers()
        } catch (ex: any) {
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
        SoloMultiboard.ESCTrigger = Trigger.create()!
        for (let player of Globals.ALL_PLAYERS)
            SoloMultiboard.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        SoloMultiboard.ESCTrigger.addAction(SoloMultiboard.ESCPressed)
    }

    private static OverallMultiboardRacemode() {
        if (Globals.CurrentGameModeType !== Globals.SOLO_MODES[1]) return // Race mode
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.columns = 9
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
        SoloMultiboard.OverallBoard.setItemsWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.OverallBoard.display(true)
        SoloMultiboard.UpdateOverallStatsMB()
    }

    private static OverallMultiboardProgressmode() {
        if (Globals.CurrentGameModeType !== Globals.SOLO_MODES[0]) return // Progression mode
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.OverallBoard.columns = 7
        SoloMultiboard.OverallBoard.GetItem(0, 0).setText('{color}Player|r')
        SoloMultiboard.OverallBoard.GetItem(0, 1).setText('{color}1: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 2).setText('{color}2: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 3).setText('{color}3: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 4).setText('{color}4: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 5).setText('{color}5: Round|r')
        SoloMultiboard.OverallBoard.GetItem(0, 6).setText('{color}Total|r')

        SoloMultiboard.OverallBoard.SetChildVisibility(true, false)
        SoloMultiboard.OverallBoard.setItemsWidth(0.05)
        SoloMultiboard.OverallBoard.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.OverallBoard.display(true)
        SoloMultiboard.OverallStats()
    }

    private static BestTimesMultiboard() {
        SoloMultiboard.BestTimes.rows = Globals.ALL_PLAYERS.length + 1
        SoloMultiboard.BestTimes.columns = 7
        SoloMultiboard.BestTimes.GetItem(0, 0).setText('{color}Player|r')
        SoloMultiboard.BestTimes.GetItem(0, 1).setText('{color}1: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 2).setText('{color}2: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 3).setText('{color}3: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 4).setText('{color}4: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 5).setText('{color}5: Round|r')
        SoloMultiboard.BestTimes.GetItem(0, 6).setText('{color}Time: Total|r')
        SoloMultiboard.BestTimes.SetChildVisibility(true, false)
        SoloMultiboard.BestTimes.setItemsWidth(0.05)
        SoloMultiboard.BestTimes.GetItem(0, 6).setWidth(0.06)
        SoloMultiboard.BestTimes.GetItem(0, 0).setWidth(0.07)
        SoloMultiboard.BestTimes.display(false)
        SoloMultiboard.UpdateBestTimesMB()
    }

    private static OverallStats() {
        SoloMultiboard.OverallBoard.title =
            'Game: Current {Colors.COLOR_YELLOW_ORANGE}[{CurrentGameMode.active}-{Globals.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        SoloMultiboard.OverallBoard.rows = Globals.ALL_PLAYERS.length + 1
        let rowIndex = 1

        // Create a shallow copy of Globals.ALL_KITTIES and sort it
        let sortedPlayers =
            Globals.CurrentGameModeType === Globals.SOLO_MODES[0]
                ? Array.from(Globals.ALL_KITTIES.entries()).sort((a, b) => {
                      let progDiff = b[1].TimeProg.GetOverallProgress() - a[1].TimeProg.GetOverallProgress()
                      if (progDiff !== 0) return progDiff
                      return a[0].id - b[0].id
                  }) // Progression mode
                : Array.from(Globals.ALL_KITTIES.entries()).sort((a, b) => {
                      let timeDiff = a[1].TimeProg.GetTotalTime() - b[1].TimeProg.GetTotalTime()
                      if (timeDiff !== 0) return timeDiff
                      let idDiff = a[0].id - b[0].id
                      if (idDiff !== 0) return idDiff
                      return a[1].Finished === b[1].Finished ? 0 : a[1].Finished ? 1 : -1
                  }) // Race Mode       -- Holy BAD LEAKS

        SoloMultiboard.sortedDict = new Map(sortedPlayers) // Avoid pass by reference

        for (let [player, _] of SoloMultiboard.sortedDict) {
            let times = SoloMultiboard.sortedDict.get(player)!.TimeProg
            let playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)
            let totalDeaths = SoloMultiboard.sortedDict.get(player)!.CurrentStats.TotalDeaths
            let name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            let status = Globals.ALL_KITTIES.get(player)!.Finished ? 'Finished' : 'Racing'
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

            for (let i: number = 0; i < stats.length; i++) {
                SoloMultiboard.OverallBoard.GetItem(rowIndex, i).setText('{playerColor}{stats[i]}{Colors.COLOR_RESET}')
                if (i === 0) SoloMultiboard.OverallBoard.GetItem(rowIndex, i).setWidth(0.07)
            }

            rowIndex++
            stats = []
        }

        SoloMultiboard.sortedDict = new Map()
    }

    private static BestTimeStats() {
        SoloMultiboard.BestTimes.title =
            'Times: Best {Colors.COLOR_YELLOW_ORANGE}[{CurrentGameMode.active}-{Globals.CurrentGameModeType}]|r {Colors.COLOR_RED}[ESC: Press]|r'
        let rowIndex = 1

        for (let player of Globals.ALL_PLAYERS) {
            // bad
            let saveData = Globals.ALL_KITTIES.get(player)!.SaveData
            let playerColor = ColorUtils.GetStringColorOfPlayer(player.id + 1)

            let roundTimes = SoloMultiboard.GetGameRoundTime(saveData)

            for (let i: number = 0; i < roundTimes.length; i++) {
                if (roundTimes[i] !== 0)
                    SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText(
                        '{playerColor}{Utility.ConvertFloatToTime(roundTimes[i])}{Colors.COLOR_RESET}'
                    )
                else SoloMultiboard.BestTimes.GetItem(rowIndex, i + 1).setText('{playerColor}---{Colors.COLOR_RESET}')
            }
            let sum = sumNumbers(roundTimes)
            SoloMultiboard.BestTimes.GetItem(rowIndex, 6).setText('{playerColor}{Utility.ConvertFloatToTime(sum)}')
            rowIndex++
            roundTimes.length = 0
        }
    }

    public static UpdateOverallStatsMB() {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        SoloMultiboard.OverallStats()
    }

    public static UpdateBestTimesMB() {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        MultiboardUtil.FillPlayers(SoloMultiboard.BestTimes, 1)
        SoloMultiboard.BestTimeStats()
    }

    public static UpdateDeathCount(player: MapPlayer) {
        try {
            if (CurrentGameMode.active !== GameMode.SoloTournament) return
            let value
            let rowIndex = (value = SoloMultiboard.MBSlot.get(player) ? value : 0)
            if (!rowIndex || rowIndex === 0) return
            SoloMultiboard.OverallBoard.GetItem(rowIndex, 1).setText(
                '{ColorUtils.GetStringColorOfPlayer(player.id + 1)}{Globals.ALL_KITTIES.get(player)!.CurrentStats.TotalDeaths}'
            )
        } catch (ex: any) {
            Logger.Critical('Error in SoloMultiboard.UpdateDeathCount: {ex.Message}')
            throw ex
        }
    }

    private static GetGameRoundTime(data: KittyData): number[] {
        let gameData = data.RoundTimes
        let roundTimes = []

        switch (CurrentGameMode.active) {
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
