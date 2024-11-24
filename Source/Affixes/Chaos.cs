using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Chaos : Affix
{
    private timer RotationTimer;
    private Affix currentAffix;
    private float rotationTime = 25.0f;
    public Chaos(Wolf unit) : base(unit)
    {}

    public override void Apply()
    {
        RegisterTimer();
    }

    public override void Remove()
    {
        currentAffix.Remove();
        RotationTimer?.Dispose();
    }

    private void RegisterTimer()
    {
        RotationTimer = timer.Create();
        RotationTimer.Start(rotationTime, true, RotateAffix);
    }

    private void RotateAffix()
    {
        try
        {
            if (currentAffix != null)
                currentAffix.Remove();
            var randomAffixList = AffixFactory.AffixTypes;
            randomAffixList.Remove("Chaos");
            var randomAffixName = AffixFactory.AffixTypes.Count > 0 ? randomAffixList[GetRandomInt(0, randomAffixList.Count - 1)] : "Speedster";
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffixName);
            currentAffix.Apply();
            Console.WriteLine("affixes rotated!");
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            Console.WriteLine(e.StackTrace);
        }
    }

}