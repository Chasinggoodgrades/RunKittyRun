/// <summary>
/// Represents data related to a player's game progress, achievements, and personal bests.
/// This class is used to store and manage data such as player information, game statistics,
/// selected configurations, round timings, awards, best game times, and personal achievements.
/// </summary>
export class KittyData {
    public PlayerName: string = ''
    public Date: string = ''
    public GameStats: GameStatsData
    public SelectedData: GameSelectedData
    public RoundTimes: RoundTimesData
    public GameAwardsSorted: GameAwardsDataSorted
    public BestGameTimes: GameTimesData
    public KibbleCurrency: KibbleCurrency
    public PersonalBests: PersonalBests
    public PlayerColorData: PlayerColorData
    public FriendsData: GameFriendsData = new GameFriendsData()

    public KittyData() {
        GameStats = new GameStatsData()
        SelectedData = new GameSelectedData()
        RoundTimes = new RoundTimesData()
        GameAwardsSorted = new GameAwardsDataSorted()
        BestGameTimes = new GameTimesData()
        KibbleCurrency = new KibbleCurrency()
        PersonalBests = new PersonalBests()
        PlayerColorData = new PlayerColorData()
        FriendsData = new GameFriendsData()
    }

    /// <summary>
    /// Updates rewards that were previously unavailable (-1) to be available (0).
    /// When transferred to the website, these rewards were set to -1 to not display.
    /// </summary>
    public SetRewardsFromUnavailableToAvailable() {
        let data = this.GameAwardsSorted
        if (data.Skins.HuntressKitty < 0) data.Skins.HuntressKitty = 0
        if (data.Windwalks.WWDivine < 0) data.Windwalks.WWDivine = 0
        if (data.Windwalks.WWViolet < 0) data.Windwalks.WWViolet = 0
        if (data.Nitros.PatrioticLight < 0) data.Nitros.PatrioticLight = 0
    }
}
