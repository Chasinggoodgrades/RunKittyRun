using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class Fixation : Affix
{
    private const float FIXATION_RADIUS = 500.0f;
    private const float FIXATION_MS = 325.0f;
    private trigger InRangeTrigger;
    private bool IsChasing = false;
    public Fixation(Wolf unit) : base(unit) 
    {
        InRangeTrigger = CreateTrigger();
    }

    private void RegisterEvents()
    {
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        InRangeTrigger.AddAction(() =>
        {
            Console.WriteLine("Fixation triggered!");
            var target = GetTriggerUnit();
            if (target != Unit.Unit && !IsChasing)
                ChasingEvent(target);
        });
    }

    private void ChasingEvent(unit Target)
    {
        var timer = CreateTimer();
        IsChasing = true;
        var Region = RegionList.WolfRegions[Unit.RegionIndex];
        TimerStart(timer, 0.1f, true, () =>
        {
            if (!Target.Alive || !Region.Contains(GetUnitX(Target), GetUnitY(Target)))
            {
                IsChasing = false;
                var x = GetRandomReal(Region.Rect.MinX, Region.Rect.MaxX);
                var y = GetRandomReal(Region.Rect.MinY, Region.Rect.MaxY);
                Unit.Unit.IssueOrder("move", x, y);
                timer.Dispose();
                return;
            }
            Unit.Unit.IssueOrder("move", Target.X, Target.Y);
        });
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
        InRangeTrigger.Dispose();
    }
}