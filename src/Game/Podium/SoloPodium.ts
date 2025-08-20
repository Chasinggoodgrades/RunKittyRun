import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Queue } from 'src/Utility/Queue'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Point, Unit } from 'w3ts'
import { PodiumUtil } from './PodiumUtil'

export class SoloPodium {
    private static PodiumQueue = new Queue<[MapPlayer, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private static Time: string = 'time'
    private static Progress: string = 'progress'

    public static BeginPodiumActions = () => {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, SoloPodium.ProcessPodiumTypeActions)
    }

    private static EnqueueTopPlayerTimes = () => {
        const topTimes = PodiumUtil.SortPlayersFastestTime()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topTimes.length - 1; i >= 0; i--) {
            const player = topTimes[i]
            const position = podiumPositions[i]
            SoloPodium.PodiumQueue.enqueue([player, position])
        }
        SoloPodium.PodiumType = SoloPodium.Time
    }

    private static EnqueueTopPlayerProgress = () => {
        const topProgress = PodiumUtil.SortPlayersTopProgress()
        const podiumPositions = PodiumUtil.PodiumSpots
        for (let i: number = topProgress.length - 1; i >= 0; i--) {
            const player = topProgress[i]
            const position = podiumPositions[i]
            SoloPodium.PodiumQueue.enqueue([player, position])
        }
        SoloPodium.PodiumType = SoloPodium.Progress
    }

    private static ProcessNextPodiumAction = () => {
        if (SoloPodium.PodiumQueue.length === 0) {
            PodiumUtil.EndingGameThankyou()
            return
        }
        const [player, position] = SoloPodium.PodiumQueue.dequeue()!
        const kitty = Globals.ALL_KITTIES.get(player)!.Unit
        kitty.setPosition(position.x, position.y)
        kitty.setFacingEx(270)
        kitty.paused = true
        SoloPodium.MovedUnits.push(kitty)
        print(
            `${ColorUtils.PlayerNameColored(player)}${SoloPodium.Color} earned ${PodiumUtil.PlacementString(SoloPodium.PodiumQueue.length + 1)} for: place ${SoloPodium.PodiumType} with ${SoloPodium.GetStatBasedOnType(player)}|r`
        )
        Utility.SimpleTimer(5.0, SoloPodium.ProcessNextPodiumAction)
    }

    private static ProcessPodiumTypeActions = () => {
        SoloPodium.PodiumQueue.length = 0
        PodiumUtil.ClearPodiumUnits(SoloPodium.MovedUnits)
        switch (Globals.CurrentGameModeType) {
            case 'Race':
                SoloPodium.EnqueueTopPlayerTimes()
                break

            case 'Progression':
                SoloPodium.EnqueueTopPlayerProgress()
                break
        }
        SoloPodium.ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType = (player: MapPlayer) => {
        const stats = Globals.ALL_KITTIES.get(player)!.TimeProg
        switch (SoloPodium.PodiumType) {
            case 'Time':
                return stats.GetTotalTimeFormatted()

            case 'Progress':
                return stats.GetOverallProgress().toFixed(2) + '%'

            default:
                return 'n/a'
        }
    }
}
