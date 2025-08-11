/// <summary>
/// -- Periodic
/// -- Pulls Every 30 seconds
/// -- 500 Yd Range..
///
/// -- Have to figure out a way to simulate the gravity effect smoothly..
/// </summary>

class Vortex extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_UNPREDICTABLE
    private VORTEX_RADIUS: number = 500.0 // triggers witihn 500 yds
    private VORTEX_PULL_SPEED: number = 40.0 // pulls 2 yds per second.
    private VORTEX_PULSE_RATE: number = 0.4 // every second.
    private VORTEX_PERIODIC_PULL: number = 30.0 // every 30 seconds
    private VORTEX_LENGTH: number = 10.0 // lasts 10 seconds.
    private EntersRange: trigger = CreateTrigger()
    private LeavesRange: trigger = CreateTrigger()
    private PullingInTimer: timer = timer.Create()
    private PeriodicPull: timer = timer.Create()
    private PullStart: timer = timer.Create()
    private Counter: number = 0
    private UnitsInRange: unit[] = []

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_PURPLE}Vortex|r'
    }

    public override Apply() {
        Unit.Unit.AddAbility(AFFIX_ABILITY)
        RegisterEvents()
        base.Apply()
    }

    public override Remove() {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY)
        Unit.Unit.SetVertexColor(150, 120, 255)

        GC.RemoveTimer(PullingInTimer) // TODO; Cleanup:         GC.RemoveTimer(ref PullingInTimer);
        GC.RemoveTimer(PeriodicPull) // TODO; Cleanup:         GC.RemoveTimer(ref PeriodicPull);
        GC.RemoveTimer(PullStart) // TODO; Cleanup:         GC.RemoveTimer(ref PullStart);
        GC.RemoveTrigger(EntersRange) // TODO; Cleanup:         GC.RemoveTrigger(ref EntersRange);
        GC.RemoveTrigger(LeavesRange) // TODO; Cleanup:         GC.RemoveTrigger(ref LeavesRange);
        GC.RemoveList(UnitsInRange) // TODO; Cleanup:         GC.RemoveList(ref UnitsInRange);
        base.Remove()
    }

    public override Pause(pause: boolean) {}

    private RegisterEvents() {
        EntersRange.RegisterUnitInRange(Unit.Unit, VORTEX_RADIUS, FilterList.KittyFilter)
        EntersRange.AddAction(EnterRegionActions)
        LeavesRange.RegisterUnitInRange(Unit.Unit, VORTEX_RADIUS, FilterList.KittyFilter)

        PeriodicPull.Start(VORTEX_PERIODIC_PULL, true, ErrorHandler.Wrap(PullBegin))
    }

    private EnterRegionActions() {
        let enteringUnit = GetTriggerUnit()
        if (UnitsInRange.Contains(enteringUnit)) return
        UnitsInRange.Add(enteringUnit)
    }

    private LeavesRegionActions() {
        let leavingUnit = GetTriggerUnit()
        if (!UnitsInRange.Contains(leavingUnit)) return
        UnitsInRange.Remove(leavingUnit)
    }

    private PullBegin() {
        PullStart.Start(VORTEX_PULSE_RATE, true, ErrorHandler.Wrap(PullActions))
        Unit.Unit.SetVertexColor(255, 0, 255)
    }

    private PullActions() {
        if (Counter >= VORTEX_LENGTH / VORTEX_PULSE_RATE) {
            ResetVortex()
            return // Exit early if the vortex is reset
        }
        let distance = VORTEX_PULL_SPEED * VORTEX_PULSE_RATE
        for (let unit in UnitsInRange) {
            if (!unit.IsInRange(Unit.Unit, VORTEX_RADIUS)) continue
            let x = GetUnitX(unit)
            let y = GetUnitY(unit)
            let angle = WCSharp.Shared.Util.AngleBetweenPoints(Unit.Unit.X, Unit.GetUnitY(unit), x, y)
            let newX = x + distance * Cos(angle)
            let newY = y + distance * Sin(angle)
            unit.SetPosition(newX, newY)
            unit.SetFacing(angle)
            //let lastOrder = UnitOrders.GetLastOrderLocation(unit);
            //unit.IssueOrder("move", lastOrder.x, lastOrder.y);
            // We can set position.. but we need to get the units last move order and issue that move order to that x, y immediately after to stimulate the gravity effect.
            // Setup event system to acquire last x,y location of this unit.
        }
        Counter += 1
    }

    private ResetVortex() {
        PullStart.Pause()
        Counter = 0
        Unit.Unit.SetVertexColor(150, 120, 255)
    }
}
