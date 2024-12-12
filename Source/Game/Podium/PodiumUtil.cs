using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Most of the following functions in this class , take the top 3 players and return them in a list
/// </summary>
public static class PodiumUtil
{
    public static List<player> SortPlayersByScore()
    {
        return Globals.ALL_PLAYERS.OrderByDescending(player =>
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            return stats.TotalSaves - stats.TotalDeaths;
        }).Take(3).ToList();
    }

    public static List<player> SortPlayersBySaves()
    {
        return Globals.ALL_PLAYERS.OrderByDescending(player =>
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            return stats.TotalSaves;
        }).Take(3).ToList();
    }

    public static List<player> SortPlayersByHighestRatio()
    {
        return Globals.ALL_PLAYERS.OrderByDescending(player =>
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            return stats.TotalDeaths == 0 ? stats.TotalSaves : (float)stats.TotalSaves / stats.TotalDeaths;
        }).Take(3).ToList();
    }

    public static List<player> SortPlayersByHighestSaveStreak()
    {
        return Globals.ALL_PLAYERS.OrderByDescending(player =>
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            return stats.MaxSaveStreak;
        }).Take(3).ToList();
    }

    public static List<player> SortPlayersTopProgress()
    {
        return Globals.ALL_PLAYERS.OrderByDescending(player =>
        {
            var stats = Globals.ALL_KITTIES[player].TimeProg;
            return stats.GetOverallProgress();
        }).Take(3).ToList();
    }

    public static List<player> SortPlayersFastestTime()
    {
        return Globals.ALL_PLAYERS.OrderBy(player =>
        {
            var stats = Globals.ALL_KITTIES[player].TimeProg;
            return stats.GetTotalTime();
        }).Take(3).ToList();
    }

    public static void SetCameraToPodium()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            var podium = Regions.Podium_cinematic;
            if (player.IsLocal) {
                SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 1400.0f, 0.0f);
                PanCameraToTimed(podium.Center.X, podium.Center.Y, 2.0f);
            }
        }
    }

    public static void ClearPodiumUnits(List<unit> podiumUnits)
    {
        if (podiumUnits.Count == 0) return;
        foreach (var kitty in podiumUnits)
        {
            kitty.SetPosition(Regions.safe_Area_00.Center.X, Regions.safe_Area_00.Center.Y);
            kitty.IsPaused = false;
        }
        podiumUnits.Clear();
    }

    public static void EndingGameThankyou()
    {
        Console.WriteLine($"{Colors.COLOR_YELLOW}Thanks to everyone for playing, much love <3|r");
        Gameover.NotifyEndingGame();
    }

    public static string PlacementString(int placement)
    {
        switch(placement)
        {
            case 1:
                return "1st";
            case 2:
                return "2nd";
            case 3:
                return "3rd";
            default:
                return $"{placement}th";
        }
    }



}
