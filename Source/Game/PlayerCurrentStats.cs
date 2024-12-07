using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class PlayerCurrentStats 
{
    public int TotalSaves { get; set; }
    public int TotalDeaths { get; set; }
    public int RoundSaves { get; set; }
    public int RoundDeaths { get; set; }
    public int SaveStreak { get; set; }
    public int MaxSaveStreak { get; set; }
    public List<int> ObtainedNitros { get; set; } = new List<int>();

    public PlayerCurrentStats()
    {
        TotalSaves = 0;
        TotalDeaths = 0;
        RoundSaves = 0;
        RoundDeaths = 0;
    }
}