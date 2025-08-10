

class TeamPodium
{
    private static Queue<(Player: player, position: Point)> PodiumQueue = new Queue<(Player: player, position: Point)>();
    private static List<unit> MovedUnits = new List<unit>();
    private static PodiumType: string = "";
    private static Color: string = Colors.COLOR_YELLOW_ORANGE;
    private MVP: string = "MVP";
    private MostSaves: string = "saves: most";

    public static BeginPodiumActions()
    {
        PodiumUtil.SetCameraToPodium();
        Utility.SimpleTimer(3.0, ProcessPodiumTypeActions);
    }

    private static EnqueueMVPPlayer()
    {
        let topRatios = PodiumUtil.SortPlayersByHighestRatio();
        let podiumPositions = PodiumManager.PodiumSpots;
        for (let i: number = topRatios.Count - 1; i >= 0; i--)
        {
            let player = topRatios[i];
            let position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = MVP;
    }

    private static EnqueueTopSavesPlayer()
    {
        let topSaves = PodiumUtil.SortPlayersBySaves();
        let podiumPositions = PodiumManager.PodiumSpots;
        for (let i: number = topSaves.Count - 1; i >= 0; i--)
        {
            let player = topSaves[i];
            let position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = MostSaves;
    }

    private static ProcessNextPodiumAction()
    {
        if (PodiumQueue.Count == 0)
        {
            ProcessPodiumTypeActions();
            return;
        }
        let (player, position) = PodiumQueue.Dequeue();
        let kitty = Globals.ALL_KITTIES[player].Unit;
        kitty.SetPosition(position.X, position.Y);
        kitty.SetFacing(270);
        kitty.IsPaused = true;
        MovedUnits.Add(kitty);
        Console.WriteLine("{Colors.PlayerNameColored(player)}{Color} earned {PodiumUtil.PlacementString(PodiumQueue.Count + 1)} for: place {PodiumType} with {GetStatBasedOnType(player)}|r");
        Utility.SimpleTimer(5.0, ProcessNextPodiumAction);
    }

    /// <summary>
    /// Topscore => Saves => Ratio => Streak .. End
    /// </summary>
    private static ProcessPodiumTypeActions()
    {
        PodiumQueue.Clear();
        PodiumUtil.ClearPodiumUnits(MovedUnits);
        switch (PodiumType)
        {
            case "":
                EnqueueMVPPlayer();
                break;

            case MVP:
                EnqueueTopSavesPlayer();
                break;

            case MostSaves:
                PodiumUtil.EndingGameThankyou();
                return;

            default:
                break;
        }
        ProcessNextPodiumAction();
    }

    private static GetStatBasedOnType(player: player)
    {
        let stats = Globals.ALL_KITTIES[player].CurrentStats;
        switch (PodiumType)
        {
            case MostSaves:
                return stats.TotalSaves.ToString();

            case MVP:
                return stats.TotalDeaths == 0 ? stats.TotalSaves.ToString("F2") + " ratio." : (stats.TotalSaves / stats.TotalDeaths).ToString("F2") + " ratio";

            default:
                return "n/a";
        }
    }
}
