using System;
using System.Collections.Generic;

public static class WolfLaneHider
{
    public static HashSet<int> LanesToEnable { get; set; } = new HashSet<int>();

    public static void LanesHider()
    {
        try
        {
            DetectLanesToEnable();
            ShowAndHideLanes();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in WolfLaneHider: {e.Message}");
        }
    }

    private static void DetectLanesToEnable()
    {
        try
        {
            LanesToEnable.Clear();

            foreach (var player in Globals.PLAYERS_CURRENT_SAFEZONE)
            {
                int currentSafezone = player.Value;
                AddLaneIfNotInList(currentSafezone);
                AddLaneIfNotInList(currentSafezone + 1);
                AddLaneIfNotInList(currentSafezone - 1);
                AddLaneIfNotInList(currentSafezone - 2);
                if (currentSafezone >= 13)
                {
                    AddLaneIfNotInList(currentSafezone + 2);
                    AddLaneIfNotInList(currentSafezone + 3);
                }
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in DetectLanesToEnable: {e.Message}");
        }
    }

    private static void AddLaneIfNotInList(int lane)
    {
        if (lane >= 0 && lane <= 17)
        {
            _ = LanesToEnable.Add(lane);
        }
    }

    private static void ShowAndHideLanes()
    {
        try
        {
            foreach (var lane in WolfArea.WolfAreas)
            {
                bool shouldShow = LanesToEnable.Contains(lane.Key);
                foreach (var wolf in lane.Value.Wolves)
                {
                    wolf.Unit.IsVisible = shouldShow;
                    wolf.IsPaused = !shouldShow;
                }
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ShowAndHideLanes: {e.Message}");
        }
    }

    public static void HideAllLanes()
    {
        foreach (var lane in WolfArea.WolfAreas)
        {
            foreach (var wolf in lane.Value.Wolves)
            {
                wolf.Unit.IsVisible = false;
                wolf.IsPaused = true;
            }
            lane.Value.IsEnabled = false;
        }
    }
}
