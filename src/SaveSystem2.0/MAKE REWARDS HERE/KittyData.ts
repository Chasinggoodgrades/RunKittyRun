import { GameAwardsDataSorted } from './SaveObjects/GameAwardsDataSorted'
import { KibbleCurrency } from './SaveObjects/GameCurrency'
import { GameFriendsData } from './SaveObjects/GameFriendsData'
import { GameSelectedData } from './SaveObjects/GameSelectedData'
import { GameStatsData } from './SaveObjects/GameStatsData'
import { GameTimesData } from './SaveObjects/GameTimesData'
import { PersonalBests } from './SaveObjects/PersonalBests'
import { PlayerColorData } from './SaveObjects/PlayerColorData'
import { RoundTimesData } from './SaveObjects/RoundTimesData'

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

    public constructor() {
        this.GameStats = new GameStatsData()
        this.SelectedData = new GameSelectedData()
        this.RoundTimes = new RoundTimesData()
        this.GameAwardsSorted = new GameAwardsDataSorted()
        this.BestGameTimes = new GameTimesData()
        this.KibbleCurrency = new KibbleCurrency()
        this.PersonalBests = new PersonalBests()
        this.PlayerColorData = new PlayerColorData()
        this.FriendsData = new GameFriendsData()
    }

    /// <summary>
    /// Updates rewards that were previously unavailable (-1) to be available (0).
    /// When transferred to the website, these rewards were set to -1 to not display.
    /// </summary>
    public SetRewardsFromUnavailableToAvailable() {
        const data = this.GameAwardsSorted
        if (data.Skins.HuntressKitty < 0) data.Skins.HuntressKitty = 0
        if (data.Windwalks.WWDivine < 0) data.Windwalks.WWDivine = 0
        if (data.Windwalks.WWViolet < 0) data.Windwalks.WWViolet = 0
        if (data.Nitros.PatrioticLight < 0) data.Nitros.PatrioticLight = 0
    }
}
