public class KittyData
{
    public string PlayerName { get; set; } = "";
    public string Date { get; set; } = "";
    public GameStatsData GameStats { get; set; }
    public GameSelectedData SelectedData { get; set; }
    public RoundTimesData RoundTimes { get; set; }
    public GameAwardsDataSorted GameAwardsSorted { get; set; }
    public GameTimesData BestGameTimes { get; set; }
    public KibbleCurrency KibbleCurrency { get; set; }

    public KittyData()
    {
        GameStats = new GameStatsData();
        SelectedData = new GameSelectedData();
        RoundTimes = new RoundTimesData();
        GameAwardsSorted = new GameAwardsDataSorted();
        BestGameTimes = new GameTimesData();
        KibbleCurrency = new KibbleCurrency();
    }

    public void SetRewardsFromUnavailableToAvailable()
    {
        var data = this.GameAwardsSorted;
        if (data.Skins.HuntressKitty < 0) data.Skins.HuntressKitty = 0;
        if (data.Windwalks.WWDivine < 0) data.Windwalks.WWDivine = 0;
        if (data.Windwalks.WWViolet < 0) data.Windwalks.WWViolet = 0;
    }
}
