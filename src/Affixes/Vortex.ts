/// <summary>
/// -- Periodic
/// -- Pulls Every 30 seconds
/// -- 500 Yd Range..
///
/// -- Have to figure out a way to simulate the gravity effect smoothly..
/// </summary>

export class Vortex extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_UNPREDICTABLE
    private VORTEX_RADIUS: number = 500.0 // triggers witihn 500 yds
    private VORTEX_PULL_SPEED: number = 40.0 // pulls 2 yds per second.
    private VORTEX_PULSE_RATE: number = 0.4 // every second.
    private VORTEX_PERIODIC_PULL: number = 30.0 // every 30 seconds
    private VORTEX_LENGTH: number = 10.0 // lasts 10 seconds.
    private EntersRange: Trigger = Trigger.create()!
    private LeavesRange: Trigger = Trigger.create()!
    private PullingInTimer = Timer.create()
    private PeriodicPull = Timer.create()
    private PullStart = Timer.create()
    private Counter: number = 0
    private UnitsInRange: Unit[] = []

    public constructor(unit: Wolf) {
        super(unit)
        name = '{Colors.COLOR_PURPLE}Vortex|r'
    }

    public override Apply() {
        this.Unit.Unit.addAbility(this.AFFIX_ABILITY)
        RegisterEvents()
        super.Apply()
    }

    public override Remove() {
        this.Unit.Unit.removeAbility(this.AFFIX_ABILITY)
        Unit.Unit.setVertexColor(150, 120, 255, 255)

        GC.RemoveTimer(PullingInTimer) // TODO; Cleanup:         GC.RemoveTimer(ref PullingInTimer);
        GC.RemoveTimer(PeriodicPull) // TODO; Cleanup:         GC.RemoveTimer(ref PeriodicPull);
        GC.RemoveTimer(PullStart) // TODO; Cleanup:         GC.RemoveTimer(ref PullStart);
        GC.RemoveTrigger(EntersRange) // TODO; Cleanup:         GC.RemoveTrigger(ref EntersRange);
        GC.RemoveTrigger(LeavesRange) // TODO; Cleanup:         GC.RemoveTrigger(ref LeavesRange);
        GC.RemoveList(UnitsInRange) // TODO; Cleanup:         GC.RemoveList(ref UnitsInRange);
        super.Remove()
    }

    public override Pause(pause: boolean) {}

    private RegisterEvents() {
        EntersRange.registerUnitInRage(Unit.Unit, VORTEX_RADIUS, FilterList.KittyFilter)
        EntersRange.addAction(EnterRegionActions)
        LeavesRange.registerUnitInRage(Unit.Unit, VORTEX_RADIUS, FilterList.KittyFilter)

        PeriodicPull.start(VORTEX_PERIODIC_PULL, true, ErrorHandler.Wrap(PullBegin))
    }

    private EnterRegionActions() {
        let enteringUnit = getTriggerUnit()
        if (UnitsInRange.includes(enteringUnit)) return
        UnitsInRange.push(enteringUnit)
    }

    private LeavesRegionActions() {
        let leavingUnit = getTriggerUnit()
        if (!UnitsInRange.includes(leavingUnit)) return
        UnitsInRange.Remove(leavingUnit)
    }

    private PullBegin() {
        PullStart.start(VORTEX_PULSE_RATE, true, ErrorHandler.Wrap(PullActions))
        Unit.Unit.setVertexColor(255, 0, 255, 255)
    }

    private PullActions() {
        if (Counter >= VORTEX_LENGTH / VORTEX_PULSE_RATE) {
            ResetVortex()
            return // Exit early if the vortex is reset
        }
        let distance = VORTEX_PULL_SPEED * VORTEX_PULSE_RATE
        for (let unit in UnitsInRange) {
            if (!unit.IsInRange(Unit.Unit, VORTEX_RADIUS)) continue
            let x = unit.x
            let y = unit.y
            let angle = WCSharp.Shared.Util.AngleBetweenPoints(Unit.Unit.x, Unit.unit.y, x, y)
            let newX = x + distance * Cos(angle)
            let newY = y + distance * Sin(angle)
            unit.setPos(newX, newY)
            unit.setFacingEx(angle)
            //let lastOrder = UnitOrders.GetLastOrderLocation(unit);
            //unit.IssueOrder("move", lastOrder.x, lastOrder.y);
            // We can set position.. but we need to get the units last move order and issue that move order to that x, y immediately after to stimulate the gravity effect.
            // Setup event system to acquire last x,y location of this unit.
        }
        Counter += 1
    }

    private ResetVortex() {
        PullStart.pause()
        Counter = 0
        Unit.Unit.setVertexColor(150, 120, 255, 255)
    }
}
