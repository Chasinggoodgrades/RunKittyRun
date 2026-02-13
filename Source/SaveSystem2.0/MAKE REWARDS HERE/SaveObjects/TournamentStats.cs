public class TournamentStats
{
    public string Date { get; set; } = "";
    public string Gamemode { get; set; } = "";
    public string GameType { get; set; } = "";
    public RoundTimesHelper RoundTimes { get; set; }
    public LaneTimesHelper LaneTimes { get; set; }
    public TournamentStats()
    {
        RoundTimes = new RoundTimesHelper();
        LaneTimes = new LaneTimesHelper();
    }
}
