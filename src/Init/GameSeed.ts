import { Globals } from 'src/Global/Globals'
import { DateTimeManager } from 'src/Seasonal/DateTimeManager'

export class GameSeed {
    public static Initialize() {
        if (GameSeed.SpecialSeed()) return
        Globals.GAME_SEED = GetRandomInt(1, 900000)
    }

    private static SpecialSeed(): boolean {
        if (GameSeed.TeamTournament2025Seed()) return true
        return false
    }

    private static TeamTournament2025Seed(): boolean {
        // Tournament Date: August 9, 2025
        const expectedMonth = 8 // August
        const expectedDay = 9 // 9th Day

        if (DateTimeManager.CurrentDay !== expectedDay || DateTimeManager.CurrentMonth !== expectedMonth) {
            return false
        }
        const OmnisSeed = 458266 // Omnis' Seed for the Team Tournament 2025
        Globals.GAME_SEED = OmnisSeed

        return true
    }

    // Thanks AI!

    public static SeededRandom(seed: number): () => number {
        return () => {
            seed = (seed * 9301 + 49297) % 233280
            return seed / 233280
        }
    }

    public static Shuffle<T>(array: T[], seed: number): T[] {
        const rng = GameSeed.SeededRandom(seed)
        const result = [...array]
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
        }
        return result
    }
}
