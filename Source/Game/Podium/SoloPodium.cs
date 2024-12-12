using System.Collections.Generic;
using WCSharp.Shared.Data;
using WCSharp.Api;
using System;

public static class SoloPodium
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
        PodiumType = "Time";
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
        PodiumType = "Progress";
    }

    private static void ProcessNextPodiumAction()
    {
        if (PodiumQueue.Count == 0)
        {
            PodiumUtil.EndingGameThankyou();
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


    private static void ProcessPodiumTypeActions()
    {
        PodiumQueue.Clear();
        PodiumUtil.ClearPodiumUnits(MovedUnits);
        switch (Gamemode.CurrentGameModeType)
        {
            case "Race":
                EnqueueTopPlayerTimes();
                break;
            case "Progression":
                EnqueueTopPlayerProgress();
                break;
        }
        ProcessNextPodiumAction();
    }

    private static string GetStatBasedOnType(player player)
    {
        var stats = Globals.ALL_KITTIES[player].TimeProg;
        switch (PodiumType)
        {
            case "Time":
                return stats.GetTotalTimeFormatted();
            case "Progress":
                return stats.GetOverallProgress().ToString("F2") + "%";
            default:
                return "n/a";
        }
    }

}