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
        TeamProgTimer.Start(0.2f, true, () => TeamProgressTracker());
    }

    public static void CalculateProgress(Kitty kitty)
    {
        var Player = kitty.Player;
        var round = Globals.ROUND;
        Globals.ALL_KITTIES[Player].TimeProg.SetRoundProgress(round, CalculatePlayerProgress(Player));
    }

    private static void TeamProgressTracker()
    {
        if (!Globals.GAME_ACTIVE) return;
        foreach (var Team in Globals.ALL_TEAMS)
        {
            Team.Value.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(Team.Value));
        }
        TeamsMultiboard.UpdateTeamStatsMB();
    }

    private static string CalculateTeamProgress(Team Team)
    {
        return (Team.Teammembers.Sum(player => Globals.ALL_KITTIES[player].TimeProg.GetRoundProgress(Globals.ROUND)) / Team.Teammembers.Count).ToString("F2");
    }

    private static float CalculatePlayerProgress(player Player)
    {
        try
        {
            var kitty = Globals.ALL_KITTIES[Player];
            var currentSafezone = kitty.ProgressZone;

            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Region.Contains(kitty.Unit)) return 100.0f; // if at end.. 100 progress
            if (Regions.Victory_Area.Region.Contains(kitty.Unit)) return 100.0f; // if in victory area, 100 progress
            if (Globals.SAFE_ZONES[0].Region.Contains(kitty.Unit) && !kitty.Finished) return 0.0f; // if at start, 0 progress
            if (kitty.Alive && kitty.Finished) return 100.0f;
            var currentProgress = DistanceBetweenPoints(kitty.Unit.X, kitty.Unit.Y,
                ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].X, ProgressPointHelper.Points[kitty.ProgressHelper.CurrentPoint].Y);
            var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

            var progress = totalProgress / DistancesFromStart[RegionList.PathingPoints.Count() - 1] * 100;
            if (progress > 100) progress = 100.00f;

            return progress;
        }
        catch (Exception e)
        {
            _ = e.Message;
            if (Source.Program.Debug) Console.WriteLine(e.Message);
            if (Source.Program.Debug) Console.WriteLine(e.StackTrace);
            return 0.0f;
        }
    }

    public static float CalculateNitroPacerProgress()
    {
        var nitroKitty = NitroPacer.Unit;
        var currentSafezone = NitroPacer.GetCurrentCheckpoint();
        if (Globals.SAFE_ZONES[0].Region.Contains(nitroKitty)) return 0.0f; // if at start, 0 progress
        if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count - 1].Region.Contains(nitroKitty)) return 100.0f; // if at end.. 100 progress
        var currentProgress = DistanceBetweenPoints(nitroKitty.X, nitroKitty.Y,
            ProgressPointHelper.Points[currentSafezone].X, ProgressPointHelper.Points[currentSafezone].Y);
        var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

        return totalProgress;
    }

    private static void CalculateTotalDistance()
    {
        try
        {
            var totalDistance = 0.0f;
            var count = 0;
            DistancesFromStart.Add(0, 0.0f);
            foreach (var pathPoint in RegionList.PathingPoints)
            {
                if (count > RegionList.PathingPoints.Count() - 1) break;
                var nextPathPoint = RegionList.PathingPoints[count + 1];
                totalDistance += DistanceBetweenPoints(pathPoint.Rect.CenterX, pathPoint.Rect.CenterY, nextPathPoint.Rect.CenterX, nextPathPoint.Rect.CenterY);
                DistancesFromStart.Add(count + 1, totalDistance);
                count++;
            }
        }
        catch (Exception e)
        {
            //Console.WriteLine(e.Message);
            _ = e.Message;
        }
    }

    private static float DistanceBetweenPoints(float x1, float y1, float x2, float y2)
    {
        return Math.Abs(x1 - x2) > Math.Abs(y1 - y2) ? Math.Abs(x1 - x2) : Math.Abs(y1 - y2);
    }
}