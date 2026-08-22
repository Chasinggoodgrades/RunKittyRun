using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public sealed class Progress : IProgressService
{
    private static Progress _instance;
    public static Progress Instance => _instance
        ?? throw new InvalidOperationException("Progress has not been initialized. Call Progress.Initialize() before accessing the instance.");

    public Dictionary<int, float> DistancesFromStart { get; private set; } = new Dictionary<int, float>();
    private timer TeamProgTimer { get; set; } = timer.Create();

    public static void Initialize()
    {
        _instance ??= new Progress();
    }

    private Progress()
    {
        CalculateTotalDistance();
        if (Gamemode.CurrentGameMode != GameMode.Team) return;
        TeamProgTimer.Start(0.2f, true, TeamProgressTracker);
    }

    public float CalculateProgress(ProgressRequest request)
    {
        return CalculatePlayerProgress(request);
    }

    private void TeamProgressTracker()
    {
        if (!Globals.GAME_ACTIVE) return;
        try
        {
            var allTeams = TeamRegistry.All;
            for (int i = 0; i < allTeams.Count; i++)
            {
                var team = allTeams[i];
                team.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(team));
            }
            //TeamsMultiboard.UpdateTeamStatsMB();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in TeamProgressTracker. {e.Message}");
        }
    }

    private string CalculateTeamProgress(Team Team)
    {
        float totalProgress = 0.0f;

        if (Team.Teammembers.Count == 0) return "0.00";

        for (int i = 0; i < Team.Teammembers.Count; i++)
        {
            var kitty = Team.Teammembers[i];
            if (kitty.Finished) totalProgress += 100.00f;
            else totalProgress += kitty.TimeProg.GetRoundProgress(Globals.ROUND);

        }

        return (totalProgress / Team.Teammembers.Count).ToString("F2");
    }

    private float CalculatePlayerProgress(ProgressRequest request)
    {
        try
        {
            // Once a kitty has finished (entered the final safezone or the victory area), always report 100 progress.
            if (request.Finished || HasReachedFinalSafezone(request)) return 100.0f;

            var currentSafezone = request.ProgressZone;
            if (Globals.SAFE_ZONES[0].Rectangle.Contains(request.UnitX, request.UnitY)) return 0.0f; // if at start, 0 progress
            var currentProgress = DistanceBetweenPoints(request.UnitX, request.UnitY,
                ProgressPointHelper.Points[request.CurrentPoint].X, ProgressPointHelper.Points[request.CurrentPoint].Y);
            var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

            var progress = totalProgress / DistancesFromStart[RegionList.PathingPoints.Length - 1] * 100;
            if (progress > 100) progress = 100.00f;

            return progress;
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in CalculatePlayerProgress. {e.Message}");
            return 0.0f;
        }
    }

    private static bool HasReachedFinalSafezone(ProgressRequest request)
    {
        return Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Rectangle.Contains(request.UnitX, request.UnitY)
            || Regions.Victory_Area.Contains(request.UnitX, request.UnitY);
    }

    public float CalculateNitroPacerProgress()
    {
        var nitroKitty = NitroPacer.Unit;
        var currentSafezone = NitroPacer.GetCurrentCheckpoint();
        if (Globals.SAFE_ZONES[0].Rectangle.Contains(nitroKitty.X, nitroKitty.Y)) return 0.0f; // if at start, 0 progress
        if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Rectangle.Contains(nitroKitty.X, nitroKitty.Y)) return 100.0f; // if at end.. 100 progress
        var currentProgress = DistanceBetweenPoints(nitroKitty.X, nitroKitty.Y,
            ProgressPointHelper.Points[currentSafezone].X, ProgressPointHelper.Points[currentSafezone].Y);
        var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

        return totalProgress;
    }

    private void CalculateTotalDistance()
    {
        try
        {
            if (RegionList.PathingPoints == null || RegionList.PathingPoints.Length == 0)
            {
                Logger.Warning("PathingPoints list is null or empty.");
                return;
            }

            var totalDistance = 0.0f;
            var count = 0;
            DistancesFromStart.Add(0, 0.0f);
            foreach (var pathPoint in RegionList.PathingPoints)
            {
                if (count >= RegionList.PathingPoints.Length - 1) break;
                var nextPathPoint = RegionList.PathingPoints[count + 1];
                totalDistance += DistanceBetweenPoints(pathPoint.Rect.CenterX, pathPoint.Rect.CenterY, nextPathPoint.Rect.CenterX, nextPathPoint.Rect.CenterY);
                if (!DistancesFromStart.ContainsKey(count + 1)) DistancesFromStart.Add(count + 1, totalDistance);
                count++;
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in CalculateTotalDistance. {e.Message}");
            throw;
        }
    }

    private static float DistanceBetweenPoints(float x1, float y1, float x2, float y2)
    {
        return Math.Abs(x1 - x2) > Math.Abs(y1 - y2) ? Math.Abs(x1 - x2) : Math.Abs(y1 - y2);
    }
}
