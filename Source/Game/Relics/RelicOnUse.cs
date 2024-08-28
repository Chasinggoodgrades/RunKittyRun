using Source;
using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public static class RelicOnUse
{
    private static float FROSTBITE_RING_RADIUS = 400.0f;
    private const string FROSTBITE_RING_EFFECT = "Abilities\\Spells\\Undead\\FreezingBreath\\FreezingBreathTargetArt.mdl";
    private static float FROSTBITE_FREEZE_DURATION = 5.0f;
    private static float SHADOW_KITTY_SUMMON_DURATION = 75.0f;
    private static float SUMMONING_RING_RADIUS = 300.0f;
    private static bool WolvesFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG;
    private static bool KittyFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY;
    private static bool CircleFilter() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE;

    #region Frostbite Ring
    public static void FrostbiteRing(location freezeLocation)
    {
        Console.WriteLine("Frostbite");
        var tempGroup = CreateGroup();
        GroupEnumUnitsInRange(tempGroup, GetLocationX(freezeLocation), GetLocationY(freezeLocation), FROSTBITE_RING_RADIUS, Filter(() => WolvesFilter()));
        foreach (var unit in tempGroup.ToList())
            FrostbiteEffect(unit);
        freezeLocation.Dispose();
        tempGroup.Dispose();
    }

    private static void FrostbiteEffect(unit Unit)
    {
        var timer = CreateTimer();
        Unit.SetPausedEx(true);
        var effect = AddSpecialEffectTarget(FROSTBITE_RING_EFFECT, Unit, "origin");
        TimerStart(timer, FROSTBITE_FREEZE_DURATION, false, () =>
        {
            Unit.SetPausedEx(false);
            effect.Dispose();
            timer.Dispose();
        });
    }

    #endregion

    #region Ring of Summoning
    public static void SacredRingOfSummoning(player Player, location targetedPoint)
    {
        // select all people within targeted point
        var tempGroup = CreateGroup();
        var summoningKitty = Globals.ALL_KITTIES[Player];
        var summoningKittyUnit = summoningKitty.Unit;
        GroupEnumUnitsInRange(tempGroup, GetLocationX(targetedPoint), GetLocationY(targetedPoint), SUMMONING_RING_RADIUS, Filter(() => CircleFilter() || KittyFilter()));
        foreach (var unit in tempGroup.ToList())
        {
            // TO DO... Do a check on safezone stuff.
            var kitty = Globals.ALL_KITTIES[GetOwningPlayer(unit)];
            kitty.Unit.SetPosition(summoningKittyUnit.X, summoningKittyUnit.Y);
            kitty.ReviveKitty(summoningKitty);
        }

        tempGroup.Dispose();
        targetedPoint.Dispose();
    }
    #endregion

    #region Fang of Shadows
    public static void FangOfShadows(player Player)
    {
        Console.WriteLine("Fang of Shadows");
        var sk = ShadowKitty.ALL_SHADOWKITTIES[Player];
        sk.SummonShadowKitty();
        Utility.SimpleTimer(SHADOW_KITTY_SUMMON_DURATION, () => sk.KillShadowKitty());
    }
    #endregion



}