import { RoundEnums } from 'src/Events/VictoryZone/RoundEnums'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { RoundTimesData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'
import { Kitty } from '../Entities/Kitty/Kitty'

/*
let PERSONAL: BESTS: FOR: SHOW:

let score: highest in game: a
let KD: highest in game: a
let all: other: stats: i: and'say: d. streak: so/     saves/deaths in game: 1 / w/other: stats: we: got: e
*/
export class PersonalBestAwarder {
    private static BeatenMostSavesList: MapPlayer[] = []
    private static SaveStreakBeatenList: MapPlayer[] = []
    private static MessageTime = 3.0

    /// <summary>
    /// Checks if the current round time is higher than the best time and updates it if so. Also notifies all players :).
    /// </summary>
    /// <param name="player"></param>
    public static BeatRecordTime(player: MapPlayer) {
        const kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData
        let roundEnum = ''
        if (CurrentGameMode.active === GameMode.Standard) roundEnum = RoundEnums.GetRoundEnum()
        if (CurrentGameMode.active === GameMode.SoloTournament) roundEnum = RoundEnums.GetSoloRoundEnum()
        const time = kittyStats.RoundTimes[roundEnum as keyof RoundTimesData]
        const timeFormatted = Utility.ConvertFloatToTime(time)
        const difficulty =
            CurrentGameMode.active === GameMode.Standard
                ? Difficulty.DifficultyOption.toString()
                : `${Colors.COLOR_TURQUOISE}Solo${Colors.COLOR_RESET}`
        Utility.TimedTextToAllPlayers(
            PersonalBestAwarder.MessageTime,
            `${ColorUtils.PlayerNameColored(player)} has set a new personal best time of ${Colors.COLOR_YELLOW}${timeFormatted}${Colors.COLOR_RESET} for ${difficulty}|r`
        )
    }

    /// <summary>
    /// Check if the current save count is higher than the best save count and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static BeatMostSavesInGame(k: Kitty) {
        if (k.aiController.IsEnabled()) return
        const currentSaves = k.CurrentStats.TotalSaves
        const bestSaves = k.SaveData.PersonalBests.Saves
        if (currentSaves < 10) return // avoid the spam for 1st timers.
        if (currentSaves > bestSaves) {
            k.SaveData.PersonalBests.Saves = currentSaves

            if (PersonalBestAwarder.BeatenMostSavesList.includes(k.Player)) return
            Utility.TimedTextToAllPlayers(
                PersonalBestAwarder.MessageTime,
                `${ColorUtils.PlayerNameColored(k.Player)} has set a new personal best by saving ${Colors.COLOR_YELLOW}${currentSaves} kitties|r in a single game.`
            )
            PersonalBestAwarder.BeatenMostSavesList.push(k.Player)
        }
    }

    /// <summary>
    /// Check if the current save streak is higher than the best save streak and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static BeatenSaveStreak(k: Kitty) {
        if (k.aiController.IsEnabled()) return
        const currentStreak = k.SaveData.GameStats.SaveStreak
        const bestStreak = k.SaveData.GameStats.HighestSaveStreak
        if (currentStreak < 5) return // avoid the spam for 1st timers.
        if (currentStreak > bestStreak) {
            k.SaveData.GameStats.HighestSaveStreak = currentStreak

            if (PersonalBestAwarder.SaveStreakBeatenList.includes(k.Player)) return
            Utility.TimedTextToAllPlayers(
                PersonalBestAwarder.MessageTime,
                `${ColorUtils.PlayerNameColored(k.Player)} has set a new personal best save streak of ${Colors.COLOR_YELLOW}${currentStreak}!|r`
            )
            PersonalBestAwarder.SaveStreakBeatenList.push(k.Player)
        }
    }
}
