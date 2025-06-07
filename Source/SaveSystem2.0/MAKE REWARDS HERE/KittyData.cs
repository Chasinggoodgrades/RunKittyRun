/// <summary>
/// Represents data related to a player's game progress, achievements, and personal bests.
/// This class is used to store and manage data such as player information, game statistics,
/// selected configurations, round timings, awards, best game times, and personal achievements.
/// </summary>
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
    public PersonalBests PersonalBests { get; set; }
    public PlayerColorData PlayerColorData { get; set; }
    public GameFriendsData FriendsData { get; set; } = new GameFriendsData();

    public KittyData()
    {
        GameStats = new GameStatsData();
        SelectedData = new GameSelectedData();
        RoundTimes = new RoundTimesData();
        GameAwardsSorted = new GameAwardsDataSorted();
        BestGameTimes = new GameTimesData();
        KibbleCurrency = new KibbleCurrency();
        PersonalBests = new PersonalBests();
        PlayerColorData = new PlayerColorData();
        FriendsData = new GameFriendsData();
    }

    /// <summary>
    /// Updates rewards that were previously unavailable (-1) to be available (0).
    /// When transferred to the website, these rewards were set to -1 to not display.
    /// </summary>
    public void SetRewardsFromUnavailableToAvailable()
    {
        var data = this.GameAwardsSorted;
        if (data.Skins.HuntressKitty < 0) data.Skins.HuntressKitty = 0;
        if (data.Windwalks.WWDivine < 0) data.Windwalks.WWDivine = 0;
        if (data.Windwalks.WWViolet < 0) data.Windwalks.WWViolet = 0;
        if (data.Nitros.PatrioticLight < 0) data.Nitros.PatrioticLight = 0;
    }
}
