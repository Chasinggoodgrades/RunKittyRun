using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Progress
{
    private static Dictionary<int, float> DistancesFromStart;
    private static trigger ProgressEvent;
    private static timer PeriodicTimer;
    public static void Initialize()
    {
        Globals.TEAM_PROGRESS = new Dictionary<Team, float>();
        Globals.PLAYER_PROGRESS = new Dictionary<player, float>();
        DistancesFromStart = new Dictionary<int, float>();
        InitializePlayerProgress();
        PeriodicTimer = CreateTimer();
        ProgressEvent = CreateTrigger();
        CalculateTotalDistance();
        PeriodicProgressTracker();
        StartProgressTracker();
    }

    private static void InitializePlayerProgress()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            Globals.PLAYER_PROGRESS.Add(player, 0.0f);
        }
    }

    private static void StartProgressTracker()
    {
        TimerStart(PeriodicTimer, 0.2f, true, PeriodicProgressTracker);
    }

    private static void PeriodicProgressTracker()
    {
        try
        {
            if (!Globals.GAME_ACTIVE) return;
            foreach (var Player in Globals.ALL_PLAYERS)
            {   
                Globals.PLAYER_PROGRESS[Player] = CalculatePlayerProgress(Player);
            }
            foreach (var Team in Globals.ALL_TEAMS.Values)
            {
                Globals.TEAM_PROGRESS[Team] = CalculateTeamProgress(Team);
            }
        }
       catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }

    private static float CalculateTeamProgress(Team Team)
    {
        var totalProgress = 0.0f;
        foreach (var player in Team.Teammembers)
        {
            totalProgress += Globals.PLAYER_PROGRESS[player];
        }
        return totalProgress / Team.Teammembers.Count;
    }

    private static float CalculatePlayerProgress(player Player)
    {
        try
        {
            var kitty = Globals.ALL_KITTIES[Player];
            var currentSafezone = kitty.CurrentSafeZone;

            if (Globals.SAFE_ZONES[0].Region.Contains(kitty.Unit)) return 0.0f; // if at start, 0 progress
            if (Globals.SAFE_ZONES[Globals.SAFE_ZONES.Count-1].Region.Contains(kitty.Unit)) return 100.0f; // if at end.. 100 progress

            var currentProgress = DistanceBetweenPoints(kitty.Unit.X, kitty.Unit.Y,
                Globals.SAFE_ZONES[currentSafezone].r_Rect.CenterX, Globals.SAFE_ZONES[currentSafezone].r_Rect.CenterY);
            var totalProgress = DistancesFromStart[currentSafezone] + currentProgress;


            return (totalProgress / DistancesFromStart[Globals.SAFE_ZONES.Count - 1]) * 100;
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return 0.0f;
        }
    }

    private static void CalculateTotalDistance() {
        try
        {
            var totalDistance = 0.0f;
            DistancesFromStart.Add(0, 0.0f);
            foreach (var safezone in Globals.SAFE_ZONES)
            {
                if (safezone.ID > Globals.SAFE_ZONES.Count - 2) break;
                var nextSafezone = Globals.SAFE_ZONES[Globals.SAFE_ZONES.IndexOf(safezone) + 1];
                totalDistance += DistanceBetweenPoints(safezone.r_Rect.CenterX, safezone.r_Rect.CenterY,
                    nextSafezone.r_Rect.CenterX, nextSafezone.r_Rect.CenterY);
                DistancesFromStart.Add(nextSafezone.ID, totalDistance);
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }

    private static float DistanceBetweenPoints(float x1, float y1, float x2, float y2) 
    {
        if (Math.Abs(x1 - x2) > Math.Abs(y1 - y2)) return Math.Abs(x1 - x2);
        return Math.Abs(y1 - y2);
    }
}