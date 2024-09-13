using WCSharp.Api;
using static WCSharp.Api.Common;
using System;
public static class FinalSafezone
{
    private static trigger Trigger = CreateTrigger();
    private static region Region = RegionList.SafeZones[RegionList.SafeZones.Length-1].Region;
    public static void Initialize()
    {
        RegisterEvents();
    }

    private static void RegisterEvents()
    {
        Trigger.RegisterEnterRegion(Region, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        Trigger.AddAction(() =>
        {
            Nitros.CompletedNitro(GetTriggerUnit());
        });
    }
}