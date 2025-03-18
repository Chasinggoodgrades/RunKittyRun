using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// -- Periodic
/// -- Pulls Every 30 seconds
/// -- 500 Yd Range..
///
/// -- Have to figure out a way to simulate the gravity effect smoothly..
/// </summary>

public class Vortex : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_UNPREDICTABLE;
    private const float VORTEX_RADIUS = 500.0f; // triggers witihn 500 yds
    private const float VORTEX_PULL_SPEED = 40.0f; // pulls 2 yds per second.
    private const float VORTEX_PULSE_RATE = 0.4f; // every second.
    private const float VORTEX_PERIODIC_PULL = 30.0f; // every 30 seconds
    private const float VORTEX_LENGTH = 10.0f; // lasts 10 seconds.
    private trigger EntersRange = trigger.Create();
    private trigger LeavesRange = trigger.Create();
    private timer PullingInTimer = timer.Create();
    private timer PeriodicPull = timer.Create();
    private timer PullStart = timer.Create();
    private int Counter = 0;
    private List<unit> UnitsInRange = new List<unit>();

    public Vortex(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_PURPLE}Vortex|r";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        RegisterEvents();
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.Unit.SetVertexColor(150, 120, 255);

        GC.RemoveTimer(ref PullingInTimer);
        GC.RemoveTimer(ref PeriodicPull);
        GC.RemoveTimer(ref PullStart);
        GC.RemoveTrigger(ref EntersRange);
        GC.RemoveTrigger(ref LeavesRange);
        GC.RemoveList(ref UnitsInRange);
        base.Remove();
    }

    private void RegisterEvents()
    {
        EntersRange.RegisterUnitInRange(Unit.Unit, VORTEX_RADIUS, Filters.KittyFilter);
        EntersRange.AddAction(ErrorHandler.Wrap(EnterRegionActions));
        LeavesRange.RegisterUnitInRange(Unit.Unit, VORTEX_RADIUS, Filters.KittyFilter);

        PeriodicPull.Start(VORTEX_PERIODIC_PULL, true, ErrorHandler.Wrap(PullBegin));
    }

    private void EnterRegionActions()
    {
        var enteringUnit = @event.Unit;
        if (UnitsInRange.Contains(enteringUnit)) return;
        UnitsInRange.Add(enteringUnit);
    }

    private void LeavesRegionActions()
    {
        var leavingUnit = @event.Unit;
        if (!UnitsInRange.Contains(leavingUnit)) return;
        UnitsInRange.Remove(leavingUnit);
    }

    private void PullBegin()
    {
        PullStart.Start(VORTEX_PULSE_RATE, true, ErrorHandler.Wrap(PullActions));
        Unit.Unit.SetVertexColor(255, 0, 255);
    }

    private void PullActions()
    {
        if (Counter >= (int)(VORTEX_LENGTH / VORTEX_PULSE_RATE))
        {
            ResetVortex();
            return; // Exit early if the vortex is reset
        }
        var distance = VORTEX_PULL_SPEED * VORTEX_PULSE_RATE;
        foreach (var unit in UnitsInRange)
        {
            if (!unit.IsInRange(Unit.Unit, VORTEX_RADIUS)) continue;
            var x = unit.X;
            var y = unit.Y;
            var angle = WCSharp.Shared.Util.AngleBetweenPoints(Unit.Unit.X, Unit.Unit.Y, x, y);
            var newX = x + (distance * Cos(angle));
            var newY = y + (distance * Sin(angle));
            unit.SetPosition(newX, newY);
            unit.SetFacing(angle);
            //var lastOrder = UnitOrders.GetLastOrderLocation(unit);
            //unit.IssueOrder("move", lastOrder.x, lastOrder.y);
            // We can set position.. but we need to get the units last move order and issue that move order to that x, y immediately after to stimulate the gravity effect.
            // Setup @event system to acquire last x,y location of this unit.
        }
        Counter += 1;
    }

    private void ResetVortex()
    {
        PullStart.Pause();
        Counter = 0;
        Unit.Unit.SetVertexColor(150, 120, 255);
    }
}
