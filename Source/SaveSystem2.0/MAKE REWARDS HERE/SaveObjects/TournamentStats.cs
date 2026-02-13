public class TournamentStats
{
    public string DateTime { get; set; } = "";
    public string Gamemode { get; set; } = "";
    public string GameType { get; set; } = "";
    public string Team { get; set; } = ""; // Should this be team colors or by team #.. Likely team colors, be easier to tie together on the webend I believe.
    public TournamentRoundData Round_1 { get; set; }
    public TournamentRoundData Round_2 { get; set; }
    public TournamentRoundData Round_3 { get; set; }
    public TournamentRoundData Round_4 { get; set; }
    public TournamentRoundData Round_5 { get; set; }
    public TournamentStats()
    {
        Round_1 = new TournamentRoundData();
        Round_2 = new TournamentRoundData();
        Round_3 = new TournamentRoundData();
        Round_4 = new TournamentRoundData();
        Round_5 = new TournamentRoundData();
    }
}
