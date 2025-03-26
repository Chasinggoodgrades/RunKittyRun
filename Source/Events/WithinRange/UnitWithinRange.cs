using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class UnitWithinRange
{
    private static bool RegisterUnitWithinRangeSuper(unit u, float range, bool cleanOnKilled, Func<bool> filter, trigger execution)
    {
        if (range <= 0)
        {
            return false;
        }

        TriggerRegisterUnitInRange(execution, u, range, Condition(filter));

        return true;
    }

    public static void DeRegisterUnitWithinRangeUnit(Kitty kitty)
    {
        kitty.w_Collision.ClearActions();
        kitty.c_Collision.ClearActions();
        kitty.w_Collision.Dispose();
        kitty.c_Collision.Dispose();
        kitty.w_Collision = null;
        kitty.c_Collision = null;
    }

    public static void DeRegisterUnitWithinRangeUnit(ShadowKitty kitty)
    {
        kitty.cCollision.ClearActions();
        kitty.wCollision.ClearActions();
        kitty.wCollision.Dispose();
        kitty.cCollision.Dispose();
        kitty.wCollision = null;
        kitty.cCollision = null;
    }

    public static bool RegisterUnitWithinRangeTrigger(unit u, float range, Func<bool> filter, trigger execution)
    {
        return RegisterUnitWithinRangeSuper(u, range, false, filter, execution);
    }
}
