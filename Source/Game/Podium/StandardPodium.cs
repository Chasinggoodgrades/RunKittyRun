using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Data;

/// <summary>
/// Players are going to be rewarded
/// </summary>
public static class StandardPodium
{
    private static Queue<(player Player, Point position)> PodiumQueue = new Queue<(player Player, Point position)>();
    private static List<unit> MovedUnits = new List<unit>();
    private static string PodiumType = "";
    private static string Color = Colors.COLOR_YELLOW_ORANGE;
    private const string HighestScore = "highest score";
    private const string MostSaves = "most saves";
    private const string HighestRatio = "highest ratio";
    private const string HighestStreak = "highest streak";

    public static void BeginPodiumActions()
    {
        PodiumUtil.SetCameraToPodium();
        Utility.SimpleTimer(3.0f, ProcessPodiumTypeActions);
    }

    private static void EnqueueTopScorePlayers()
    {
        var topScores = PodiumUtil.SortPlayersByScore();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topScores.Count - 1; i >= 0; i--)
        {
            var player = topScores[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = HighestScore;
    }

    private static void EnqueueTopSavesPlayers()
    {
        var topSaves = PodiumUtil.SortPlayersBySaves();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topSaves.Count - 1; i >= 0; i--)
        {
            var player = topSaves[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = MostSaves;
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
        PodiumType = HighestRatio;
    }

    private static void EnqueueTopStreakPlayers()
    {
        var topStreaks = PodiumUtil.SortPlayersByHighestSaveStreak();
        var podiumPositions = PodiumManager.PodiumSpots;
        for (int i = topStreaks.Count - 1; i >= 0; i--)
        {
            var player = topStreaks[i];
            var position = podiumPositions[i];
            PodiumQueue.Enqueue((player, position));
        }
        PodiumType = HighestStreak;
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
        Console.WriteLine($"{Colors.PlayerNameColored(player)}{Color} earned {PodiumUtil.PlacementString(PodiumQueue.Count + 1)} place for {PodiumType} with {GetStatBasedOnType(player)}|r");
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
                EnqueueTopScorePlayers();
                break;

            case HighestScore:
                EnqueueTopSavesPlayers();
                break;

            case MostSaves:
                EnqueueTopRatioPlayers();
                break;

            case HighestRatio:
                EnqueueTopStreakPlayers();
                break;

            case HighestStreak:
                PodiumUtil.EndingGameThankyou();
                return;

            default:
                break;
        }
        ProcessNextPodiumAction();
    }

    private static string GetStatBasedOnType(player player)
    {
        var stats = Globals.ALL_KITTIES[player].CurrentStats;
        switch (PodiumType)
        {
            case HighestScore:
                return (stats.TotalSaves - stats.TotalDeaths).ToString();

            case MostSaves:
                return stats.TotalSaves.ToString();

            case HighestRatio:
                return stats.TotalDeaths == 0 ? stats.TotalSaves.ToString("F2") : ((float)stats.TotalSaves / stats.TotalDeaths).ToString("F2");

            case HighestStreak:
                return stats.MaxSaveStreak.ToString();

            default:
                return "n/a";
        }
    }
}
