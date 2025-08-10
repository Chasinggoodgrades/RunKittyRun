

class WolfLaneHider
{
    private static readonly HashSet<int> lanesToEnable = new HashSet<int>();
    private static readonly HashSet<int> currentlyVisibleLanes = new HashSet<int>();

    public static LanesHider()
    {
        try
        {
            UpdateLanesToEnable();
            ApplyLaneVisibility();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in WolfLaneHider: {e.Message}");
        }
    }

    private static UpdateLanesToEnable()
    {
        try
        {
            lanesToEnable.Clear();

            for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++)
            {
                let kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
                let currentSafezone: number = kitty.CurrentSafeZone;
                AddAdjacentLanes(currentSafezone);
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in UpdateLanesToEnable: {e.Message}");
        }
    }

    public static ShadowKittyLaneAdd(safezone: number)
    {
        AddAdjacentLanes(safezone);
        ApplyLaneVisibility();
    }

    private static AddAdjacentLanes(currentSafezone: number)
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

    private static AddLane(lane: number)
    {
        if (lane >= 0 && lane <= 17)
        {
            lanesToEnable.Add(lane);
        }
    }

    private static ApplyLaneVisibility()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            // Show lanes that are now visible but weren't before
            for (let laneId in lanesToEnable)
            {
                if (!(currentlyVisibleLanes.Contains(laneId) && lane = WolfArea.WolfAreas.TryGetValue(laneId)) /* TODO; Prepend: let */)
                {
                    lane.IsEnabled = true;
                    SetLaneVisibility(lane, true);
                }
            }

            // Hide lanes that are no longer visible
            for (let laneId in currentlyVisibleLanes)
            {
                if (!(lanesToEnable.Contains(laneId) && lane = WolfArea.WolfAreas.TryGetValue(laneId)) /* TODO; Prepend: let */)
                {
                    lane.IsEnabled = false;
                    SetLaneVisibility(lane, false);
                }
            }

            // Update the set for next time
            currentlyVisibleLanes.Clear();
            for (let laneId in lanesToEnable)
                currentlyVisibleLanes.Add(laneId);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ApplyLaneVisibility: {e.Message}");
        }
    }

    private static SetLaneVisibility(lane: WolfArea, isVisible: boolean)
    {
        for (let i: number = 0; i < lane.Wolves.Count; i++)
        {
            let wolf = lane.Wolves[i];
            wolf.Unit.IsVisible = isVisible;
            wolf.PauseSelf(!isVisible);
            wolf.Texttag?.SetVisibility(isVisible);
        }
    }

    public static HideAllLanes()
    {
        try
        {
            if (WolfArea.WolfAreas == null)
                return;

            for (let lane in WolfArea.WolfAreas)
            {
                SetLaneVisibility(lane.Value, false);
                lane.Value.IsEnabled = false;
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in HideAllLanes: {e.Message}");
        }
    }

    public static ResetLanes()
    {
        try
        {
            lanesToEnable.Clear();
            currentlyVisibleLanes.Clear();
            if (WolfArea.WolfAreas == null)
                return;
            for (let lane in WolfArea.WolfAreas)
            {
                lane.Value.IsEnabled = true;
                SetLaneVisibility(lane.Value, true);
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ResetLanes: {e.Message}");
        }
    }

}
