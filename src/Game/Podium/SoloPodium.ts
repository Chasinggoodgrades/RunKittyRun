export class SoloPodium {
    private static PodiumQueue = new Queue<[player, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private Time: string = 'time'
    private Progress: string = 'progress'

    public static BeginPodiumActions() {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, ProcessPodiumTypeActions)
    }

    private static EnqueueTopPlayerTimes() {
        let topTimes = PodiumUtil.SortPlayersFastestTime()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topTimes.length - 1; i >= 0; i--) {
            let player = topTimes[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = Time
    }

    private static EnqueueTopPlayerProgress() {
        let topProgress = PodiumUtil.SortPlayersTopProgress()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topProgress.length - 1; i >= 0; i--) {
            let player = topProgress[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = Progress
    }

    private static ProcessNextPodiumAction() {
        if (PodiumQueue.length == 0) {
            PodiumUtil.EndingGameThankyou()
            return
        }
        let(player, position) = PodiumQueue.Dequeue()
        let kitty = Globals.ALL_KITTIES.get(player).Unit
        kitty.setPos(position.X, position.Y)
        kitty.SetFacing(270)
        kitty.IsPaused = true
        MovedUnits.push(kitty)
        print(
            '{Colors.PlayerNameColored(player)}{Color} earned {PodiumUtil.PlacementString(PodiumQueue.length + 1)} for: place {PodiumType} with {GetStatBasedOnType(player)}|r'
        )
        Utility.SimpleTimer(5.0, ProcessNextPodiumAction)
    }

    private static ProcessPodiumTypeActions() {
        PodiumQueue.clear()
        PodiumUtil.ClearPodiumUnits(MovedUnits)
        switch (Gamemode.CurrentGameModeType) {
            case 'Race':
                EnqueueTopPlayerTimes()
                break

            case 'Progression':
                EnqueueTopPlayerProgress()
                break
        }
        ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType(player: MapPlayer) {
        let stats = Globals.ALL_KITTIES.get(player).TimeProg
        switch (PodiumType) {
            case Time:
                return stats.GetTotalTimeFormatted()

            case Progress:
                return stats.GetOverallProgress().ToString('F2') + '%'

            default:
                return 'n/a'
        }
    }
}
