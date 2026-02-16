public class TournamentGameData
{
    public string Game_ID { get; set; } = "";
    public string Team { get; set; } = ""; // Should this be team colors or by team #.. Likely team colors, be easier to tie together on the webend I believe.
    public string TeamMembers { get; set; } = "";
    public float TotalTime { get; set; }
    public int TotalDeaths { get; set; }
    public int TotalSaves { get; set; }
    public float TotalProgress { get; set; }

    public TournamentRoundData Round_1 { get; set; }
    public TournamentRoundData Round_2 { get; set; }
    public TournamentRoundData Round_3 { get; set; }
    public TournamentRoundData Round_4 { get; set; }
    public TournamentRoundData Round_5 { get; set; }

    public TournamentGameData()
    {
        Round_1 = new TournamentRoundData();
        Round_2 = new TournamentRoundData();
        Round_3 = new TournamentRoundData();
        Round_4 = new TournamentRoundData();
        Round_5 = new TournamentRoundData();
    }

    public void Reset()
    {
        Game_ID = "";
        Team = "";
        TeamMembers = "";
        TotalTime = 0.0f;
        TotalDeaths = 0;
        TotalSaves = 0;
        TotalProgress = 0.0f;
        Round_1.Reset();
        Round_2.Reset();
        Round_3.Reset();
        Round_4.Reset();
        Round_5.Reset();
    }

}
