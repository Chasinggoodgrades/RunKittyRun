public class Stealth : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_GHOSTAFFIX;



    public Stealth(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_GREY}Stealth|r";
    }

    public override void Apply()
    {
        Unit.Unit.AddAbility(AFFIX_ABILITY);
    }

    public override void Remove()
    {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
    }

}