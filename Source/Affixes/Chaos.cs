using static WCSharp.Api.Common;

public class Chaos : Affix
{
    private const int AFFIX_ABILITY = Constants.ABILITY_CHAOS;
    private AchesTimers RotationTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private Affix currentAffix;
    private float rotationTime = GetRandomReal(25f, 45f);

    public Chaos(Wolf unit) : base(unit)
    {
        Name = $"{Colors.COLOR_GREEN}Chaos|r";
    }

    public override void Apply()
    {
        try
        {
            RegisterTimer();
            Unit.Unit.AddAbility(AFFIX_ABILITY);
            base.Apply();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Chaos.Apply: {e.Message}");
            throw;
        }
    }

    public override void Remove()
    {
        try
        {
            Unit.RemoveAffix(currentAffix);
            currentAffix = null;
            RotationTimer?.Dispose();
            Unit?.Unit?.RemoveAbility(AFFIX_ABILITY);
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
            RotationTimer?.Timer.Start(rotationTime, true, RotateAffix);
            string randomAffix = GenRandomAffixName();
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffix);
            Unit.AddAffix(currentAffix);
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Chaos.RegisterTimer: {e.Message}");
            RotationTimer.Dispose();
            Unit.RemoveAffix(currentAffix);
            currentAffix = null;
        }
    }

    private void RotateAffix()
    {
        try
        {
            if (currentAffix != null) Unit.RemoveAffix(currentAffix);
            currentAffix = null;
            string randomAffix = GenRandomAffixName();
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffix);
            Unit.AddAffix(currentAffix);
        }
        catch (System.Exception e)
        {
            // Handle exceptions gracefully, log if necessary
            Logger.Warning($"Error in Chaos.RotateAffix: {e.Message}");
            Unit.RemoveAffix(currentAffix);
            currentAffix = null;
        }
    }

    private string GenRandomAffixName()
    {
        string randomAffixName = AffixFactory.AffixTypes.Count > 0 ? AffixFactory.AffixTypes[GetRandomInt(0, AffixFactory.AffixTypes.Count - 1)] : "Speedster";
        if (randomAffixName == "Chaos")
            randomAffixName = "Speedster";
        return randomAffixName;
    }

    public override void Pause(bool pause)
    {
        RotationTimer.Pause(pause);
        currentAffix.Pause(pause);
    }

}
