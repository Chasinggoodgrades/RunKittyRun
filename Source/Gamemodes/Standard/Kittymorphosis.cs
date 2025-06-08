using WCSharp.Api;
using static WCSharp.Api.Common;

public class KittyMorphosis
{
    /// <summary>
    /// The level required to morph (reduction in size / collision).
    /// </summary>
    private const int REQUIRED_LEVEL = 10;

    /// <summary>
    /// The amount of collision reduction applied to the Kitty when they morph.
    /// </summary>
    private const float COLLISION_REDUCTION = 0.10f;

    /// <summary>
    /// Trigger that will detect whenever the Kitty.Player levels up.. 
    /// </summary>
    private trigger Trigger;

    /// <summary>
    /// The Kitty instance that this morphosis is applied to.
    /// </summary>
    private Kitty Kitty;

    /// <summary>
    /// Indicates whether the morphosis is currently active or not.
    /// </summary>
    public bool Active;

    /// <summary>
    /// Initializes a new instance of the <see cref="KittyMorphosis"/> class.
    /// </summary>
    /// <param name="kitty"></param>
    public KittyMorphosis(Kitty kitty)
    {
        Kitty = kitty;
        RegisterTriggers();
    }

    /// <summary>
    /// Registers the triggers so that when someone hits the required level they'll morph.
    /// </summary>
    private void RegisterTriggers()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Kitty.Unit, unitevent.HeroLevel);
        Trigger.AddCondition(Condition(() => @event.Unit.HeroLevel >= REQUIRED_LEVEL));
        Trigger.AddAction(MorphKitty);
    }

    /// <summary>
    /// Deregisters the collision detection, to readd them with the proper collision radius.
    /// </summary>
    private void MorphKitty()
    {
        if (Active) return;
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Kitty);
        Kitty.CurrentStats.CollisonRadius = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * (1.0f - COLLISION_REDUCTION);
        CollisionDetection.KittyRegisterCollisions(Kitty);
        Utility.SimpleTimer(0.1f, ScaleUnit);
        Kitty.Player.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_YELLOW}You've adapted to the environment!{Colors.COLOR_RESET} {Colors.COLOR_TURQUOISE}Collision radius reduced by {COLLISION_REDUCTION * 100}%!{Colors.COLOR_RESET}");
        Active = true;
    }

    /// <summary>
    /// Changes the visual scale of the unit once they hit the REQUIRED_LEVEL to match what their collision radius may look like
    /// </summary>
    /// <param name="Unit"></param>
    public void ScaleUnit()
    {
        if (!Active) return;
        float scale = 0.60f - (0.60f * COLLISION_REDUCTION * 2.0f);
        Kitty.Unit.SetScale(scale, scale, scale);
    }
}
