export class TeamPodium {
    private static PodiumQueue = new Queue<[player, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private MVP: string = 'MVP'
    private MostSaves: string = 'saves: most'

    public static BeginPodiumActions() {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, ProcessPodiumTypeActions)
    }

    private static EnqueueMVPPlayer() {
        let topRatios = PodiumUtil.SortPlayersByHighestRatio()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topRatios.length - 1; i >= 0; i--) {
            let player = topRatios[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = MVP
    }

    private static EnqueueTopSavesPlayer() {
        let topSaves = PodiumUtil.SortPlayersBySaves()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topSaves.length - 1; i >= 0; i--) {
            let player = topSaves[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = MostSaves
    }

    private static ProcessNextPodiumAction() {
        if (PodiumQueue.length == 0) {
            ProcessPodiumTypeActions()
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

    /// <summary>
    /// Topscore => Saves => Ratio => Streak .. End
    /// </summary>
    private static ProcessPodiumTypeActions() {
        PodiumQueue.clear()
        PodiumUtil.ClearPodiumUnits(MovedUnits)
        switch (PodiumType) {
            case '':
                EnqueueMVPPlayer()
                break

            case MVP:
                EnqueueTopSavesPlayer()
                break

            case MostSaves:
                PodiumUtil.EndingGameThankyou()
                return

            default:
                break
        }
        ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType(player: MapPlayer) {
        let stats = Globals.ALL_KITTIES.get(player).CurrentStats
        switch (PodiumType) {
            case MostSaves:
                return stats.TotalSaves.ToString()

            case MVP:
                return stats.TotalDeaths == 0
                    ? stats.TotalSaves.ToString('F2') + ' ratio.'
                    : (stats.TotalSaves / stats.TotalDeaths).ToString('F2') + ' ratio'

            default:
                return 'n/a'
        }
    }
}
