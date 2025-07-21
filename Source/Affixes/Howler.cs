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
    private AchesTimers HowlTimer;
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
        HowlTimer?.Dispose();
        GC.RemoveGroup(ref NearbyWolves);
        base.Remove();
    }

    public override void Pause(bool pause)
    {
        HowlTimer.Pause(pause);
    }

    private void RegisterTimerEvents()
    {
        HowlTimer = ObjectPool<AchesTimers>.GetEmptyObject();
        HowlTimer.Timer.Start(GetRandomHowlTime(), false, Howl);
    }

    private void Howl()
    {
        try
        {
            HowlTimer.Timer.Start(GetRandomHowlTime(), false, Howl);
            if (Unit.IsPaused) return;
            Utility.CreateEffectAndDispose(ROAR_EFFECT, Unit.Unit, "origin");
            NearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, FilterList.DogFilter);
            while (true)
            {
                var wolf = NearbyWolves.First;
                if (wolf == null) break;
                NearbyWolves.Remove(wolf);
                if (NamedWolves.StanWolf != null && NamedWolves.StanWolf.Unit == wolf) continue;
                if (wolf.IsPaused) continue;
                if (!Globals.ALL_WOLVES.TryGetValue(wolf, out var wolfObject)) continue;
                if (wolfObject.RegionIndex != Unit.RegionIndex) continue;
                wolfObject.StartWandering(true); // Start wandering
            }
            NearbyWolves.Clear();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Howl: {e.Message}");
            throw;
        }
    }

    private static float GetRandomHowlTime() => GetRandomReal(MIN_HOWL_TIME, MAX_HOWL_TIME);
}
