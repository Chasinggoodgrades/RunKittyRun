using static WCSharp.Api.Common;

public class Unpredictable : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_UNPREDICTABLE;
    private static int WANDER_ABILITY = FourCC("Awan");

    public Unpredictable(Wolf unit) : base(unit)
    {
        Name = "Unpredictable";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(WANDER_ABILITY); // Wander
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.OverheadEffectPath = "";
        base.Apply();
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(WANDER_ABILITY); // Wander
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.OverheadEffectPath = Wolf.DefaultOverheadEffect;
        base.Remove();
    }

    public override void Pause(bool pause)
    {

    }

}
