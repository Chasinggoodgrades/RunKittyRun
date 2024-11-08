﻿using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Progress
{
    public static Dictionary<int, float> DistancesFromStart = new Dictionary<int, float>();
    private static timer PeriodicTimer;
    private const float PROGRESS_INTERVAL = 0.2f;
    public static Dictionary<player, rect> PlayerProgressPoints = new Dictionary<player, rect>();
    public static void Initialize()
    {
        Globals.TEAM_PROGRESS = new Dictionary<Team, string>();
        Globals.PLAYER_PROGRESS = new Dictionary<player, float>();
        CalculateTotalDistance();
        StartProgressTracker();
    }

    private static void StartProgressTracker()
    {
        if (Gamemode.CurrentGameMode == "Standard") return;
        PeriodicTimer = timer.Create();
        TimerStart(PeriodicTimer, PROGRESS_INTERVAL, true, PeriodicProgressTracker);
    }

    private static void PeriodicProgressTracker()
    {
        try
        {
            if (!Globals.GAME_ACTIVE) return;
            foreach (var Player in Globals.ALL_PLAYERS)
            {
                if (!Globals.ALL_KITTIES[Player].Finished)
                    Globals.ALL_KITTIES[Player].Progress = CalculatePlayerProgress(Player);
            }
            foreach (var Team in Globals.ALL_TEAMS.Values)
            {
                Team.UpdateRoundProgress(Globals.ROUND, CalculateTeamProgress(Team));
            }
            Multiboard.UpdateTeamStatsMB();
        }
        catch (Exception e)
        {
            var error = e.Message;
        }
    }

    private static string CalculateTeamProgress(Team Team)
    {
        return (Team.Teammembers.Sum(player => Globals.ALL_KITTIES[player].Progress) / Team.Teammembers.Count).ToString("F2");
    }

    private static float CalculatePlayerProgress(player Player)
    {
        try
        {
            var kitty = Globals.ALL_KITTIES[Player];
            var currentSafezone = kitty.ProgressZone;

            if (Globals.SAFE_ZONES[0].Region.Contains(kitty.Unit)) return 0.0f; // if at start, 0 progress
            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count-1].Region.Contains(kitty.Unit)) return 100.0f; // if at end.. 100 progress

            var currentProgress = DistanceBetweenPoints(kitty.Unit.X, kitty.Unit.Y,
                PlayerProgressPoints[Player].CenterX, PlayerProgressPoints[Player].CenterY);
            var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;


            return (totalProgress / DistancesFromStart[RegionList.PathingPoints.Count() - 1]) * 100;
        }
        catch (Exception e)
        {
            var error = e.Message;
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
            RegionList.PathingPoints[currentSafezone].Rect.CenterX, RegionList.PathingPoints[currentSafezone].Rect.CenterY);
        var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;

        return totalProgress;
    }

    private static void CalculateTotalDistance() {
        try
        {
            var totalDistance = 0.0f;
            var count = 0;
            DistancesFromStart.Add(0, 0.0f);
            foreach (var pathPoint in RegionList.PathingPoints)
            {
                if (count > RegionList.PathingPoints.Count() - 1) break;
                var nextPathPoint = RegionList.PathingPoints[count+1];
                totalDistance += DistanceBetweenPoints(pathPoint.Rect.CenterX, pathPoint.Rect.CenterY, nextPathPoint.Rect.CenterX, nextPathPoint.Rect.CenterY);
                DistancesFromStart.Add(count+1, totalDistance);
                count++;
            }
        }
        catch (Exception e)
        {
            //Console.WriteLine(e.Message);
            var error = e.Message;
        }
    }

    private static float DistanceBetweenPoints(float x1, float y1, float x2, float y2) 
    {
        if (Math.Abs(x1 - x2) > Math.Abs(y1 - y2)) return Math.Abs(x1 - x2);
        return Math.Abs(y1 - y2);
    }
}