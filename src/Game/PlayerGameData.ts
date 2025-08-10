

/// <summary>
/// Keeps track of current game stats, saves, deaths, streak, nitros, and other misc data.
/// </summary>
class PlayerGameData
{
    public TotalSaves: number 
    public TotalDeaths: number 
    public RoundSaves: number 
    public RoundDeaths: number 
    public SaveStreak: number 
    public DeathlessProgress: number 
    public MaxSaveStreak: number 
    public NitroCount: number 
    public List<int> ObtainedNitros = new List<int>();
    public List<string> ObtainedAwards = new List<string>();
    public WolfFreezeCount: number 
    public RoundFinished: boolean = false;
    public NitroObtained: boolean = false;
    public CollectedKibble: number 
    public CrystalOfFireAttempts: number = 0;
    public ChronoSphereCD: boolean = false;
    public CollisonRadius: number = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS;
    public CollectedJackpots: number = 0;
    public CollectedSuperJackpots: number = 0;

    public PlayerGameData()
    {
        TotalSaves = 0;
        TotalDeaths = 0;
        RoundSaves = 0;
        RoundDeaths = 0;
    }

    public ResetRoundData()
    {
        RoundSaves = 0;
        RoundDeaths = 0;
        DeathlessProgress = 0;
        SaveStreak = 0;
        RoundFinished = false;
        NitroObtained = false;
    }
}
