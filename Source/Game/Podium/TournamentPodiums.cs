using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Data;

public static class TournamentPodiums
{
    private static Queue<(player Player, Point position)> PodiumQueue = new Queue<(player Player, Point position)>();
    private static List<unit> MovedUnits = new List<unit>();
    private static string PodiumType = "";
    private static string Color = Colors.COLOR_YELLOW;

    public static void BeginPodiumActions()
    {
        PodiumUtil.SetCameraToPodium();
        Utility.SimpleTimer(3.0f, ProcessPodiumTypeActions);
    }

    private static void EnqueueTopPlayerTimes()
    {
        var topTimes = PodiumUtil.SortPlayersFastestTime();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topTimes.Count - 1; i >= 0; i--)
        {
            var player = topTimes[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = "Fastest Time";
    }

    private static void EnqueueTopPlayerProgress()
    {
        var topProgress = PodiumUtil.SortPlayersTopProgress();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topProgress.Count - 1; i >= 0; i--)
        {
            var player = topProgress[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = "Most Progress";
    }

    private static void EnqueueTopRatioPlayers()
    {
        var topRatios = PodiumUtil.SortPlayersByHighestRatio();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topRatios.Count - 1; i >= 0; i--)
        {
            var player = topRatios[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = "Best Ratio";
    }

    private static void EnqueueTopSavesPlayer()
    {
        var topSaves = PodiumUtil.SortPlayersBySaves();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topSaves.Count - 1; i >= 0; i--)
        {
            var player = topSaves[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = "Most Saves";
    }

    private static void ProcessNextPodiumAction()
    {
        if (PodiumQueue.Count == 0)
        {
            ProcessPodiumTypeActions();
            return;
        }
        var (player, position) = PodiumQueue.Dequeue();
        var kitty = Globals.ALL_KITTIES[player].Unit;
        kitty.SetPosition(position.X, position.Y);
        kitty.SetFacing(270);
        kitty.IsPaused = true;
        MovedUnits.Add(kitty);
        Console.WriteLine($"{Colors.PlayerNameColored(player)}{Color} earned {PodiumUtil.PlacementString(PodiumQueue.Count + 1)} place for {PodiumType} with {GetStatBasedOnType(player).ToString("F2")}|r");
        Utility.SimpleTimer(5.0f, ProcessNextPodiumAction);
    }

    /// <summary>
    /// Topscore => Saves => Ratio => Streak .. End
    /// </summary>
    private static void ProcessPodiumTypeActions()
    {
        PodiumQueue.Clear();
        PodiumUtil.ClearPodiumUnits(MovedUnits);
        switch (PodiumType)
        {
            case "":
                break;
            case "Highest Score":
                break;
            case "Most Saves":
                EnqueueTopRatioPlayers();
                break;
            case "Highest Ratio":
                break;
            case "Highest Streak":
                Console.WriteLine($"{Color}Thanks to everyone for playing, much love <3|r");
                Gameover.NotifyEndingGame();
                return;
            default:
                break;
        }
        ProcessNextPodiumAction();
    }

    private static float GetStatBasedOnType(player player)
    {
        var stats = Globals.ALL_KITTIES[player].CurrentStats;
        switch (PodiumType)
        {
            case "Highest Score":
                return stats.TotalSaves - stats.TotalDeaths;
            case "Most Saves":
                return stats.TotalSaves;
            case "Highest Ratio":
                return stats.TotalDeaths == 0 ? stats.TotalSaves : (float)stats.TotalSaves / stats.TotalDeaths;
            case "Highest Streak":
                return stats.MaxSaveStreak;
            default:
                return 0;
        }
    }

}