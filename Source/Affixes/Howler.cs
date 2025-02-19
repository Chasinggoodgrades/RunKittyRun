using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Howler : Affix
{
    private const float HOWL_RADIUS = 900.0f;
    private const int AFFIX_ABILITY = Constants.ABILITY_HOWLER;
    private const string ROAR_EFFECT = "Abilities\\Spells\\NightElf\\BattleRoar\\RoarCaster.mdl";
    private const float MIN_HOWL_TIME = 10.0f;
    private const float MAX_HOWL_TIME = 20.0f;
    private timer HowlTimer;
    private group NearbyWolves = group.Create();

    public Howler(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_BLUE}Howler|r";
    }

    public override void Apply()
    {
        RegisterTimerEvents();
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.Unit.SetVertexColor(25, 25, 112);
    }

    public override void Remove()
    {
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Utility.RemoveTimer(HowlTimer);
        NearbyWolves.Dispose();
        NearbyWolves = null;
    }

    private void RegisterTimerEvents()
    {
        HowlTimer = timer.Create();
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private void Howl()
    {
        Utility.CreateEffectAndDispose(ROAR_EFFECT, Unit.Unit, "origin");
        NearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, Filter(() => GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG));
        foreach (var wolf in NearbyWolves.ToList())
        {
            var wolfObject = Globals.ALL_WOLVES[wolf];
            if (wolfObject.RegionIndex != Unit.RegionIndex) continue;
            wolfObject.StartWandering(true);
        }
        NearbyWolves.Clear();
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private float GetRandomHowlTime()
    {
        return GetRandomReal(MIN_HOWL_TIME, MAX_HOWL_TIME);
    }

}