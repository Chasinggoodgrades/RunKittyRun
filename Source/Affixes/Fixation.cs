using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public class Fixation : Affix
{
    private const float FIXATION_RADIUS = 500.0f;
    private const float FIXATION_MS = 325.0f;
    private const float FIXATION_MAX_MS = 410.0f;
    private const string FIXATION_TARGET_EFFECT = "Abilities\\Spells\\Undead\\DeathCoil\\DeathCoilMissile.mdl";
    private const int AFFIX_ABILITY = Constants.ABILITY_FIXATION;
    private trigger InRangeTrigger;
    private trigger PeriodicSpeed;
    private timer ChaseTimer;
    private group UnitsInRange;
    private unit Target;
    private int Type;
    private bool IsChasing = false;
    private effect TargetEffect;

    public Fixation(Wolf unit) : base(unit)
    {
        InRangeTrigger = trigger.Create();
        PeriodicSpeed = trigger.Create();
        ChaseTimer = timer.Create();
        Name = $"{Colors.COLOR_RED}Fixation|r";
    }

    public override void Apply()
    {
        Type = RandomType();
        SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
        SetUnitVertexColor(Unit.Unit, 255, 0, 0, 255);
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.Unit.TargetedAs = 16;
        RegisterEvents();
        base.Apply();
    }

    public override void Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.BaseMovementSpeed);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.Unit.TargetedAs = 2;
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        IsChasing = false;

        GC.RemoveTrigger(ref InRangeTrigger);
        GC.RemoveTrigger(ref PeriodicSpeed);
        GC.RemoveTimer(ref ChaseTimer);
        GC.RemoveGroup(ref UnitsInRange);
        GC.RemoveEffect(ref TargetEffect);
        Unit.WanderTimer.Resume();
        base.Remove();
    }

    /// <summary>
    /// Type for the fixation...
    /// #0 being pick a player and chase them
    /// #1 being pick player in shortest range and chase them
    /// </summary>
    /// <returns></returns>
    private int RandomType()
    {
        return GetRandomInt(0, 1);
    }

    private void RegisterEvents()
    {
        if (Type == 1) UnitsInRange = group.Create();
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, Filters.KittyFilter);
        PeriodicSpeed.RegisterTimerEvent(0.1f, true);
        PeriodicSpeed.AddAction(ErrorHandler.Wrap(() => UpdateChaseSpeed()));
        InRangeTrigger.AddAction(ErrorHandler.Wrap(() =>
        {
            var target = @event.Unit;
            var Region = RegionList.WolfRegions[Unit.RegionIndex];
            if (!Region.Contains(target.X, target.Y)) return;
            if (target != Unit.Unit && !IsChasing)
            {
                Target = target;
                ChasingEvent();
            }
        }));
    }

    private void ChasingEvent()
    {
        var Region = RegionList.WolfRegions[Unit.RegionIndex];
        IsChasing = true;
        Unit.WanderTimer.Pause();
        TargetEffect = effect.Create(FIXATION_TARGET_EFFECT, Target, "overhead");
        ChaseTimer.Start(0.1f, true, ErrorHandler.Wrap(() =>
        {
            if (!Target.Alive || !Region.Contains(Target.X, Target.Y))
            {
                IsChasing = false;
                Unit.WolfMove();
                GC.RemoveEffect(ref TargetEffect);
                Unit.WanderTimer.Resume();
                ChaseTimer.Pause();
                return;
            }
            if (Type == 1) GetClosestTarget();
            Unit.Unit.IssueOrder("move", Target.X, Target.Y);
        }));
    }

    private void GetClosestTarget()
    {
        UnitsInRange.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, FIXATION_RADIUS, Filters.KittyFilter);
        if (UnitsInRange.Count <= 0) return;
        var newTarget = GetClosestUnitInRange();
        if (newTarget != Target)
        {
            Target = newTarget;
            GC.RemoveEffect(ref TargetEffect);
            TargetEffect = effect.Create(FIXATION_TARGET_EFFECT, Target, "overhead");
        }
    }

    private unit GetClosestUnitInRange()
    {
        var rangeList = UnitsInRange.ToList();
        var unitX = Unit.Unit.X;
        var unitY = Unit.Unit.Y;

        // Determine closest unit in list
        var closestUnit = rangeList[0];
        var closestDistance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, closestUnit.X, closestUnit.Y);
        if (closestDistance > 0)
        {
            foreach (var unit in rangeList)
            {
                var distance = WCSharp.Shared.Util.DistanceBetweenPoints(unitX, unitY, unit.X, unit.Y);
                if (distance < closestDistance)
                {
                    closestUnit = unit;
                    closestDistance = distance;
                }
            }
        }
        GC.RemoveList(ref rangeList);
        return closestUnit;
    }

    private void UpdateChaseSpeed()
    {
        var currentMS = Unit.Unit.MovementSpeed;
        var speedIncrementer = 0.40f; // 4 movespeed every second

        if (IsChasing)
        {
            if (currentMS <= 300) SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
            if (currentMS >= FIXATION_MAX_MS) return;

            var newSpeed = currentMS + speedIncrementer;

            SetUnitMoveSpeed(Unit.Unit, Math.Min(newSpeed, FIXATION_MAX_MS));
        }
        else
        {
            if (currentMS <= FIXATION_MS) return;

            var newSpeed = currentMS - (speedIncrementer / 2); // Decrease by half the rate
            SetUnitMoveSpeed(Unit.Unit, Math.Max(newSpeed, FIXATION_MS));
        }
    }

    public static Fixation GetFixation(unit Unit)
    {
        var affix = Globals.ALL_WOLVES[Unit].Affixes.Find(a => a is Fixation);
        return affix is Fixation fixation ? fixation : null;
    }

    public void PauseFixation(bool pause)
    {
        if (pause)
        {
            IsChasing = false;
            InRangeTrigger.Disable();
            ChaseTimer.Pause();
            GC.RemoveEffect(ref TargetEffect);
        }
        else
        {
            InRangeTrigger.Enable();
            ChaseTimer.Resume();
        }
    }
}
