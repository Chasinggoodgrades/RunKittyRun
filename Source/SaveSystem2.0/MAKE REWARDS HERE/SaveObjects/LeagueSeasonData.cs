public class LeagueSeasonData
{
    public string SeasonID { get; set; } = "";
    public GameStatsData Stats { get; set; }
    public RoundTimesData RoundTimes { get; set; }
    public GameTimesData GameTimes { get; set; }
    public GameCurrency Currency { get; set; }

    public LeagueSeasonData()
    {
        Stats = new GameStatsData();
        RoundTimes = new RoundTimesData();
        GameTimes = new GameTimesData();
        Currency = new GameCurrency();
    }

    public void ResetLeagueSeasonData()
    {
        SeasonID = "";
        Stats.ResetStatsData();
        RoundTimes.Reset();
        GameTimes.ResetGameTimesData();
        Currency.ResetGameCurrency();
    }
}
