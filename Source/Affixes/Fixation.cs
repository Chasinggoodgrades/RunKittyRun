using System;
using WCSharp.Api;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;
public class Fixation : Affix
{
    private const float FIXATION_RADIUS = 500.0f;
    private const float FIXATION_MS = 325.0f;
    private const string FIXATION_TARGET_EFFECT = "Abilities\\Spells\\Undead\\DeathCoil\\DeathCoilMissile.mdl";
    private trigger InRangeTrigger;
    private bool IsChasing = false;
    private effect TargetEffect;
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
            var target = @event.Unit;
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
    }
}