

class Fixation extends Affix
{
    private FIXATION_RADIUS: number = 500.0;
    private FIXATION_MS: number = 325.0;
    private FIXATION_MAX_MS: number = 410.0;
    private FIXATION_TARGET_EFFECT: string = "Abilities\\Spells\\Undead\\DeathCoil\\DeathCoilMissile.mdl";

private static readonly IsFixation = (r: Affix): r is Fixation => {
        return r instanceof Fixation
    }



    
    private AFFIX_ABILITY: number = Constants.ABILITY_FIXATION;
    private InRangeTrigger: trigger;
    private PeriodicSpeed: trigger;
    private ChaseTimer: AchesTimers;
    private UnitsInRange: group;
    private Target: unit;
    private Type: number;
    private IsChasing: boolean = false;
    private TargetEffect: effect;

    public constructor(unit: Wolf) 
    {
        super(unit);
        InRangeTrigger ??= trigger.Create();
        PeriodicSpeed ??= trigger.Create();
        ChaseTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        Name = "{Colors.COLOR_RED}Fixation|r";
    }

    public override Apply()
    {
        Type = RandomType();
        SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
        SetUnitVertexColor(Unit.Unit, 255, 0, 0, 255);
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.Unit.TargetedAs = TargetTypes.Ward;
        RegisterEvents();
        Unit.WolfArea.FixationCount += 1;
        base.Apply();
    }

    public override Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.DefaultMovementSpeed);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.Unit.TargetedAs = TargetTypes.Ground;
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        IsChasing = false;

        GC.RemoveTrigger( InRangeTrigger); // TODO; Cleanup:         GC.RemoveTrigger(ref InRangeTrigger);
        GC.RemoveTrigger( PeriodicSpeed); // TODO; Cleanup:         GC.RemoveTrigger(ref PeriodicSpeed);
        ChaseTimer?.Dispose();
        ChaseTimer = null;
        GC.RemoveGroup( UnitsInRange); // TODO; Cleanup:         GC.RemoveGroup(ref UnitsInRange);
        GC.RemoveEffect( TargetEffect); // TODO; Cleanup:         GC.RemoveEffect(ref TargetEffect);
        if (Unit.WolfArea.FixationCount > 0) Unit.WolfArea.FixationCount -= 1;
        Unit.WanderTimer?.Resume();
        base.Remove();
    }

    /// <summary>
    /// Type for the fixation...
    /// #0 being pick a player and chase them
    /// #1 being pick player in shortest range and chase them
    /// </summary>
    /// <returns></returns>
    private RandomType(): number
    {
        return GetRandomInt(0, 1);
    }

    private RegisterEvents()
    {
        if (Type == 1) UnitsInRange ??= group.Create();
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, FilterList.KittyFilter);
        PeriodicSpeed.RegisterTimerEvent(0.1, true);
        PeriodicSpeed.AddAction(UpdateChaseSpeed);
        InRangeTrigger.AddAction(() =>
        {
            try
            {
                let target = GetTriggerUnit();
                let Region = RegionList.WolfRegions[Unit.RegionIndex];
                if (!Region.Contains(target.X, target.Y)) return;
                if (Unit.IsPaused) return;
                if (target != Unit.Unit && !IsChasing)
                {
                    Target = target;
                    ChasingEvent();
                }
            }
            catch (e: Error)
            {
                Logger.Warning("Error in Fixation.InRangeTrigger: {e.Message}");
            }
        });
    }

    private ChasingEvent()
    {
        let Region = RegionList.WolfRegions[Unit.RegionIndex];
        IsChasing = true;
        Unit.WanderTimer?.Pause();
        TargetEffect = effect.Create(FIXATION_TARGET_EFFECT, Target, "overhead");
        ChaseTimer.Timer.Start(0.1, true, () =>
        {
            if (!Target.Alive || !Region.Contains(Target.X, Target.Y))
            {
                IsChasing = false;
                Unit.WolfMove();
                GC.RemoveEffect( TargetEffect); // TODO; Cleanup:                 GC.RemoveEffect(ref TargetEffect);
                Unit.WanderTimer.Resume();
                ChaseTimer.Pause();
                return;
            }
            if (Type == 1) GetClosestTarget();
            Unit.Unit.IssueOrder("move", Target.X, Target.Y);
        });
    }

    private GetClosestTarget()
    {
        UnitsInRange.Clear();
        UnitsInRange.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, FIXATION_RADIUS, FilterList.KittyFilter);
        if (UnitsInRange.Count <= 0) return;
        let newTarget = GetClosestUnitInRange();
        if (newTarget != Target)
        {
            Target = newTarget;
            GC.RemoveEffect( TargetEffect); // TODO; Cleanup:             GC.RemoveEffect(ref TargetEffect);
            TargetEffect = effect.Create(FIXATION_TARGET_EFFECT, Target, "overhead");
        }
    }

    private GetClosestUnitInRange(): unit
    {
        let unitX = Unit.Unit.X;
        let unitY = Unit.Unit.Y;

        // Determine closest unit in list
        let closestUnit = UnitsInRange.First;
        let closestDistance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, closestUnit.X, closestUnit.Y);
        if (closestDistance > 0)
        {

            while (true)
            {
                let unit = UnitsInRange.First;
                if (unit == null) break;
                UnitsInRange.Remove(unit);
                let distance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, unit.X, unit.Y);
                if (distance < closestDistance)
                {
                    closestUnit = unit;
                    closestDistance = distance;
                }
            }
        }
        return closestUnit;
    }

    private UpdateChaseSpeed()
    {
        let currentMS = Unit.Unit.MovementSpeed;
        let speedIncrementer = 0.40; // 4 movespeed every second

        if (IsChasing)
        {
            if (currentMS <= 300) SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
            if (currentMS >= FIXATION_MAX_MS) return;

            let newSpeed = currentMS + speedIncrementer;

            SetUnitMoveSpeed(Unit.Unit, Math.Min(newSpeed, FIXATION_MAX_MS));
        }
        else
        {
            if (currentMS <= FIXATION_MS) return;

            let newSpeed = currentMS - (speedIncrementer / 2); // Decrease by half the rate
            SetUnitMoveSpeed(Unit.Unit, Math.Max(newSpeed, FIXATION_MS));
        }
    }

    public static GetFixation(Unit: unit):Fixation
    {
        if (Unit == null) return null;
        let affix = Globals.ALL_WOLVES[Unit].Affixes.Find(Fixation.IsFixation);
        return affix is fixation: Fixation ? fixation : null;
    }

    public override Pause(pause: boolean)
    {
        if (pause)
        {
            Unit.Unit.ClearOrders();
            ChaseTimer.Pause();
            InRangeTrigger.Disable();
            IsChasing = false;
            GC.RemoveEffect( TargetEffect); // TODO; Cleanup:             GC.RemoveEffect(ref TargetEffect);
        }
        else
        {
            InRangeTrigger.Enable();
            ChaseTimer.Resume();
        }
    }
}
