using System;
using WCSharp.Api;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;
public class Fixation : Affix
{
    private const float FIXATION_RADIUS = 500.0f;
    private const float FIXATION_MS = 325.0f;
    private const float FIXATION_MAX_MS = 410.0f;
    private const string FIXATION_TARGET_EFFECT = "Abilities\\Spells\\Undead\\DeathCoil\\DeathCoilMissile.mdl";
    private trigger InRangeTrigger;
    private trigger PeriodicSpeed;
    private bool IsChasing = false;
    private effect TargetEffect;
    public Fixation(Wolf unit) : base(unit) 
    {
        InRangeTrigger = trigger.Create();
        PeriodicSpeed = trigger.Create();
    }

    private void RegisterEvents()
    {
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        PeriodicSpeed.RegisterTimerEvent(0.1f, true);
        PeriodicSpeed.AddAction(() => UpdateChaseSpeed());
        InRangeTrigger.AddAction(() =>
        {
            var target = @event.Unit;
            var Region = RegionList.WolfRegions[Unit.RegionIndex];
            if(!Region.Contains(target.X, target.Y)) return;
            if (target != Unit.Unit && !IsChasing)
                ChasingEvent(target);
        });
    }

    private void ChasingEvent(unit Target)
    {
        var chaseTimer = timer.Create();
        var Region = RegionList.WolfRegions[Unit.RegionIndex];
        IsChasing = true;
        TargetEffect = effect.Create(FIXATION_TARGET_EFFECT, Target, "overhead");
        chaseTimer.Start(0.1f, true, () => {
            if (!Target.Alive || !Region.Contains(Target.X, Target.Y))
            {
                IsChasing = false;
                Unit.WolfMove();
                chaseTimer.Dispose();
                TargetEffect.Dispose();
                return;
            }
            Unit.Unit.IssueOrder("move", Target.X, Target.Y);
        });
    }

    private void UpdateChaseSpeed()
    {
        var currentMS = Unit.Unit.MovementSpeed;
        var speedIncrementer = 0.40f; // 4ms every second

        if (IsChasing)
        {
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



    public override void Apply()
    {
        SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
        SetUnitVertexColor(Unit.Unit, 255, 0, 0, 255);
        Unit.Unit.AddAbility(Constants.ABILITY_FIXATION);
        RegisterEvents();
    }

    public override void Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.BaseMovementSpeed);
        Unit.Unit.RemoveAbility(Constants.ABILITY_FIXATION);
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255);
        InRangeTrigger.Dispose();
        PeriodicSpeed.Dispose();
        TargetEffect?.Dispose();
    }
}