public class Stealth : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_GHOSTAFFIX;



    public Stealth(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_GREY}Stealth|r";
    }

    public override void Apply()
    {
        _ = Unit.Unit.AddAbility(AFFIX_ABILITY);
        base.Apply();
    }

    public override void Remove()
    {
        _ = Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        base.Remove();
    }

}