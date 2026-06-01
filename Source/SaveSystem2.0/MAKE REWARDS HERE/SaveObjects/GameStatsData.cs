public class GameStatsData
{
    public int Saves { get; set; }
    public int SaveStreak { get; set; }
    public int HighestSaveStreak { get; set; }
    public int NitrosObtained { get; set; }
    public int Deaths { get; set; }
    public int WinStreak { get; set; }
    public int HighestWinStreak { get; set; }
    public int NormalWins { get; set; }
    public int HardWins { get; set; }
    public int ImpossibleWins { get; set; }
    public int NormalGames { get; set; }
    public int HardGames { get; set; }
    public int ImpossibleGames { get; set; }
    public int NightmareGames { get; set; }
    public int NightmareWins { get; set; }
    public int ProgressiveGames { get; set; }
    public int ProgressiveWins { get; set; }
    public int TotalGames { get; set; }

    public void ResetStatsData()
    {
        Saves = 0;
        SaveStreak = 0;
        HighestSaveStreak = 0;
        NitrosObtained = 0;
        Deaths = 0;
        WinStreak = 0;
        HighestWinStreak = 0;
        NormalWins = 0;
        HardWins = 0;
        ImpossibleWins = 0;
        NormalGames = 0;
        HardGames = 0;
        ImpossibleGames = 0;
        NightmareGames = 0;
        NightmareWins = 0;
        ProgressiveGames = 0;
        ProgressiveWins = 0;
        TotalGames = 0;
    }
}
