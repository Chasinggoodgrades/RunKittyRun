using System.Collections.Generic;

/// <summary>
/// Keeps track of current game stats, saves, deaths, streak, nitros, and other misc data.
/// </summary>
public class PlayerGameData
{
    public int TotalSaves { get; set; }
    public int TotalDeaths { get; set; }
    public int RoundSaves { get; set; }
    public int RoundDeaths { get; set; }
    public int SaveStreak { get; set; }
    public int DeathlessProgress { get; set; }
    public int MaxSaveStreak { get; set; }
    public int NitroCount { get; set; }
    public List<int> ObtainedNitros { get; set; } = new List<int>();
    public List<string> ObtainedAwards { get; set; } = new List<string>();
    public int WolfFreezeCount { get; set; }
    public bool RoundFinished { get; set; } = false;
    public bool NitroObtained { get; set; } = false;
    public int CollectedKibble { get; set; }
    public int CrystalOfFireAttempts { get; set; } = 0;
    public int ProgressZone { get; set; }
    public bool ChronoSphereCD { get; set; } = false;
    public float CollisonRadius { get; set; } = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS;

    public PlayerGameData()
    {
        TotalSaves = 0;
        TotalDeaths = 0;
        RoundSaves = 0;
        RoundDeaths = 0;
    }

    public void ResetRoundData()
    {
        RoundSaves = 0;
        RoundDeaths = 0;
        DeathlessProgress = 0;
        SaveStreak = 0;
        RoundFinished = false;
        NitroObtained = false;
        ProgressZone = 0;
    }
}
