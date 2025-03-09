using WCSharp.Api;
using static WCSharp.Api.Common;

public class Chaos : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_CHAOS;
    private timer RotationTimer;
    private Affix currentAffix;
    private float rotationTime = 25.0f;

    public Chaos(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_GREEN}Chaos|r";
    }

    public override void Apply()
    {
        RegisterTimer();
        _ = Unit.Unit.AddAbility(AFFIX_ABILITY);
        base.Apply();
    }

    public override void Remove()
    {
        currentAffix.Remove();
        GC.RemoveTimer(ref RotationTimer);
        _ = Unit.Unit.RemoveAbility(AFFIX_ABILITY);
        base.Remove();
    }

    private void RegisterTimer()
    {
        RotationTimer = timer.Create();
        RotationTimer.Start(rotationTime, true, RotateAffix);
        currentAffix = AffixFactory.CreateAffix(Unit, "Speedster");
        currentAffix.Apply();
    }

    private void RotateAffix()
    {
        currentAffix?.Remove();
        System.Collections.Generic.List<string> randomAffixList = AffixFactory.AffixTypes;
        string randomAffixName = AffixFactory.AffixTypes.Count > 0 ? randomAffixList[GetRandomInt(0, randomAffixList.Count - 1)] : "Speedster";
        if (randomAffixName == "Chaos")
            randomAffixName = "Speedster";
        currentAffix = AffixFactory.CreateAffix(Unit, randomAffixName);
        currentAffix.Apply();
    }

}