using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class Frostbite : Affix
{
    private const float FIXATION_RADIUS = 500.0f;
    private const float FIXATION_MS = 365.0f; // default
    //private trigger InRangeTrigger;
    private bool IsChasing = false;
    public Frostbite(Wolf unit) : base(unit)
    {
        //InRangeTrigger = CreateTrigger();
    }

    private void RegisterEvents()
    {
/*        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FIXATION_RADIUS, Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY));
        InRangeTrigger.AddAction(() =>
        {
            Console.WriteLine("Frostbite triggered!");
            var target = GetTriggerUnit();
            if (target != Unit.Unit && !IsChasing)
                ChasingEvent(target);
        });*/
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

                timer.Dispose();
                return;
            }
            Unit.Unit.IssueOrder("move", Target.X, Target.Y);
        });
    }

    public override void Apply()
    {
        SetUnitMoveSpeed(Unit.Unit, FIXATION_MS);
        SetUnitVertexColor(Unit.Unit, 0, 50, 220, 255);
        Unit.Unit.AddAbility(Constants.ABILITY_FROSTBITE);
        //RegisterEvents();
    }

    public override void Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.BaseMovementSpeed);
        Unit.Unit.RemoveAbility(Constants.ABILITY_FROSTBITE);
        //InRangeTrigger.Dispose();
    }
}