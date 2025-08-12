export class Circle {
    private CIRCLE_UNIT_MODEL: number = Constants.UNIT_KITTY_CIRCLE
    private static CIRCLE_SPAWN_REGION: rect = Regions.Circle_Area.Rect
    private ID: number
    public Player: MapPlayer
    public Unit: Unit
    public Collision: trigger

    public Circle(player: MapPlayer) {
        Player = player
        ID = player.Id
        Collision = CreateTrigger()
        CreateCircle()
    }

    private CreateCircle() {
        Unit = unit.Create(Player, CIRCLE_UNIT_MODEL, CIRCLE_SPAWN_REGION.CenterX, CIRCLE_SPAWN_REGION.CenterY)
        Utility.MakeUnitLocust(Unit)
        Globals.ALL_CIRCLES.push(Player, this)
        Unit.IsVisible = false
    }

    public Dispose() {
        Unit.Dispose()
        Collision.Dispose()
        Globals.ALL_CIRCLES.Remove(Player)
    }

    public KittyDied(kitty: Kitty) {
        Unit.setPos(kitty.Unit.X, kitty.unit.y)
        ShowCircle()
    }

    public SetMana(mana: number, maxMana: number, regenRate: number) {
        Unit.mana = mana
        Unit.maxMana = maxMana
        Unit.ManaRegeneration = regenRate
    }

    public HideCircle() {
        return (Unit.IsVisible = false)
    }

    private ShowCircle() {
        return (Unit.IsVisible = true)
    }
}
