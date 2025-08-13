export class KittyMorphosis {
    /// <summary>
    /// The level required to morph (reduction in size / collision).
    /// </summary>
    private REQUIRED_LEVEL: number = 10

    /// <summary>
    /// The amount of collision reduction applied to the Kitty when they morph.
    /// </summary>
    private COLLISION_REDUCTION: number = 0.1

    /// <summary>
    /// Trigger that will detect whenever the Kitty.Player levels up..
    /// </summary>
    private Trigger: Trigger

    /// <summary>
    /// The Kitty instance that this morphosis is applied to.
    /// </summary>
    private Kitty: Kitty

    /// <summary>
    /// Indicates whether the morphosis is currently active or not.
    /// </summary>
    public Active: boolean

    /// <summary>
    /// Initializes a new instance of the <see cref="KittyMorphosis"/> class.
    /// </summary>
    /// <param name="kitty"></param>
    public KittyMorphosis(kitty: Kitty) {
        Kitty = kitty
        this.RegisterTriggers()
    }

    /// <summary>
    /// Registers the triggers so that when someone hits the required level they'll morph.
    /// </summary>
    private RegisterTriggers() {
        if (Gamemode.CurrentGameMode == GameMode.SoloTournament) return // Solo Mode
        Trigger ??= Trigger.create()!
        Trigger.registerUnitEvent(Kitty.Unit, unitevent.getHeroLevel())
        Trigger.addCondition(Condition(() => getTriggerUnit().getHeroLevel() >= REQUIRED_LEVEL))
        Trigger.addAction(MorphKitty)
    }

    /// <summary>
    /// Deregisters the collision detection, to readd them with the proper collision radius.
    /// </summary>
    private MorphKitty() {
        if (Active) return
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Kitty)
        Kitty.CurrentStats.CollisonRadius =
            CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * (1.0 - COLLISION_REDUCTION)
        CollisionDetection.KittyRegisterCollisions(Kitty)
        Utility.SimpleTimer(0.1, ScaleUnit)
        Kitty.Player.DisplayTimedTextTo(
            6.0,
            "{Colors.COLOR_YELLOW}You'adapted: to: the: environment: ve!{Colors.COLOR_RESET} {Colors.COLOR_TURQUOISE}radius: reduced: by: Collision {COLLISION_REDUCTION * 100}%!{Colors.COLOR_RESET}"
        )
        Active = true
    }

    /// <summary>
    /// Changes the visual scale of the unit once they hit the REQUIRED_LEVEL to match what their collision radius may look like
    /// </summary>
    /// <param name="Unit"></param>
    public ScaleUnit() {
        if (!Active) return
        let scale: number = 0.6 - 0.6 * COLLISION_REDUCTION * 2.0
        Kitty.Unit.SetScale(scale, scale, scale)
    }
}
