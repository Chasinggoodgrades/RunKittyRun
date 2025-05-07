using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Chaos : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_CHAOS;
    private AchesTimers RotationTimer;
    private Affix currentAffix;
    private float rotationTime = GetRandomReal(25f, 45f);

    public Chaos(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_GREEN}Chaos|r";
    }

    public override void Apply()
    {
        RegisterTimer();
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        base.Apply();
    }

    public override void Remove()
    {
        try
        {
            currentAffix.Remove();
            RotationTimer.Dispose();
            Unit.Unit.RemoveAbility(AFFIX_ABILITY);
            base.Remove();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Chaos.Remove: {e.Message}");
            base.Remove();
        }
    }

    private void RegisterTimer()
    {
        try
        {
            RotationTimer = ObjectPool.GetEmptyObject<AchesTimers>();
            RotationTimer.Timer.Start(rotationTime, true, RotateAffix);
            currentAffix = AffixFactory.CreateAffix(Unit, "Speedster");
            currentAffix.Apply();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Chaos.RegisterTimer: {e.Message}");
            RotationTimer.Dispose();
            currentAffix?.Remove();
            currentAffix = null;
        }
    }

    private void RotateAffix()
    {
        try
        {
            currentAffix?.Remove();
            string randomAffixName = AffixFactory.AffixTypes.Count > 0 ? AffixFactory.AffixTypes[GetRandomInt(0, AffixFactory.AffixTypes.Count - 1)] : "Speedster";
            if (randomAffixName == "Chaos")
                randomAffixName = "Speedster";
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffixName);
            currentAffix.Apply();
        }
        catch (System.Exception e)
        {
            // Handle exceptions gracefully, log if necessary
            Logger.Warning($"Error in Chaos.RotateAffix: {e.Message}");
            if (currentAffix != null)
                currentAffix.Remove();
            currentAffix = null;
        }
    }
}
