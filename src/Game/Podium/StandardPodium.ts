import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Queue } from 'src/Utility/Queue'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Point, Unit } from 'w3ts'
import { PodiumUtil } from './PodiumUtil'

/// <summary>
/// Players are going to be rewarded
/// </summary>
export class StandardPodium {
    private static PodiumQueue = new Queue<[MapPlayer, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private static HighestScore: string = 'score: highest'
    private static MostSaves: string = 'saves: most'
    private static HighestRatio: string = 'ratio: highest'
    private static HighestStreak: string = 'streak: highest'

    public static BeginPodiumActions = () => {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, StandardPodium.ProcessPodiumTypeActions)
    }

    private static EnqueueTopScorePlayers = () => {
        const topScores = PodiumUtil.SortPlayersByScore()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topScores.length - 1; i >= 0; i--) {
            const player = topScores[i]
            const position = podiumPositions[i]
            StandardPodium.PodiumQueue.enqueue([player, position])
        }
        StandardPodium.PodiumType = StandardPodium.HighestScore
    }

    private static EnqueueTopSavesPlayers = () => {
        const topSaves = PodiumUtil.SortPlayersBySaves()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topSaves.length - 1; i >= 0; i--) {
            const player = topSaves[i]
            const position = podiumPositions[i]
            StandardPodium.PodiumQueue.enqueue([player, position])
        }
        StandardPodium.PodiumType = StandardPodium.MostSaves
    }

    private static EnqueueTopRatioPlayers = () => {
        const topRatios = PodiumUtil.SortPlayersByHighestRatio()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topRatios.length - 1; i >= 0; i--) {
            const player = topRatios[i]
            const position = podiumPositions[i]
            StandardPodium.PodiumQueue.enqueue([player, position])
        }
        StandardPodium.PodiumType = StandardPodium.HighestRatio
    }

    private static EnqueueTopStreakPlayers = () => {
        const topStreaks = PodiumUtil.SortPlayersByHighestSaveStreak()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topStreaks.length - 1; i >= 0; i--) {
            const player = topStreaks[i]
            const position = podiumPositions[i]
            StandardPodium.PodiumQueue.enqueue([player, position])
        }
        StandardPodium.PodiumType = StandardPodium.HighestStreak
    }

    private static ProcessNextPodiumAction = () => {
        if (StandardPodium.PodiumQueue.length === 0) {
            StandardPodium.ProcessPodiumTypeActions()
            return
        }
        const [player, position] = StandardPodium.PodiumQueue.dequeue()!
        const kitty = Globals.ALL_KITTIES.get(player)!.Unit
        kitty.setPosition(position.x, position.y)
        kitty.setFacingEx(270)
        kitty.paused = true
        StandardPodium.MovedUnits.push(kitty)
        print(
            `${ColorUtils.PlayerNameColored(player)}${StandardPodium.Color} earned ${PodiumUtil.PlacementString(StandardPodium.PodiumQueue.length + 1)} for: place ${StandardPodium.PodiumType} with ${StandardPodium.GetStatBasedOnType(player)}|r`
        )
        Utility.SimpleTimer(5.0, StandardPodium.ProcessNextPodiumAction)
    }

    /// <summary>
    /// Topscore => Saves => Ratio => Streak .. End
    /// </summary>
    private static ProcessPodiumTypeActions = () => {
        StandardPodium.PodiumQueue.length = 0
        PodiumUtil.ClearPodiumUnits(StandardPodium.MovedUnits)
        switch (StandardPodium.PodiumType) {
            case '':
                StandardPodium.EnqueueTopScorePlayers()
                break

            case StandardPodium.HighestScore:
                StandardPodium.EnqueueTopSavesPlayers()
                break

            case StandardPodium.MostSaves:
                StandardPodium.EnqueueTopRatioPlayers()
                break

            case StandardPodium.HighestRatio:
                StandardPodium.EnqueueTopStreakPlayers()
                break

            case StandardPodium.HighestStreak:
                PodiumUtil.EndingGameThankyou()
                return

            default:
                break
        }
        StandardPodium.ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType = (player: MapPlayer) => {
        const stats = Globals.ALL_KITTIES.get(player)!.CurrentStats
        switch (StandardPodium.PodiumType) {
            case StandardPodium.HighestScore:
                return (stats.TotalSaves - stats.TotalDeaths).toString()

            case StandardPodium.MostSaves:
                return stats.TotalSaves.toString()

            case StandardPodium.HighestRatio:
                return stats.TotalDeaths === 0
                    ? stats.TotalSaves.toFixed(2)
                    : (stats.TotalSaves / stats.TotalDeaths).toFixed(2)

            case StandardPodium.HighestStreak:
                return stats.MaxSaveStreak.toString()

            default:
                return 'n/a'
        }
    }
}
