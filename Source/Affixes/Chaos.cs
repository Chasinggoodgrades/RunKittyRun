using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Chaos : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_CHAOS;
    private timer RotationTimer;
    private Affix currentAffix;
    private float rotationTime = 25.0f;
    public Chaos(Wolf unit) : base(unit)
    {}

    public override void Apply()
    {
        RegisterTimer();
        Unit.Unit.AddAbility(AFFIX_ABILITY);
    }

    public override void Remove()
    {
        currentAffix.Remove();
        RotationTimer?.Dispose();
        Unit.Unit.RemoveAbility(AFFIX_ABILITY);
    }

    private void RegisterTimer()
    {
        RotationTimer = timer.Create();
        RotationTimer.Start(rotationTime, true, RotateAffix);
    }

    private void RotateAffix()
    {
        if (currentAffix != null)
            currentAffix.Remove();
        var randomAffixList = AffixFactory.AffixTypes;
        var randomAffixName = AffixFactory.AffixTypes.Count > 0 ? randomAffixList[GetRandomInt(0, randomAffixList.Count - 1)] : "Speedster";
        if(randomAffixName == "Chaos")
            randomAffixName = "Speedster";
        currentAffix = AffixFactory.CreateAffix(Unit, randomAffixName);
        currentAffix.Apply();
    }

}