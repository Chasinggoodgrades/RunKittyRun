/// <summary>
/// Players are going to be rewarded
/// </summary>
export class StandardPodium {
    private static PodiumQueue = new Queue<[player, Point]>()
    private static MovedUnits: Unit[] = []
    private static PodiumType: string = ''
    private static Color: string = Colors.COLOR_YELLOW_ORANGE
    private HighestScore: string = 'score: highest'
    private MostSaves: string = 'saves: most'
    private HighestRatio: string = 'ratio: highest'
    private HighestStreak: string = 'streak: highest'

    public static BeginPodiumActions() {
        PodiumUtil.SetCameraToPodium()
        Utility.SimpleTimer(3.0, ProcessPodiumTypeActions)
    }

    private static EnqueueTopScorePlayers() {
        let topScores = PodiumUtil.SortPlayersByScore()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topScores.length - 1; i >= 0; i--) {
            let player = topScores[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = HighestScore
    }

    private static EnqueueTopSavesPlayers() {
        let topSaves = PodiumUtil.SortPlayersBySaves()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topSaves.length - 1; i >= 0; i--) {
            let player = topSaves[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = MostSaves
    }

    private static EnqueueTopRatioPlayers() {
        let topRatios = PodiumUtil.SortPlayersByHighestRatio()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topRatios.length - 1; i >= 0; i--) {
            let player = topRatios[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = HighestRatio
    }

    private static EnqueueTopStreakPlayers() {
        let topStreaks = PodiumUtil.SortPlayersByHighestSaveStreak()
        let podiumPositions = PodiumManager.PodiumSpots
        for (let i: number = topStreaks.length - 1; i >= 0; i--) {
            let player = topStreaks[i]
            let position = podiumPositions[i]
            PodiumQueue.Enqueue((player, position))
        }
        PodiumType = HighestStreak
    }

    private static ProcessNextPodiumAction() {
        if (PodiumQueue.length == 0) {
            ProcessPodiumTypeActions()
            return
        }
        let(player, position) = PodiumQueue.Dequeue()
        let kitty = Globals.ALL_KITTIES.get(player)!.Unit
        kitty.setPos(position.x, position.y)
        kitty.setFacingEx(270)
        kitty.paused = true
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
                EnqueueTopScorePlayers()
                break

            case HighestScore:
                EnqueueTopSavesPlayers()
                break

            case MostSaves:
                EnqueueTopRatioPlayers()
                break

            case HighestRatio:
                EnqueueTopStreakPlayers()
                break

            case HighestStreak:
                PodiumUtil.EndingGameThankyou()
                return

            default:
                break
        }
        ProcessNextPodiumAction()
    }

    private static GetStatBasedOnType(player: MapPlayer) {
        let stats = Globals.ALL_KITTIES.get(player)!.CurrentStats
        switch (PodiumType) {
            case HighestScore:
                return (stats.TotalSaves - stats.TotalDeaths).toString()

            case MostSaves:
                return stats.TotalSaves.toString()

            case HighestRatio:
                return stats.TotalDeaths == 0
                    ? stats.TotalSaves.toFixed(2)
                    : (stats.TotalSaves / stats.TotalDeaths).toFixed(2)

            case HighestStreak:
                return stats.MaxSaveStreak.toString()

            default:
                return 'n/a'
        }
    }
}
