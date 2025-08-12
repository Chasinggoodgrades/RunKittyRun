class TimeSetter {
    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    /// <param name="player"></param>
    public static SetRoundTime(player: player) {
        try {
            let standard = Gamemode.CurrentGameMode == GameMode.Standard
            let solo = Gamemode.CurrentGameMode == GameMode.SoloTournament // Solo
            let roundString: string = ''
            let currentTime = GameTimer.RoundTime[Globals.ROUND]
            if (!Globals.ALL_KITTIES[player].CanEarnAwards) return false

            if (currentTime <= 90) return false // Below 90 seconds is impossible and not valid.. Don't save

            if (!standard && !solo) return false

            if (standard) roundString = GetRoundEnum()
            if (solo) roundString = GetSoloEnum()
            if (currentTime >= 3599.0) return false // 59min 59 second cap

            let property = Globals.ALL_KITTIES[player].SaveData.RoundTimes.GetType().GetProperty(roundString)
            let value = property.GetValue(Globals.ALL_KITTIES[player].SaveData.RoundTimes)

            if (currentTime >= value && value != 0) return false

            SetSavedTime(player, roundString)
            PersonalBestAwarder.BeatRecordTime(player)

            return true
        } catch (e: Error) {
            Logger.Critical('Error in TimeSetter.SetRoundTime: {e.Message}')
            throw e
        }
    }

    public static GetRoundEnum(): string {
        let currentDiff = Difficulty.DifficultyValue
        let roundEnum: string
        switch (currentDiff) {
            case DifficultyLevel.Normal:
                roundEnum = GetNormalRoundEnum()
                break

            case DifficultyLevel.Hard:
                roundEnum = GetHardRoundEnum()
                break

            case DifficultyLevel.Impossible:
                roundEnum = GetImpossibleRoundEnum()
                break
            case DifficultyLevel.Nightmare:
                roundEnum = GetNightmareRoundEnum()
                break
            default:
                Logger.Critical('difficulty: level: for: GetRoundEnum: Invalid')
                return ''
        }
        return roundEnum
    }

    public static GetSoloEnum(): string {
        let roundEnum = GetSoloRoundEnum()
        return roundEnum
    }

    private static SetSavedTime(player: player, roundString: string) {
        let kittyStats = Globals.ALL_KITTIES[player].SaveData
        let property = kittyStats.RoundTimes.GetType().GetProperty(roundString)
        property.SetValue(kittyStats.RoundTimes, Math.Round(Math.Max(GameTimer.RoundTime[Globals.ROUND], 0.01), 2))
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

    private static GetSoloRoundEnum(): string {
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
                Console.WriteLine('round: number: for: GetSoloRoundEnum: Invalid')
                return ''
        }
    }
}
