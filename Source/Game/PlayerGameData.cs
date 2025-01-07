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
    public int MaxSaveStreak { get; set; }
    public List<int> ObtainedNitros { get; set; } = new List<int>();
    public int WolfFreezeCount { get; set; }

    public PlayerGameData()
    {
        TotalSaves = 0;
        TotalDeaths = 0;
        RoundSaves = 0;
        RoundDeaths = 0;
    }
}