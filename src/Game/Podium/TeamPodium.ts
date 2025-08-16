import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Queue } from 'src/Utility/Queue'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Point, Unit } from 'w3ts'
import { PodiumUtil } from './PodiumUtil'

export class TeamPodium {
    private static PodiumQueue = new Queue<[MapPlayer, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private static MVP: string = 'MVP'
    private static MostSaves: string = 'saves: most'

    public static BeginPodiumActions() {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, TeamPodium.ProcessPodiumTypeActions)
    }

    private static EnqueueMVPPlayer() {
        let topRatios = PodiumUtil.SortPlayersByHighestRatio()
        let podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topRatios.length - 1; i >= 0; i--) {
            let player = topRatios[i]
            let position = podiumPositions[i]
            TeamPodium.PodiumQueue.enqueue([player, position])
        }
        TeamPodium.PodiumType = TeamPodium.MVP
    }

    private static EnqueueTopSavesPlayer() {
        let topSaves = PodiumUtil.SortPlayersBySaves()
        let podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topSaves.length - 1; i >= 0; i--) {
            let player = topSaves[i]
            let position = podiumPositions[i]
            TeamPodium.PodiumQueue.enqueue([player, position])
        }
        TeamPodium.PodiumType = TeamPodium.MostSaves
    }

    private static ProcessNextPodiumAction() {
        if (TeamPodium.PodiumQueue.length === 0) {
            TeamPodium.ProcessPodiumTypeActions()
            return
        }
        let [player, position] = TeamPodium.PodiumQueue.dequeue()!
        let kitty = Globals.ALL_KITTIES.get(player)!.Unit
        kitty.setPosition(position.x, position.y)
        kitty.setFacingEx(270)
        kitty.paused = true
        TeamPodium.MovedUnits.push(kitty)
        print(
            `${ColorUtils.PlayerNameColored(player)}${TeamPodium.Color} earned ${PodiumUtil.PlacementString(TeamPodium.PodiumQueue.length + 1)} for: place ${TeamPodium.PodiumType} with ${TeamPodium.GetStatBasedOnType(player)}|r`
        )
        Utility.SimpleTimer(5.0, TeamPodium.ProcessNextPodiumAction)
    }

    /// <summary>
    /// Topscore => Saves => Ratio => Streak .. End
    /// </summary>
    private static ProcessPodiumTypeActions() {
        TeamPodium.PodiumQueue.length = 0
        PodiumUtil.ClearPodiumUnits(TeamPodium.MovedUnits)
        switch (TeamPodium.PodiumType) {
            case '':
                TeamPodium.EnqueueMVPPlayer()
                break

            case TeamPodium.MVP:
                TeamPodium.EnqueueTopSavesPlayer()
                break

            case TeamPodium.MostSaves:
                PodiumUtil.EndingGameThankyou()
                return

            default:
                break
        }
        TeamPodium.ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType(player: MapPlayer) {
        let stats = Globals.ALL_KITTIES.get(player)!.CurrentStats
        switch (TeamPodium.PodiumType) {
            case TeamPodium.MostSaves:
                return stats.TotalSaves.toString()

            case TeamPodium.MVP:
                return stats.TotalDeaths === 0
                    ? stats.TotalSaves.toFixed(2) + ' ratio.'
                    : (stats.TotalSaves / stats.TotalDeaths).toFixed(2) + ' ratio'

            default:
                return 'n/a'
        }
    }
}
