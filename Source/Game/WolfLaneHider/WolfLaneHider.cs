using System;
using System.Collections.Generic;

public static class WolfLaneHider
{
    private static readonly HashSet<int> lanesToEnable = new HashSet<int>();

    public static void LanesHider()
    {
        try
        {
            UpdateLanesToEnable();
            ApplyLaneVisibility();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in WolfLaneHider: {e.Message}");
        }
    }

    private static void UpdateLanesToEnable()
    {
        try
        {
            lanesToEnable.Clear();

            for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
            {
                var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
                int currentSafezone = kitty.CurrentSafeZone;
                AddAdjacentLanes(currentSafezone);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in UpdateLanesToEnable: {e.Message}");
        }
    }

    private static void AddAdjacentLanes(int currentSafezone)
    {
        AddLane(currentSafezone);
        AddLane(currentSafezone + 1);
        AddLane(currentSafezone - 1);
        AddLane(currentSafezone - 2);

        if (currentSafezone >= 13)
        {
            AddLane(currentSafezone + 2);
            AddLane(currentSafezone + 3);
        }
    }

    private static void AddLane(int lane)
    {
        if (lane >= 0 && lane <= 17)
        {
            lanesToEnable.Add(lane);
        }
    }

    private static void ApplyLaneVisibility()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            foreach (var lane in WolfArea.WolfAreas)
            {
                bool shouldShow = lanesToEnable.Contains(lane.Key);
                lane.Value.IsEnabled = shouldShow; // wasnt being set lmao
                SetLaneVisibility(lane.Value, shouldShow);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ApplyLaneVisibility: {e.Message}");
        }
    }

    private static void SetLaneVisibility(WolfArea lane, bool isVisible)
    {
        for (int i = 0; i < lane.Wolves.Count; i++)
        {
            var wolf = lane.Wolves[i];
            wolf.Unit.IsVisible = isVisible;
            wolf.IsPaused = !isVisible;
            wolf.Texttag?.SetVisibility(isVisible);
        }
    }

    public static void HideAllLanes()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            foreach (var lane in WolfArea.WolfAreas)
            {
                SetLaneVisibility(lane.Value, false);
                lane.Value.IsEnabled = false;
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in HideAllLanes: {e.Message}");
        }
    }
}
