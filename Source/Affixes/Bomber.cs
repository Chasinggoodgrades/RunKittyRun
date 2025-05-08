using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Bomber : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_BOMBER; // replace with bomber ability in WE later after i make it.
    private const float EXPLOSION_RANGE = 250.0f;
    private static readonly Predicate<Affix> IsBomber = x => x is Bomber;

    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";

    private const float MIN_EXPLODE_INTERVAL = 10.0f;
    private const float MAX_EXPLODE_INTERVAL = 15.0f;
    private AchesTimers ExplodeTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private AchesTimers ReviveAlphaTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private group ExplodeGroup = group.Create();
    private int ReviveAlpha = 1;
    private RangeIndicator RangeIndicator = null;

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
            RangeIndicator?.Dispose();

            Unit.IsReviving = false;
            Unit.IsPaused = false;
        }
        catch (System.Exception e)
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
                ExplodeTimer.Timer.Start(ExplosionInterval(), false, (StartExplosion));
                return;
            }
            Unit.PauseSelf(true);
            RangeIndicator.CreateIndicator(Unit.Unit, EXPLOSION_RANGE, 20, "FINL"); // "FINL" is an orange indicator.
            Utility.SimpleTimer(1.0f, () => Utility.CreateSimpleTextTag("3...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0));
            Utility.SimpleTimer(2.0f, () => Utility.CreateSimpleTextTag("2...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0));
            Utility.SimpleTimer(3.0f, () => Utility.CreateSimpleTextTag("1...", 1.0f, Unit.Unit, 0.025f, 255, 0, 0));
            Utility.SimpleTimer(4.0f, Explode);
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Bomber.StartExplosion: {e.Message}");
        }
    }

    private void Explode()
    {
        try
        {
            RangeIndicator.DestroyIndicator();
            Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, Unit.Unit, "origin");
            ExplodeGroup.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, EXPLOSION_RANGE, FilterList.KittyFilter);

            while (true)
            {
                var u = ExplodeGroup.First;
                if (u == null) break;
                ExplodeGroup.Remove(u);

                if (!WolfArea.WolfAreas[Unit.RegionIndex].Rectangle.Contains(u.X, u.Y)) continue; // has to be in wolf lane.
                if (!Globals.ALL_KITTIES[u.Owner].Alive) continue; // ignore if they're dead lol
                Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, u, "origin");
                Globals.ALL_KITTIES[u.Owner].KillKitty();
            }
            Revive();
            Unit.Unit.SetVertexColor(204, 102, 0, 25);
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Bomber.Explode: {e.Message}");
            ReviveAlphaTimer.Pause();
            Unit.PauseSelf(false);
            Unit.IsReviving = false;
        }
    }

    private static float ExplosionInterval() => GetRandomReal(MIN_EXPLODE_INTERVAL, MAX_EXPLODE_INTERVAL);

    public static Bomber GetBomber(unit Unit)
    {
        var affix = Globals.ALL_WOLVES[Unit].Affixes.Find(IsBomber);
        return affix is Bomber bomber ? bomber : null;
    }

    private void Revive()
    {
        Unit.IsReviving = true;
        ReviveAlphaTimer.Timer.Start(1.0f, true, () =>
        {
            try
            {
                if (ReviveAlpha < 10)
                {
                    ReviveAlpha++;
                    Unit.Unit.SetVertexColor(204, 102, 0, 25 * ReviveAlpha);
                }
                else
                {
                    ReviveAlpha = 1;
                    ReviveAlphaTimer.Pause();
                    Unit.PauseSelf(false);
                    Unit.IsReviving = false;
                    ExplodeTimer.Timer.Start(ExplosionInterval(), false, StartExplosion);
                }
            }
            catch (System.Exception e)
            {
                Logger.Warning($"Error in Bomber.Revive: {e.Message}");
                ReviveAlphaTimer.Pause();
                Unit.PauseSelf(false);
                Unit.IsReviving = false;
            }
        });
    }
}
