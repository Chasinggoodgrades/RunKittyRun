using WCSharp.Api;

public class Blitzer : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_BLITZER;
    public Blitzer(Wolf unit) : base(unit)
    {

    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        Unit.OVERHEAD_EFFECT_PATH = "";
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;
    }







}