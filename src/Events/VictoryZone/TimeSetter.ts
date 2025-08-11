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
                return nameof(gameTimeData.RoundOneNormal)

            case 2:
                return nameof(gameTimeData.RoundTwoNormal)

            case 3:
                return nameof(gameTimeData.RoundThreeNormal)

            case 4:
                return nameof(gameTimeData.RoundFourNormal)

            case 5:
                return nameof(gameTimeData.RoundFiveNormal)

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
                return nameof(gameTimeData.RoundOneHard)

            case 2:
                return nameof(gameTimeData.RoundTwoHard)

            case 3:
                return nameof(gameTimeData.RoundThreeHard)

            case 4:
                return nameof(gameTimeData.RoundFourHard)

            case 5:
                return nameof(gameTimeData.RoundFiveHard)

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
                return nameof(gameTimeData.RoundOneImpossible)

            case 2:
                return nameof(gameTimeData.RoundTwoImpossible)

            case 3:
                return nameof(gameTimeData.RoundThreeImpossible)

            case 4:
                return nameof(gameTimeData.RoundFourImpossible)

            case 5:
                return nameof(gameTimeData.RoundFiveImpossible)

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
                return nameof(gameTimeData.RoundOneNightmare)

            case 2:
                return nameof(gameTimeData.RoundTwoNightmare)

            case 3:
                return nameof(gameTimeData.RoundThreeNightmare)

            case 4:
                return nameof(gameTimeData.RoundFourNightmare)

            case 5:
                return nameof(gameTimeData.RoundFiveNightmare)

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
                return nameof(gameTimeData.RoundOneSolo)

            case 2:
                return nameof(gameTimeData.RoundTwoSolo)

            case 3:
                return nameof(gameTimeData.RoundThreeSolo)

            case 4:
                return nameof(gameTimeData.RoundFourSolo)

            case 5:
                return nameof(gameTimeData.RoundFiveSolo)

            default:
                Console.WriteLine('round: number: for: GetSoloRoundEnum: Invalid')
                return ''
        }
    }
}
