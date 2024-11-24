using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Howler : Affix
{
    private static float HOWL_RADIUS = 900.0f;
    private timer HowlTimer;
    public Howler(Wolf unit) : base(unit)
    {}

    public override void Apply()
    {
        RegisterTimerEvents();
        Unit.Unit.SetVertexColor(25, 25, 112);
    }

    public override void Remove()
    {
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        HowlTimer.Pause();
        HowlTimer.Dispose();
    }

    private void RegisterTimerEvents()
    {
        HowlTimer = timer.Create();
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private void Howl()
    {
        var nearbyWolves = group.Create();
        nearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG));
        Console.WriteLine("Wolf howl begin");
        foreach (var wolf in nearbyWolves.ToList())
        {
            var wolfObject = Globals.ALL_WOLVES[wolf];
            if (wolfObject.RegionIndex != Unit.RegionIndex) continue;
            wolfObject.WolfMove();
        }
        nearbyWolves.Dispose();
        nearbyWolves = null;
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private float GetRandomHowlTime()
    {
        return GetRandomReal(25.0f, 65.0f);
    }

}