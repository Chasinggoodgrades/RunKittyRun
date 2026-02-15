using System;
using System.Collections.Generic;

public static class WolfLaneHider
{
    private const int MaxLaneIndex = 17;
    private static readonly List<int> lanesToEnable = new List<int>();
    private static readonly bool[] lanesToEnableLookup = new bool[MaxLaneIndex + 1];
    private static readonly bool[] currentlyVisibleLanesLookup = new bool[MaxLaneIndex + 1];

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
            Array.Clear(lanesToEnableLookup, 0, lanesToEnableLookup.Length);

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

    public static void ShadowKittyLaneAdd(int safezone)
    {
        AddAdjacentLanes(safezone);
        ApplyLaneVisibility();
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
        if (lane < 0 || lane > MaxLaneIndex)
            return;

        if (lanesToEnableLookup[lane])
            return;

        lanesToEnableLookup[lane] = true;
        lanesToEnable.Add(lane);
    }

    private static void ApplyLaneVisibility()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            var lanes = WolfArea.WolfAreas_List;

            for (int i = 0; i < lanes.Count; i++)
            {
                var lane = lanes[i];
                var laneId = lane.ID;
                var shouldBeVisible = laneId >= 0
                    && laneId <= MaxLaneIndex
                    && lanesToEnableLookup[laneId];
                var isVisible = laneId >= 0
                    && laneId <= MaxLaneIndex
                    && currentlyVisibleLanesLookup[laneId];

                if (shouldBeVisible && !isVisible)
                {
                    lane.IsEnabled = true;
                    SetLaneVisibility(lane, true);
                }
                else if (!shouldBeVisible && isVisible)
                {
                    lane.IsEnabled = false;
                    SetLaneVisibility(lane, false);
                }

                if (laneId >= 0 && laneId <= MaxLaneIndex)
                {
                    currentlyVisibleLanesLookup[laneId] = shouldBeVisible;
                }
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
            wolf.PauseSelf(!isVisible);
            wolf.Texttag?.SetVisibility(isVisible);
        }
    }

    public static void HideAllLanes()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            foreach (var lane in WolfArea.WolfAreas_List)
            {
                SetLaneVisibility(lane, false);
                lane.IsEnabled = false;
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in HideAllLanes: {e.Message}");
        }
    }

    public static void ResetLanes()
    {
        try
        {
            lanesToEnable.Clear();
            Array.Clear(lanesToEnableLookup, 0, lanesToEnableLookup.Length);
            Array.Clear(currentlyVisibleLanesLookup, 0, currentlyVisibleLanesLookup.Length);
            if (WolfArea.WolfAreas == null)
                return;
            foreach (var lane in WolfArea.WolfAreas_List)
            {
                lane.IsEnabled = true;
                SetLaneVisibility(lane, true);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ResetLanes: {e.Message}");
        }
    }

}
