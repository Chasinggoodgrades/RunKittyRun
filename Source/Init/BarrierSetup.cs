using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class BarrierSetup
{
    private static int BARRIERID = FourCC("YTpb"); // changed to call native only once
    private static bool BarrierActive { get; set; }
    private static unit DummyUnitOne;
    private static unit DummyUnitTwo;
    private static unit DummyUnitThree;
    public static List<destructable> destructables = new();

    /// <summary>How close to the line of blockers the centre of a unit can get: half their thickness plus the unit's own collision.</summary>
    private const float WALL_HALF_WIDTH = 48f;

    /// <summary>How far past the first and the last blocker the wall still holds a unit back.</summary>
    private const float WALL_END_MARGIN = 48f;

    private static float wallX;
    private static float wallMinY;
    private static float wallMaxY;

    /// <summary>
    /// Whether the barrier stops something standing at that point. The blockers are destructables,
    /// which IsTerrainPathable knows nothing about, so anything moved by hand rather than by the
    /// engine (the async stand-in effect) asks here to be held to the same wall as the unit.
    /// </summary>
    public static bool IsBlocked(float x, float y)
    {
        return BarrierActive
            && x > wallX - WALL_HALF_WIDTH && x < wallX + WALL_HALF_WIDTH
            && y > wallMinY && y < wallMaxY;
    }

    public static void Initialize()
    {
        ActivateBarrier();
    }

    private static void CreateDummyUnits()
    {
        var neutralPassive = player.NeutralPassive;
        DummyUnitOne = unit.Create(neutralPassive, Constants.UNIT_DUMMY_1, Regions.Dummy1Region.Center.X, Regions.Dummy1Region.Center.Y, 360);
        DummyUnitTwo = unit.Create(neutralPassive, Constants.UNIT_DUMMY_2, Regions.Dummy2Region.Center.X, Regions.Dummy2Region.Center.Y, 360);
        DummyUnitThree = unit.Create(neutralPassive, Constants.UNIT_DUMMY_3, Regions.Dummy3Region.Center.X, Regions.Dummy3Region.Center.Y, 360);
    }

    private static void CreateBarrier()
    {
        var barrierRegion = Regions.BarrierRegion;
        var centerX = barrierRegion.Center.X;
        var minY = barrierRegion.Rect.MinY;
        var maxY = barrierRegion.Rect.MaxY;

        float distanceY = maxY - minY;
        float intervalY = distanceY / 13;

        wallX = centerX;
        wallMinY = minY + intervalY - WALL_END_MARGIN;
        wallMaxY = minY + (12 * intervalY) + WALL_END_MARGIN;
        for (int i = 1; i < 13; i++)
        {
            float currentY = minY + (i * intervalY);
            var des = destructable.Create(BARRIERID, centerX, currentY);
            destructables.Add(des);
        }
    }

    public static void ActivateBarrier()
    {
        if (BarrierActive) return;
        CreateDummyUnits();
        CreateBarrier();
        BarrierActive = true;
    }

    public static void DeactivateBarrier()
    {
        if (!BarrierActive) return;
        DummyUnitOne.Dispose();
        DummyUnitTwo.Dispose();
        DummyUnitThree.Dispose();
        foreach (var des in destructables)
        {
            des.Dispose();
        }
        destructables.Clear();
        BarrierActive = false;
    }
}
