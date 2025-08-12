export class Fixation extends Affix {
    private FIXATION_RADIUS: number = 500.0
    private FIXATION_MS: number = 325.0
    private FIXATION_MAX_MS: number = 410.0
    private FIXATION_TARGET_EFFECT: string = 'Abilities\\Spells\\Undead\\DeathCoil\\DeathCoilMissile.mdl'

    private static readonly IsFixation = (r: Affix): r is Fixation => {
        return r instanceof Fixation
    }

    private AFFIX_ABILITY: number = Constants.ABILITY_FIXATION
    private InRangeTrigger: trigger
    private PeriodicSpeed: trigger
    private ChaseTimer: AchesTimers
    private UnitsInRange: group
    private Target: Unit
    private Type: number
    private IsChasing: boolean = false
    private TargetEffect: effect

    public constructor(unit: Wolf) {
        super(unit)
        InRangeTrigger ??= CreateTrigger()
        PeriodicSpeed ??= CreateTrigger()
        ChaseTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        Name = '{Colors.COLOR_RED}Fixation|r'
    }

    public override Apply() {
        this.Type = RandomType()
        SetUnitMoveSpeed(this.Unit.Unit, FIXATION_MS)
        SetUnitVertexColor(this.Unit.Unit, 255, 0, 0, 255)
        this.UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        this.Unit.Unit.TargetedAs = TargetTypes.Ward
        RegisterEvents()
        this.Unit.WolfArea.FixationCount += 1
        super.Apply()
    }

    public override Remove() {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.DefaultMovementSpeed)
        UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        Unit.Unit.TargetedAs = TargetTypes.Ground
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255)
        IsChasing = false

        GC.RemoveTrigger(InRangeTrigger) // TODO; Cleanup:         GC.RemoveTrigger(ref InRangeTrigger);
        GC.RemoveTrigger(PeriodicSpeed) // TODO; Cleanup:         GC.RemoveTrigger(ref PeriodicSpeed);
        ChaseTimer?.Dispose()
        ChaseTimer = null
        GC.RemoveGroup(UnitsInRange) // TODO; Cleanup:         GC.RemoveGroup(ref UnitsInRange);
        GC.RemoveEffect(TargetEffect) // TODO; Cleanup:         GC.RemoveEffect(ref TargetEffect);
        if (Unit.WolfArea.FixationCount > 0) Unit.WolfArea.FixationCount -= 1
        Unit.WanderTimer?.Resume()
        super.Remove()
    }

    /// <summary>
    /// Type for the fixation...
    /// #0 being pick a player and chase them
    /// #1 being pick player in shortest range and chase them
    /// </summary>
    /// <returns></returns>
    private RandomType(): number {
        return GetRandomInt(0, 1)
    }

    private RegisterEvents() {
        if (Type == 1) UnitsInRange ??= CreateGroup()!
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, FilterList.KittyFilter)
        TriggerRegisterTimerEvent(PeriodicSpeed, 0.1, true)
        PeriodicSpeed.AddAction(UpdateChaseSpeed)
        InRangeTrigger.AddAction(() => {
            try {
                let target = GetTriggerUnit()
                let Region = RegionList.WolfRegions[Unit.RegionIndex]
                if (!Region.includes(target.X, target.Y)) return
                if (Unit.IsPaused) return
                if (target != Unit.Unit && !IsChasing) {
                    Target = target
                    ChasingEvent()
                }
            } catch (e) {
                Logger.Warning('Error in Fixation.InRangeTrigger: {e.Message}')
            }
        })
    }

    private ChasingEvent() {
        let Region = RegionList.WolfRegions[Unit.RegionIndex]
        IsChasing = true
        Unit.WanderTimer?.pause()
        TargetEffect = Effect.create(FIXATION_TARGET_EFFECT, Target, 'overhead')!
        this.ChaseTimer.start(0.1, true, () => {
            if (!Target.Alive || !Region.includes(Target.X, Target.Y)) {
                IsChasing = false
                Unit.WolfMove()
                GC.RemoveEffect(TargetEffect) // TODO; Cleanup:                 GC.RemoveEffect(ref TargetEffect);
                Unit.WanderTimer.Resume()
                ChaseTimer.pause()
                return
            }
            if (Type == 1) GetClosestTarget()
            Unit.Unit.IssueOrder('move', Target.X, Target.Y)
        })
    }

    private GetClosestTarget() {
        UnitsInRange.clear()
        UnitsInRange.EnumUnitsInRange(Unit.Unit.X, Unit.unit.y, FIXATION_RADIUS, FilterList.KittyFilter)
        if (UnitsInRange.length <= 0) return
        let newTarget = GetClosestUnitInRange()
        if (newTarget != Target) {
            Target = newTarget
            GC.RemoveEffect(TargetEffect) // TODO; Cleanup:             GC.RemoveEffect(ref TargetEffect);
            TargetEffect = Effect.create(FIXATION_TARGET_EFFECT, Target, 'overhead')!
        }
    }

    private GetClosestUnitInRange(): Unit {
        let unitX = this.Unit.Unit.x
        let unitY = this.Unit.Unit.y

        // Determine closest unit in list
        let closestUnit = UnitsInRange.First
        let closestDistance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, closestUnit.X, closestUnit.Y)
        if (closestDistance > 0) {
            while (true) {
                let unit = UnitsInRange.First
                if (unit == null) break
                UnitsInRange.Remove(unit)
                let distance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, unit.x, unit.y)
                if (distance < closestDistance) {
                    closestUnit = unit
                    closestDistance = distance
                }
            }
        }
        return closestUnit
    }

    private UpdateChaseSpeed() {
        let currentMS = Unit.Unit.MovementSpeed
        let speedIncrementer = 0.4 // 4 movespeed every second

        if (IsChasing) {
            if (currentMS <= 300) SetUnitMoveSpeed(Unit.Unit, FIXATION_MS)
            if (currentMS >= FIXATION_MAX_MS) return

            let newSpeed = currentMS + speedIncrementer

            SetUnitMoveSpeed(Unit.Unit, Math.Min(newSpeed, FIXATION_MAX_MS))
        } else {
            if (currentMS <= FIXATION_MS) return

            let newSpeed = currentMS - speedIncrementer / 2 // Decrease by half the rate
            SetUnitMoveSpeed(Unit.Unit, Math.Max(newSpeed, FIXATION_MS))
        }
    }

    public static GetFixation(Unit: Unit): Fixation {
        if (Unit == null) return null
        let affix = Globals.ALL_WOLVES[Unit].Affixes.Find(Fixation.IsFixation)
        return affix instanceof Fixation ? fixation : null
    }

    public override Pause(pause: boolean) {
        if (pause) {
            Unit.Unit.ClearOrders()
            ChaseTimer.pause()
            InRangeTrigger.Disable()
            IsChasing = false
            GC.RemoveEffect(TargetEffect) // TODO; Cleanup:             GC.RemoveEffect(ref TargetEffect);
        } else {
            InRangeTrigger.Enable()
            ChaseTimer.Resume()
        }
    }
}
