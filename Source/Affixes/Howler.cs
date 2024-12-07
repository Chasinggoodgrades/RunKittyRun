using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Howler : Affix
{
    private const float HOWL_RADIUS = 900.0f;
    private const int AFFIX_ABILITY = Constants.ABILITY_HOWLER;
    private const string ROAR_EFFECT = "Abilities\\Spells\\NightElf\\BattleRoar\\RoarCaster.mdl";
    private timer HowlTimer;
    public Howler(Wolf unit) : base(unit)
    {}

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
        var roarEffect = effect.Create(ROAR_EFFECT, Unit.Unit, "origin");
        nearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG));
        foreach (var wolf in nearbyWolves.ToList())
        {
            var wolfObject = Globals.ALL_WOLVES[wolf];
            if (wolfObject.RegionIndex != Unit.RegionIndex) continue;
            wolfObject.StartWandering(true);
        }
        nearbyWolves.Clear();
        nearbyWolves.Dispose();
        nearbyWolves = null;
        roarEffect.Dispose();
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private float GetRandomHowlTime()
    {
        return GetRandomReal(25.0f, 65.0f);
    }

}