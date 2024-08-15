using WCSharp.Api;
using static WCSharp.Api.Common;
public class Speedster : Affix
{
    public Speedster(Wolf unit) : base(unit) { }

    public override void Apply()
    {
        SetUnitMoveSpeed(Unit.Unit, 522);
        Unit.Unit.AddAbility(Constants.ABILITY_SPEEDSTER);
    }

    public override void Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.BaseMovementSpeed);
        Unit.Unit.RemoveAbility(Constants.ABILITY_SPEEDSTER);
    }
}