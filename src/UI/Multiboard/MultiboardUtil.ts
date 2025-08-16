import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { MapPlayer, Multiboard } from 'w3ts'
import { SoloMultiboard } from './SoloMultiboard'
import { StandardMultiboard } from './StandardMultiboard'

export class MultiboardUtil {
    /// <summary>
    /// Simply updates or refreshes the multiboards.
    /// </summary>
    public static RefreshMultiboards() {
        MultiboardUtil.RefreshStandardMbs()
        MultiboardUtil.RefreshSoloMbs()
    }

    private static RefreshStandardMbs() {
        if (CurrentGameMode.active !== GameMode.Standard) return
        if (!Difficulty.IsDifficultyChosen) return // Init first.
        StandardMultiboard.UpdateStandardCurrentStatsMB()
        StandardMultiboard.UpdateOverallStatsMB()
        StandardMultiboard.UpdateBestTimesMB()
    }

    private static RefreshSoloMbs() {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return // Solo Tournament
        SoloMultiboard.UpdateOverallStatsMB()
        SoloMultiboard.UpdateBestTimesMB()
    }

    /// <summary>
    /// Minimize or maximize all multiboards for the <param name="player"/> // TODO; Cleanup:     /// Minimize or maximize all multiboards for the <paramref name="player"/>
    /// </summary>
    /// <param name="player">the player object.</param>
    /// <param name="minMax">true to minimize, false to maximize</param>
    public static MinMultiboards(player: MapPlayer, minimize: boolean) {
        if (!player.isLocal()) return
        MultiboardUtil.MinStandardMultiboards(minimize)
    }

    private static MinStandardMultiboards(minimize: boolean) {
        if (CurrentGameMode.active !== GameMode.Standard) return
        StandardMultiboard.CurrentStats.minimize(minimize) // Possible Desync
        StandardMultiboard.BestTimes.minimize(minimize) // Possible Desync
        StandardMultiboard.OverallStats.minimize(minimize) // Possible Desync
    }

    /// <summary>
    /// Fills the players going down the rows on most left side of multiboard. Passing thru rowIndex for which starting row.
    /// </summary>
    /// <param name="mb"></param>
    /// <param name="rowIndex"></param>
    public static FillPlayers(mb: Multiboard, rowIndex: number = 2) {
        for (let player of Globals.ALL_PLAYERS) {
            let name = player.name.length > 8 ? player.name.substring(0, 8) : MapPlayer.name
            mb.GetItem(rowIndex, 0).setText(`${ColorUtils.GetStringColorOfPlayer(player.id + 1)}${name}|r`)
            mb.GetItem(rowIndex, 0).setWidth(0.07)
            rowIndex++
        }
    }
}
