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
        base.Apply();
    }

    public override void Remove()
    {
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        GC.RemoveTimer(ref HowlTimer);
        GC.RemoveGroup(ref NearbyWolves);
        base.Remove();
    }

    private void RegisterTimerEvents()
    {
        HowlTimer = timer.Create();
        HowlTimer.Start(GetRandomHowlTime(), false, Howl);
    }

    private void Howl()
    {
        try
        {
            HowlTimer.Start(GetRandomHowlTime(), false, Howl);
            if (Unit.IsPaused) return;
            Utility.CreateEffectAndDispose(ROAR_EFFECT, Unit.Unit, "origin");
            NearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, Filters.DogFilter);
            var list = NearbyWolves.ToList();
            foreach (var wolf in list)
            {
                if (!Globals.ALL_WOLVES.TryGetValue(wolf, out var wolfObject)) continue;
                if (wolfObject.RegionIndex != Unit.RegionIndex) continue;
                wolfObject.StartWandering(true);
            }
            NearbyWolves.Clear();
            GC.RemoveList(ref list);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Howl: {e.Message}");
            throw;
        }
    }

    private float GetRandomHowlTime()
    {
        return GetRandomReal(MIN_HOWL_TIME, MAX_HOWL_TIME);
    }

}