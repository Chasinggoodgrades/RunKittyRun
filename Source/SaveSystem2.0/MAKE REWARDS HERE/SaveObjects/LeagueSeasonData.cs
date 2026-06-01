public class LeagueSeasonData
{
    public string SeasonID { get; set; } = "";
    public GameStatsData Stats { get; set; }
    public RoundTimesData RoundTimes { get; set; }
    public GameTimesData GameTimes { get; set; }
    public int KibbleCollected { get; set; }

    public LeagueSeasonData()
    {
        Stats = new GameStatsData();
        RoundTimes = new RoundTimesData();
        GameTimes = new GameTimesData();
    }
}
