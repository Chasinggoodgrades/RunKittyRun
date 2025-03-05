using WCSharp.Api;
using WCSharp.Shared.Extensions;

public class Bomber : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_CHAOS; // replace with bomber ability in WE later after i make it.
    private const float EXPLOSION_RANGE = 200.0f;
    //private const string EXPLOSION_PATH_EFFECT = "";
    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";
    private const float EXPLODE_INTERVAL = 15.0f;
    private timer ExplodeTimer = timer.Create();
    private timer ReviveAlphaTimer = timer.Create();
    private int ReviveAlpha = 1;

    public Bomber(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_ORANGE}Bomber|r";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.Unit.SetVertexColor(204, 102, 0);
        RegisterTimers();
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.Unit.SetVertexColor(150, 120, 255, 255);

        GC.RemoveTimer(ref ExplodeTimer);
        GC.RemoveTimer(ref ReviveAlphaTimer);
        base.Remove();
    }

    private void RegisterTimers()
    {
        ExplodeTimer.Start(EXPLODE_INTERVAL, false, StartExplosion);
    }

    private void StartExplosion()
    {
        // Temporary for testing, will add an actual graphic ticker later
        Unit.IsPaused = true;
        Unit.Unit.ClearOrders();
        Utility.SimpleTimer(1.0f, () => Utility.CreateSimpleTextTag("3...", 1.0f, Unit.Unit, 0.015f, 255, 0, 0));
        Utility.SimpleTimer(2.0f, () => Utility.CreateSimpleTextTag("2...", 1.0f, Unit.Unit, 0.015f, 255, 0, 0));
        Utility.SimpleTimer(3.0f, () => Utility.CreateSimpleTextTag("1...", 1.0f, Unit.Unit, 0.015f, 255, 0, 0));
        Utility.SimpleTimer(4.0f, () => Explode());
    }

    private void Explode()
    {
        Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, Unit.Unit, "origin");
        Globals.TempGroup.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, EXPLOSION_RANGE, Filters.KittyFilter);
        var list = Globals.TempGroup.ToList();
        foreach (unit u in list)
        {
            Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, u, "origin");
            Globals.ALL_KITTIES[u.Owner].KillKitty();
        }
        GC.RemoveList(ref list);
        Globals.TempGroup.Clear();
        Revive();
        Unit.Unit.SetVertexColor(204, 102, 0, 25);
    }

    private void Revive()
    {
        Unit.IsReviving = true;
        ReviveAlphaTimer.Start(1.0f, true, () =>
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
                Unit.IsPaused = false;
                Unit.IsReviving = false;
                ExplodeTimer.Start(EXPLODE_INTERVAL, false, StartExplosion);
            }
        });

    }





}