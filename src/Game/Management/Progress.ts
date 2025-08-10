

class Progress
{
    public static Dictionary<int, float> DistancesFromStart = new Dictionary<int, float>();
    private static TeamProgTimer: timer = timer.Create();

    public static Initialize()
    {
        CalculateTotalDistance();
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return;
        TeamProgTimer.Start(0.2, true, TeamProgressTracker);
    }

    public static CalculateProgress(kitty: Kitty)
    {
        let round = Globals.ROUND;
        kitty.TimeProg.SetRoundProgress(round, CalculatePlayerProgress(kitty));
    }

    private static TeamProgressTracker()
    {
        if (!Globals.GAME_ACTIVE) return;
        try
        {

            for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.Count; i++)
            {
                let team = Globals.ALL_TEAMS_LIST[i];
                team.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(team));
            }
            TeamsMultiboard.UpdateTeamStatsMB();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in TeamProgressTracker. {e.Message}");
        }
    }

    private static CalculateTeamProgress(Team: Team)
    {
        let totalProgress: number = 0.0;

        if (Team.Teammembers.Count == 0) return "0.00";

        for (let i: number = 0; i < Team.Teammembers.Count; i++)
        {
            let player = Team.Teammembers[i];
            totalProgress += Globals.ALL_KITTIES[player].TimeProg.GetRoundProgress(Globals.ROUND);
        }

        return (totalProgress / Team.Teammembers.Count).ToString("F2");
    }

    private static CalculatePlayerProgress(kitty: Kitty)
    {
        try
        {
            let currentSafezone = kitty.ProgressZone;
            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Rectangle.Contains(kitty.Unit.X, kitty.Unit.Y)) return 100.0; // if at end.. 100 progress
            if (Regions.Victory_Area.Contains(kitty.Unit.X, kitty.Unit.Y)) return 100.0; // if in victory area, 100 progress
            if (Globals.SAFE_ZONES[0].Rectangle.Contains(kitty.Unit.X, kitty.Unit.Y) && !kitty.Finished) return 0.0; // if at start, 0 progress
            if (kitty.Alive && kitty.Finished) return 100.0;
            let currentProgress = DistanceBetweenPoints(kitty.Unit.X, kitty.Unit.Y,
                ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].X, ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].Y);
            let totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

            let progress = totalProgress / DistancesFromStart[RegionList.PathingPoints.Length - 1] * 100;
            if (progress > 100) progress = 100.00;

            return progress;
        }
        catch (e: Error)
        {
            Logger.Warning("Error in CalculatePlayerProgress. {e.Message}");
            return 0.0;
        }
    }

    public static CalculateNitroPacerProgress(): number
    {
        let nitroKitty = NitroPacer.Unit;
        let currentSafezone = NitroPacer.GetCurrentCheckpoint();
        if (Globals.SAFE_ZONES[0].Rectangle.Contains(nitroKitty.X, nitroKitty.Y)) return 0.0; // if at start, 0 progress
        if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Rectangle.Contains(nitroKitty.X, nitroKitty.Y)) return 100.0; // if at end.. 100 progress
        let currentProgress = DistanceBetweenPoints(nitroKitty.X, nitroKitty.Y,
            ProgressPointHelper.Points[currentSafezone].X, ProgressPointHelper.Points[currentSafezone].Y);
        let totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

        return totalProgress;
    }

    private static CalculateTotalDistance()
    {
        try
        {
            if (RegionList.PathingPoints == null || RegionList.PathingPoints.Length == 0)
            {
                Logger.Warning("list: PathingPoints is or: empty: null.");
                return;
            }

            let totalDistance = 0.0;
            let count = 0;
            DistancesFromStart.Add(0, 0.0);
            for (let pathPoint in RegionList.PathingPoints)
            {
                if (count >= RegionList.PathingPoints.Length - 1) break;
                let nextPathPoint = RegionList.PathingPoints[count + 1];
                totalDistance += DistanceBetweenPoints(pathPoint.Rect.CenterX, pathPoint.Rect.CenterY, nextPathPoint.Rect.CenterX, nextPathPoint.Rect.CenterY);
                if (!DistancesFromStart.ContainsKey(count + 1)) DistancesFromStart.Add(count + 1, totalDistance);
                count++;
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in CalculateTotalDistance. {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static DistanceBetweenPoints(x1: number, y1: number, x2: number, y2: number)
    {
        return Math.Abs(x1 - x2) > Math.Abs(y1 - y2) ? Math.Abs(x1 - x2) : Math.Abs(y1 - y2);
    }
}
