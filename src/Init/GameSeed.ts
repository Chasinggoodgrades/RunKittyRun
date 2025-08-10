class GameSeed {
    public static Initialize() {
        if (SpecialSeed()) return
        Globals.GAME_SEED = GetRandomInt(1, 900000)
        Globals.RANDOM_GEN = new Random(Globals.GAME_SEED)
    }

    private static SpecialSeed(): boolean {
        if (TeamTournament2025Seed()) return true
        return false
    }

    private static TeamTournament2025Seed(): boolean {
        // Tournament Date: August 9, 2025
        let expectedMonth = 8 // August
        let expectedDay = 9 // 9th Day

        if (DateTimeManager.CurrentDay != expectedDay || DateTimeManager.CurrentMonth != expectedMonth) {
            return false
        }
        let OmnisSeed = 458266 // Omnis' Seed for the Team Tournament 2025
        Globals.GAME_SEED = OmnisSeed
        Globals.RANDOM_GEN = new Random(OmnisSeed)

        return true
    }
}
