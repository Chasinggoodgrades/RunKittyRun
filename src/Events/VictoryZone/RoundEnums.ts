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
        const currentDiff = Difficulty.DifficultyValue
        let roundEnum: string
        switch (currentDiff) {
            case DifficultyLevel.Normal:
                roundEnum = RoundEnums.GetNormalRoundEnum()
                break

            case DifficultyLevel.Hard:
                roundEnum = RoundEnums.GetHardRoundEnum()
                break

            case DifficultyLevel.Impossible:
                roundEnum = RoundEnums.GetImpossibleRoundEnum()
                break
            case DifficultyLevel.Nightmare:
                roundEnum = RoundEnums.GetNightmareRoundEnum()
                break
            default:
                Logger.Critical('Invalid difficulty level for GetRoundEnum')
                return ''
        }
        return roundEnum
    }

    public static GetSoloEnum(): string {
        const roundEnum = RoundEnums.GetSoloRoundEnum()
        return roundEnum
    }

    public static SetSavedTime(player: MapPlayer, roundString: string) {
        const kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData
        kittyStats.RoundTimes[roundString as keyof RoundTimesData] = roundDecimals(
            Math.max(GameTimer.RoundTime[Globals.ROUND], 0.01),
            2
        )
    }

    private static GetNormalRoundEnum(): string {
        const gameTimeData = Globals.GAME_TIMES
        const round = Globals.ROUND
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
                Logger.Critical('Invalid round number for GetNormalRoundEnum')
                return ''
        }
    }

    private static GetHardRoundEnum(): string {
        const round = Globals.ROUND
        const gameTimeData = Globals.GAME_TIMES
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
                Logger.Critical('Invalid round number for GetHardRoundEnum')
                return ''
        }
    }

    private static GetImpossibleRoundEnum(): string {
        const round = Globals.ROUND
        const gameTimeData = Globals.GAME_TIMES
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
                Logger.Critical('Invalid round number for GetImpossibleRoundEnum')
                return ''
        }
    }

    private static GetNightmareRoundEnum(): string {
        const round = Globals.ROUND
        const gameTimeData = Globals.GAME_TIMES
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
                Logger.Critical('Invalid round number for GetNightmareRoundEnum')
                return ''
        }
    }

    public static GetSoloRoundEnum(): string {
        const round = Globals.ROUND
        const gameTimeData = Globals.GAME_TIMES
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
                print('Invalid round number for GetSoloRoundEnum')
                return ''
        }
    }
}
