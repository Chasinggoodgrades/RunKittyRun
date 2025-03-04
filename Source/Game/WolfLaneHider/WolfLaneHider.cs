using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class WolfLaneHider
{
    public static List<int> LanesToEnable { get; set; } = new List<int>();
    public static List<unit> Units { get; set; } = new List<unit>();
    public static void LanesHider()
    {
        try
        {
            DetectLanesToEnable();
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
                if (currentSafezone >= 13)
                {
                    AddLaneIfNotInList(currentSafezone + 2);
                    AddLaneIfNotInList(currentSafezone + 3);
                }
            }

            ShowDetectedLanes();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in DetectLanesToEnable: {e.Message}");
        }
    }

    private static void AddLaneIfNotInList(int lane)
    {
        if (lane >= 0 && !LanesToEnable.Contains(lane) && lane <= 17)
        {
            LanesToEnable.Add(lane);
        }
    }

    public static void HideAllLanes()
    {
        foreach (var wolf in Globals.ALL_WOLVES)
        {
            ShowUnit(wolf.Value.Unit, false);
        }
        foreach (var wolfArea in WolfArea.WolfAreas)
        {
            wolfArea.Value.IsEnabled = false;
        }
    }

    private static void ShowDetectedLanes()
    {
        try
        {
            foreach (var lane in LanesToEnable)
            {
                foreach (var wolf in Globals.ALL_WOLVES)
                {
                    if (wolf.Value.RegionIndex == lane)
                    {
                        Units.Add(wolf.Value.Unit);
                    }
                }
            }
            Logger.Verbose($"Showing {Units.Count} wolves in detected lanes");
            foreach (var unit in Units)
                ShowUnit(unit, true);

            Units.Clear();
            HideUndetectedLanes();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ShowDetectedLanes: {e.Message}");
        }
    }

    private static void HideUndetectedLanes()
    {
        try
        {
            foreach (var wolf in Globals.ALL_WOLVES)
            {
                if (!LanesToEnable.Contains(wolf.Value.RegionIndex))
                {
                    Units.Add(wolf.Value.Unit);
                }
            }
            Logger.Verbose($"Hiding {Units.Count} wolves in undetected lanes");
            foreach (var unit in Units)
                ShowUnit(unit, false);
            Units.Clear();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in HideUndetectedLanes: {e.Message}");
        }
    }
}
