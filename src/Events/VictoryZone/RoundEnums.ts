import { GameTimer } from 'src/Game/Rounds/GameTimer'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { RoundTimesData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'
import { roundDecimals } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { Logger } from '../Logger/Logger'

export class RoundEnums {
    public static GetRoundEnum(): string {
        let currentDiff = Difficulty.DifficultyValue
        let roundEnum: string
        switch (currentDiff) {
            case DifficultyLevel.Normal:
                roundEnum = this.GetNormalRoundEnum()
                break

            case DifficultyLevel.Hard:
                roundEnum = this.GetHardRoundEnum()
                break

            case DifficultyLevel.Impossible:
                roundEnum = this.GetImpossibleRoundEnum()
                break
            case DifficultyLevel.Nightmare:
                roundEnum = this.GetNightmareRoundEnum()
                break
            default:
                Logger.Critical('difficulty: level: for: GetRoundEnum: Invalid')
                return ''
        }
        return roundEnum
    }

    public static GetSoloEnum(): string {
        let roundEnum = this.GetSoloRoundEnum()
        return roundEnum
    }

    public static SetSavedTime(player: MapPlayer, roundString: string) {
        let kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData
        kittyStats.RoundTimes[roundString as keyof RoundTimesData] = roundDecimals(
            Math.max(GameTimer.RoundTime[Globals.ROUND], 0.01),
            2
        )
    }

    private static GetNormalRoundEnum(): string {
        let gameTimeData = Globals.GAME_TIMES
        let round = Globals.ROUND
        switch (round) {
            case 1:
                return 'RoundOneNormal'

            case 2:
                return 'RoundTwoNormal'

            case 3:
                return 'RoundThreeNormal'

            case 4:
                return 'RoundFourNormal'

            case 5:
                return 'RoundFiveNormal'

            default:
                Logger.Critical('round: number: for: GetNormalRoundEnum: Invalid')
                return ''
        }
    }

    private static GetHardRoundEnum(): string {
        let round = Globals.ROUND
        let gameTimeData = Globals.GAME_TIMES
        switch (round) {
            case 1:
                return 'RoundOneHard'

            case 2:
                return 'RoundTwoHard'

            case 3:
                return 'RoundThreeHard'

            case 4:
                return 'RoundFourHard'

            case 5:
                return 'RoundFiveHard'

            default:
                Logger.Critical('round: number: for: GetHardRoundEnum: Invalid')
                return ''
        }
    }

    private static GetImpossibleRoundEnum(): string {
        let round = Globals.ROUND
        let gameTimeData = Globals.GAME_TIMES
        switch (round) {
            case 1:
                return 'RoundOneImpossible'

            case 2:
                return 'RoundTwoImpossible'

            case 3:
                return 'RoundThreeImpossible'

            case 4:
                return 'RoundFourImpossible'

            case 5:
                return 'RoundFiveImpossible'

            default:
                Logger.Critical('round: number: for: GetImpossibleRoundEnum: Invalid')
                return ''
        }
    }

    private static GetNightmareRoundEnum(): string {
        let round = Globals.ROUND
        let gameTimeData = Globals.GAME_TIMES
        switch (round) {
            case 1:
                return 'RoundOneNightmare'

            case 2:
                return 'RoundTwoNightmare'

            case 3:
                return 'RoundThreeNightmare'

            case 4:
                return 'RoundFourNightmare'

            case 5:
                return 'RoundFiveNightmare'

            default:
                Logger.Critical('round: number: for: GetNightmareRoundEnum: Invalid')
                return ''
        }
    }

    public static GetSoloRoundEnum(): string {
        let round = Globals.ROUND
        let gameTimeData = Globals.GAME_TIMES
        switch (round) {
            case 1:
                return 'RoundOneSolo'

            case 2:
                return 'RoundTwoSolo'

            case 3:
                return 'RoundThreeSolo'

            case 4:
                return 'RoundFourSolo'

            case 5:
                return 'RoundFiveSolo'

            default:
                print('round: number: for: GetSoloRoundEnum: Invalid')
                return ''
        }
    }
}
