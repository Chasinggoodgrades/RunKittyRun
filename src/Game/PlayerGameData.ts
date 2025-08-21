import { DEFAULT_WOLF_COLLISION_RADIUS } from 'src/Global/Globals'

/// <summary>
/// Keeps track of current game stats, saves, deaths, streak, nitros, and other misc data.
/// </summary>
export class PlayerGameData {
    public TotalSaves = 0
    public TotalDeaths = 0
    public RoundSaves = 0
    public RoundDeaths = 0
    public SaveStreak = 0
    public DeathlessProgress = 0
    public MaxSaveStreak = 0
    public NitroCount = 0
    public ObtainedNitros: number[] = []
    public ObtainedAwards: string[] = []
    public WolfFreezeCount = 0
    public RoundFinished = false
    public NitroObtained = false
    public CollectedKibble = 0
    public CrystalOfFireAttempts = 0
    public ChronoSphereCD = false
    public CollisonRadius = DEFAULT_WOLF_COLLISION_RADIUS
    public CollectedJackpots = 0
    public CollectedSuperJackpots = 0

    public constructor() {
        this.TotalSaves = 0
        this.TotalDeaths = 0
        this.RoundSaves = 0
        this.RoundDeaths = 0
    }

    public ResetRoundData = () => {
        this.RoundSaves = 0
        this.RoundDeaths = 0
        this.DeathlessProgress = 0
        this.SaveStreak = 0
        this.RoundFinished = false
        this.NitroObtained = false
    }
}
