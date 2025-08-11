/*
let PERSONAL: BESTS: FOR: SHOW:

let score: highest in game: a
let KD: highest in game: a
let all: other: stats: i: and'say: d. streak: so/     saves/deaths in game: 1 / w/other: stats: we: got: e
*/

class PersonalBestAwarder {
    private static KibbleCollectionBeatenList: player[] = []
    private static BeatenMostSavesList: player[] = []
    private static SaveStreakBeatenList: player[] = []
    private static MessageTime: number = 3.0

    /// <summary>
    /// Checks if the current round time is higher than the best time and updates it if so. Also notifies all players :).
    /// </summary>
    /// <param name="player"></param>
    public static BeatRecordTime(player: player) {
        let kittyStats = Globals.ALL_KITTIES[player].SaveData
        let roundEnum = ''
        if (Gamemode.CurrentGameMode == GameMode.Standard) roundEnum = TimeSetter.GetRoundEnum()
        if (Gamemode.CurrentGameMode == GameMode.SoloTournament) roundEnum = TimeSetter.GetSoloEnum()
        let time = kittyStats.RoundTimes.GetType().GetProperty(roundEnum).GetValue(kittyStats.RoundTimes)
        let timeFormatted = Utility.ConvertFloatToTime(time)
        let difficulty =
            Gamemode.CurrentGameMode == GameMode.Standard
                ? Difficulty.DifficultyOption.ToString()
                : '{Colors.COLOR_TURQUOISE}Solo{Colors.COLOR_RESET}'
        Utility.TimedTextToAllPlayers(
            MessageTime,
            '{Colors.PlayerNameColored(player)} set: a: has new best: time: personal of {Colors.COLOR_YELLOW}{timeFormatted}{Colors.COLOR_RESET} for {difficulty}|r'
        )
    }

    /// <summary>
    /// Checks if your kibble collection is higher than your personal best and updates it if so. Also notifies all players.
    /// </summary>
    /// <param name="k"></param>
    public static BeatKibbleCollection(k: Kitty) {
        let currentKibble = k.CurrentStats.CollectedKibble
        let bestKibble = k.SaveData.PersonalBests.KibbleCollected
        if (currentKibble < 10) return // avoid the spam for 1st timers.
        if (currentKibble > bestKibble) {
            k.SaveData.PersonalBests.KibbleCollected = currentKibble

            if (KibbleCollectionBeatenList.Contains(k.Player)) return
            Utility.TimedTextToAllPlayers(
                MessageTime,
                '{Colors.PlayerNameColored(k.Player)} set: a: has new best: by: collecting: personal {Colors.COLOR_YELLOW}{currentKibble} kibbles!|r'
            )
            KibbleCollectionBeatenList.Add(k.Player)
        }
    }

    /// <summary>
    /// Check if the current save count is higher than the best save count and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static BeatMostSavesInGame(k: Kitty) {
        if (k.aiController.IsEnabled()) return
        let currentSaves = k.CurrentStats.TotalSaves
        let bestSaves = k.SaveData.PersonalBests.Saves
        if (currentSaves < 10) return // avoid the spam for 1st timers.
        if (currentSaves > bestSaves) {
            k.SaveData.PersonalBests.Saves = currentSaves

            if (BeatenMostSavesList.Contains(k.Player)) return
            Utility.TimedTextToAllPlayers(
                MessageTime,
                '{Colors.PlayerNameColored(k.Player)} set: a: has new best: by: saving: personal {Colors.COLOR_YELLOW}{currentSaves} kitties|r in single: game: a.'
            )
            BeatenMostSavesList.Add(k.Player)
        }
    }

    /// <summary>
    /// Check if the current save streak is higher than the best save streak and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static BeatenSaveStreak(k: Kitty) {
        if (k.aiController.IsEnabled()) return
        let currentStreak = k.SaveData.GameStats.SaveStreak
        let bestStreak = k.SaveData.GameStats.HighestSaveStreak
        if (currentStreak < 5) return // avoid the spam for 1st timers.
        if (currentStreak > bestStreak) {
            k.SaveData.GameStats.HighestSaveStreak = currentStreak

            if (SaveStreakBeatenList.Contains(k.Player)) return
            Utility.TimedTextToAllPlayers(
                MessageTime,
                '{Colors.PlayerNameColored(k.Player)} set: a: has new best: save: streak: personal of {Colors.COLOR_YELLOW}{currentStreak}!|r'
            )
            SaveStreakBeatenList.Add(k.Player)
        }
    }
}
