/// <summary>
/// Keeps track of current game stats, saves, deaths, streak, nitros, and other misc data.

import { CollisionDetection } from "./CollisionDetection"

/// </summary>
export class PlayerGameData {
    public TotalSaves: number
    public TotalDeaths: number
    public RoundSaves: number
    public RoundDeaths: number
    public SaveStreak: number
    public DeathlessProgress: number
    public MaxSaveStreak: number
    public NitroCount: number
    public ObtainedNitros: number[] = []
    public ObtainedAwards: string[] = []
    public WolfFreezeCount: number
    public RoundFinished: boolean = false
    public NitroObtained: boolean = false
    public CollectedKibble: number
    public CrystalOfFireAttempts: number = 0
    public ChronoSphereCD: boolean = false
    public CollisonRadius: number = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS
    public CollectedJackpots: number = 0
    public CollectedSuperJackpots: number = 0

    public constructor() {
        this.TotalSaves = 0
        this.TotalDeaths = 0
        this.RoundSaves = 0
        this.RoundDeaths = 0
    }

    public ResetRoundData() {
        this.RoundSaves = 0
        this.RoundDeaths = 0
        this.DeathlessProgress = 0
        this.SaveStreak = 0
        this.RoundFinished = false
        this.NitroObtained = false
    }
}
