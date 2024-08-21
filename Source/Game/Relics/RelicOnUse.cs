using Source;
using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public static class RelicOnUse
{
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    public static void FrostbiteRing(location freezeLocation)
    {
        Console.WriteLine("Frostbite");
        // Group all units in 400 range of location
        var tempGroup = CreateGroup();
        GroupEnumUnitsInRange(tempGroup, GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, Filter(() => WolvesFilter()));
        var unitsInRange = tempGroup.ToList();
        foreach (var unit in unitsInRange)
        {
            // Apply Frostbite
        }

        freezeLocation.Dispose();
        tempGroup.Dispose();
    }

    private static bool WolvesFilter()
    {
        return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;
    }

    private static bool KittyFilter()
    {
        return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY
        || GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_ASTRAL_KITTY
        || GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_ANCIENT_KITTY
        || GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_HIGHELF_KITTY
        || GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_SATYR_KITTY
        || GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_UNDEAD_KITTY;
    }

}