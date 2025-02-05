using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Have to decide on how to handle this.
/// - Constant? or Periodic?
/// - If periodic, how often? 15 seconds - 45 seconds? and how long?
/// - Strength of the pull, effect of the pull...
/// - Likely need to use a group, enum units, and use a timer to determine if they're in radius.
/// </summary>

public class Vortex : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_UNPREDICTABLE;



    public Vortex(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_PURPLE}Vortex|r";
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