using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;

/// <summary>
/// Halloween's terrain override: instead of a different safezone tile, every safezone
/// gets traced with a square lightning outline - four bolts, corner to corner, floating
/// just above the ground. Wired into SeasonTheme.OnActivate / OnDeactivate over in
/// SeasonThemeRegistry, so TerrainChanger never needs to know this exists - it just
/// runs whatever hooks the active theme happens to provide.
/// </summary>
public static class SafezoneLightningEffect
{
    // Lightning effect id - swap for whichever built-in bolt looks best in-game.
    // A few common ones: "DRAL" (sickly red-purple drain), "DRAM" (blue drain),
    // "CLPB" (chain lightning), "FORK" (forked bolt).
    private const string LightningCodeType = "DRAL";

    private static readonly List<lightning> ActiveBolts = new List<lightning>();

    /// <summary>Spawns the lightning ring around every safezone. Safe to call more than
    /// once - it's a no-op if the bolts are already up.</summary>
    public static void Activate()
    {
        if (ActiveBolts.Count > 0) return;

        for (var i = 0; i < RegionList.SafeZones.Length; i++)
        {
            RingRectangle(RegionList.SafeZones[i]);
        }
    }

    /// <summary>Destroys every bolt spawned by Activate(). Safe to call even if
    /// nothing is currently up.</summary>
    public static void Deactivate()
    {
        for (var i = 0; i < ActiveBolts.Count; i++)
        {
            DestroyLightning(ActiveBolts[i]);
        }
        ActiveBolts.Clear();
    }

    private static void RingRectangle(Rectangle rect)
    {
        var zone = rect.Rect;

        var minX = zone.MinX;
        var minY = zone.MinY;
        var maxX = zone.MaxX;
        var maxY = zone.MaxY;

        SpawnEdge(minX, minY, maxX, minY); // bottom
        SpawnEdge(maxX, minY, maxX, maxY); // right
        SpawnEdge(maxX, maxY, minX, maxY); // top
        SpawnEdge(minX, maxY, minX, minY); // left
    }

    private static void SpawnEdge(float x1, float y1, float x2, float y2)
    {
        var bolt = AddLightning(LightningCodeType, true, x1, y1, x2, y2);
        if (bolt != null)
        {
            ActiveBolts.Add(bolt);
        }
    }
}
