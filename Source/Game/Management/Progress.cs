using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public static class Progress
{
    public static Dictionary<int, float> DistancesFromStart { get; private set; } = new Dictionary<int, float>();
    private static timer TeamProgTimer { get; set; } = timer.Create();

    public static void Initialize()
    {
        CalculateTotalDistance();
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        TeamProgTimer.Start(0.2f, true, TeamProgressTracker);
    }

    public static void CalculateProgress(Kitty kitty)
    {
        var round = Globals.ROUND;
        kitty.TimeProg.SetRoundProgress(round, CalculatePlayerProgress(kitty));
    }

    private static void TeamProgressTracker()
    {
        if (!Globals.GAME_ACTIVE) return;
        try
        {

            for (int i = 0; i < Globals.ALL_TEAMS_LIST.Count; i++)
            {
                var team = Globals.ALL_TEAMS_LIST[i];
                team.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(team));
            }
            TeamsMultiboard.UpdateTeamStatsMB();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in TeamProgressTracker. {e.Message}");
        }
    }

    private static string CalculateTeamProgress(Team Team)
    {
        float totalProgress = 0.0f;

        if (Team.Teammembers.Count == 0) return "0.00";

        for (int i = 0; i < Team.Teammembers.Count; i++)
        {
            var player = Team.Teammembers[i];
            totalProgress += Globals.ALL_KITTIES[player].TimeProg.GetRoundProgress(Globals.ROUND);
        }

        return (totalProgress / Team.Teammembers.Count).ToString("F2");
    }

    private static float CalculatePlayerProgress(Kitty kitty)
    {
        try
        {
            var currentSafezone = kitty.ProgressZone;
            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Rectangle.Contains(kitty.Unit.X, kitty.Unit.Y)) return 100.0f; // if at end.. 100 progress
            if (Regions.Victory_Area.Contains(kitty.Unit.X, kitty.Unit.Y)) return 100.0f; // if in victory area, 100 progress
            if (Globals.SAFE_ZONES[0].Rectangle.Contains(kitty.Unit.X, kitty.Unit.Y) && !kitty.Finished) return 0.0f; // if at start, 0 progress
            if (kitty.Alive && kitty.Finished) return 100.0f;
            var currentProgress = DistanceBetweenPoints(kitty.Unit.X, kitty.Unit.Y,
                ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].X, ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].Y);
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

    public static float CalculateNitroPacerProgress()
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

    private static void CalculateTotalDistance()
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
