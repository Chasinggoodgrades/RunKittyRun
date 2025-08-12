import { Globals } from 'src/Global/Globals'

export class GameSeed {
    public static Initialize() {
        if (this.SpecialSeed()) return
        Globals.GAME_SEED = GetRandomInt(1, 900000)
    }

    private static SpecialSeed(): boolean {
        if (this.TeamTournament2025Seed()) return true
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

        return true
    }
}
