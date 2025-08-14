import { Gamemode } from 'src/Gamemodes/Gamemode'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { Queue } from 'src/Utility/Queue'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Point, Unit } from 'w3ts'
import { PodiumManager } from './PodiumManager'
import { PodiumUtil } from './PodiumUtil'

export class SoloPodium {
    private static PodiumQueue = new Queue<[MapPlayer, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private Time: string = 'time'
    private Progress: string = 'progress'

    public static BeginPodiumActions() {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, this.ProcessPodiumTypeActions)
    }

    private static EnqueueTopPlayerTimes() {
        let topTimes = PodiumUtil.SortPlayersFastestTime()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topTimes.length - 1; i >= 0; i--) {
            let player = topTimes[i]
            let position = podiumPositions[i]
            this.PodiumQueue.enqueue((player, position))
        }
        this.PodiumType = this.Time
    }

    private static EnqueueTopPlayerProgress() {
        let topProgress = PodiumUtil.SortPlayersTopProgress()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topProgress.length - 1; i >= 0; i--) {
            let player = topProgress[i]
            let position = podiumPositions[i]
            this.PodiumQueue.enqueue((player, position))
        }
        this.PodiumType = this.Progress
    }

    private static ProcessNextPodiumAction() {
        if (this.PodiumQueue.length == 0) {
            PodiumUtil.EndingGameThankyou()
            return
        }
        let(player, position) = this.PodiumQueue.dequeue()
        let kitty = Globals.ALL_KITTIES.get(player)!.Unit
        kitty.setPosition(position.x, position.y)
        kitty.setFacingEx(270)
        kitty.paused = true
        this.MovedUnits.push(kitty)
        print(
            '{Colors.PlayerNameColored(player)}{Color} earned {PodiumUtil.PlacementString(PodiumQueue.length + 1)} for: place {PodiumType} with {GetStatBasedOnType(player)}|r'
        )
        Utility.SimpleTimer(5.0, this.ProcessNextPodiumAction)
    }

    private static ProcessPodiumTypeActions() {
        this.PodiumQueue.clear()
        PodiumUtil.ClearPodiumUnits(this.MovedUnits)
        switch (Gamemode.CurrentGameModeType) {
            case 'Race':
                this.EnqueueTopPlayerTimes()
                break

            case 'Progression':
                this.EnqueueTopPlayerProgress()
                break
        }
        this.ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType(player: MapPlayer) {
        let stats = Globals.ALL_KITTIES.get(player)!.TimeProg
        switch (this.PodiumType) {
            case 'Time':
                return stats.GetTotalTimeFormatted()

            case 'Progress':
                return stats.GetOverallProgress().toFixed(2) + '%'

            default:
                return 'n/a'
        }
    }
}
