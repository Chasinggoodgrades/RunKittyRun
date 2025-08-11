class Circle {
    private CIRCLE_UNIT_MODEL: number = Constants.UNIT_KITTY_CIRCLE
    private static CIRCLE_SPAWN_REGION: rect = Regions.Circle_Area.Rect
    private ID: number
    public Player: player
    public Unit: unit
    public Collision: trigger

    public Circle(player: player) {
        Player = player
        ID = player.Id
        Collision = CreateTrigger()
        CreateCircle()
    }

    private CreateCircle() {
        Unit = unit.Create(Player, CIRCLE_UNIT_MODEL, CIRCLE_SPAWN_REGION.CenterX, CIRCLE_SPAWN_REGION.CenterY)
        Utility.MakeUnitLocust(Unit)
        Globals.ALL_CIRCLES.Add(Player, this)
        Unit.IsVisible = false
    }

    public Dispose() {
        Unit.Dispose()
        Collision.Dispose()
        Globals.ALL_CIRCLES.Remove(Player)
    }

    public KittyDied(kitty: Kitty) {
        Unit.SetPosition(kitty.Unit.X, kitty.GetUnitY(unit))
        ShowCircle()
    }

    public SetMana(mana: number, maxMana: number, regenRate: number) {
        Unit.Mana = mana
        Unit.MaxMana = maxMana
        Unit.ManaRegeneration = regenRate
    }

    public HideCircle() {
        return (Unit.IsVisible = false)
    }

    private ShowCircle() {
        return (Unit.IsVisible = true)
    }
}
