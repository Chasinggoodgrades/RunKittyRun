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
