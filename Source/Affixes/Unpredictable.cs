using WCSharp.Api;
using static WCSharp.Api.Common;
public class Unpredictable : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_UNPREDICTABLE;

    public Unpredictable(Wolf unit) : base(unit) {
        Name = "Unpredictable"; 
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(FourCC("Awan")); // Wander
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.OVERHEAD_EFFECT_PATH = "";
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(FourCC("Awan")); // Wander
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;
        base.Remove();
    }

}