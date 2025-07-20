using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Bomber : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_BOMBER; // replace with bomber ability in WE later after i make it.
    private const float EXPLOSION_RANGE = 250.0f;
    private static readonly Predicate<Affix> IsBomber = x => x is Bomber;

    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";
    private static string RING_TIMER_INDICATOR = "war3mapImported\\RingProgress.mdx";

    private const float MIN_EXPLODE_INTERVAL = 10.0f;
    private const float MAX_EXPLODE_INTERVAL = 15.0f;
    private AchesTimers ExplodeTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private AchesTimers ReviveAlphaTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private group ExplodeGroup = group.Create();
    private int ReviveAlpha = 1;
    private RangeIndicator RangeIndicator = null;
    private effect TimerIndicator;

    public Bomber(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_ORANGE}Bomber|r";
    }

    public override void Apply()
    {
        try
        {
            Unit.Unit.AddAbility(AFFIX_ABILITY);
            Unit.Unit.SetVertexColor(204, 102, 0);
            RangeIndicator = ObjectPool.GetEmptyObject<RangeIndicator>();
            RegisterTimers();
            base.Apply();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Bomber.Apply: {e.Message}");
        }
    }

    public override void Remove()
    {
        try
        {
            Unit.Unit.RemoveAbility(AFFIX_ABILITY);
            Unit.Unit.SetVertexColor(150, 120, 255, 255);

            ExplodeTimer?.Dispose();
            ReviveAlphaTimer?.Dispose();
            ExplodeTimer = null; // These two timers are needed as it prevents the start explosion from continuing
            ReviveAlphaTimer = null;
            RangeIndicator?.Dispose();
            RangeIndicator = null;
            TimerIndicator?.Dispose();
            TimerIndicator = null;

            if (Unit.IsPaused) Unit?.PauseSelf(false);
            Unit.IsReviving = false;
            Unit.IsPaused = false;
        }
        catch (System.Exception)
        {
            base.Remove();
        }
    }

    private void RegisterTimers()
    {
        ExplodeTimer.Timer.Start(ExplosionInterval(), false, StartExplosion);
    }

    private void StartExplosion()
    {
        // Temporary for testing, will add an actual graphic ticker later
        try
        {
            if (Unit.IsPaused)
            {
                ExplodeTimer?.Timer.Start(ExplosionInterval(), false, StartExplosion);
                return;
            }
            if (RangeIndicator == null) return;
            if (Unit.Unit == null) return;
            Unit.PauseSelf(true);
            if (Unit.WolfArea.IsEnabled)
            {
                RangeIndicator.CreateIndicator(Unit.Unit, EXPLOSION_RANGE, 20, "FINL"); // "FINL" is an orange indicator.
                Utility.SimpleTimer(1.0f, () => Utility.CreateSimpleTextTag("3...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0)); // This approach needs to be changed into a class object or something.. This is garbage. 3 lambdas per timer too .. christ.
                Utility.SimpleTimer(2.0f, () => Utility.CreateSimpleTextTag("2...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0));
                Utility.SimpleTimer(3.0f, () => Utility.CreateSimpleTextTag("1...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0));
            }

            Utility.SimpleTimer(4.0f, Explode);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Bomber.StartExplosion: {e.Message}");
        }
    }

    private void Explode()
    {
        try
        {
            if (RangeIndicator == null) return;
            RangeIndicator.DestroyIndicator();
            Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, Unit.Unit, "origin");
            ExplodeGroup.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, EXPLOSION_RANGE, FilterList.KittyFilter);

            while (true)
            {
                var u = ExplodeGroup.First;
                if (u == null) break;
                ExplodeGroup.Remove(u);

                if (!Unit.WolfArea.Rectangle.Contains(u.X, u.Y)) continue; // has to be in wolf lane.
                if (!Globals.ALL_KITTIES[u.Owner].Alive) continue; // ignore if they're dead lol
                Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, u, "origin");
                Globals.ALL_KITTIES[u.Owner].KillKitty();
            }
            Revive();
            Unit.Unit.SetVertexColor(204, 102, 0, 25);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in Bomber.Explode: {e.Message}");
            ReviveAlphaTimer.Pause();
            Unit?.PauseSelf(false);
            Unit.IsReviving = false;
        }
    }

    private static float ExplosionInterval() => GetRandomReal(MIN_EXPLODE_INTERVAL, MAX_EXPLODE_INTERVAL);

    private void Revive()
    {
        Unit.IsReviving = true;
        if (Unit.WolfArea.IsEnabled)
        {
            TimerIndicator ??= effect.Create(RING_TIMER_INDICATOR, Unit.Unit.X, Unit.Unit.Y);
            TimerIndicator.SetTime(0);
            TimerIndicator.PlayAnimation(animtype.Birth);
            TimerIndicator.SetX(Unit.Unit.X);
            TimerIndicator.SetY(Unit.Unit.Y);
        }
        ReviveAlphaTimer?.Timer?.Start(1.0f, true, ReviveActions);
    }

    private void ReviveActions()
    {
        if (ReviveAlpha < 10)
        {
            ReviveAlpha++;
            Unit.Unit.SetVertexColor(204, 102, 0, 25);
        }
        else
        {
            ReviveAlpha = 1;
            ReviveAlphaTimer?.Pause();
            Unit.PauseSelf(false);
            Unit.IsReviving = false;
            TimerIndicator?.PlayAnimation(animtype.Death);
            Unit.Unit.SetVertexColor(204, 102, 0);
            ExplodeTimer?.Timer?.Start(ExplosionInterval(), false, StartExplosion);
        }
    }

    public override void Pause(bool pause)
    {
        // For now.. Bomber wolves cannot really be frozen once the explosion timer starts..
        // But in the future.. Need to move the explosion timers to be 1 timer instead of 4 Utility.SimpleTimers.
        RangeIndicator?.DestroyIndicator();
    }
}
