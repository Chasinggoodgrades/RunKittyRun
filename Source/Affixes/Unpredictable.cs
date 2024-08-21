using WCSharp.Api;
using static WCSharp.Api.Common;
public class Unpredictable : Affix
{
    public Unpredictable(Wolf unit) : base(unit) { }

    public override void Apply()
    {
        Unit.Unit.AddAbility(FourCC("Awan")); // Wander
        Unit.Unit.AddAbility(Constants.ABILITY_UNPREDICTABLE);
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(FourCC("Awan")); // Wander
        Unit.Unit.RemoveAbility(Constants.ABILITY_UNPREDICTABLE);
    }

}