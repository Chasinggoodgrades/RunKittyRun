using static WCSharp.Api.Common;

public class Speedster : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_SPEEDSTER;

    public Speedster(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_ORANGE}Speedster|r";
    }

    public override void Apply()
    {
        SetUnitMoveSpeed(Unit.Unit, 522);
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        base.Apply();
    }

    public override void Remove()
    {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.BaseMovementSpeed);
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        base.Remove();
    }
}
