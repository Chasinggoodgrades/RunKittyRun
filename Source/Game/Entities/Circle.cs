using WCSharp.Api;

public class Circle
{
    private const int CIRCLE_UNIT_MODEL = Constants.UNIT_KITTY_CIRCLE;
    private static rect CIRCLE_SPAWN_REGION = Regions.Circle_Area.Rect;
    private int ID {  get; set; }
    public player Player { get; set; }
    public unit Unit { get; set; }
    public trigger Collision { get; set; }

    public Circle(player player)
    {
        Player = player;
        ID = player.Id;
        Collision = trigger.Create();
        CreateCircle();
    }

    private void CreateCircle()
    {
        Unit = unit.Create(Player, CIRCLE_UNIT_MODEL, CIRCLE_SPAWN_REGION.CenterX, CIRCLE_SPAWN_REGION.CenterY);
        Utility.MakeUnitLocust(Unit);
        Globals.ALL_CIRCLES.Add(Player, this);
        Unit.IsVisible = false;
    }

    public void Dispose()
    {
        Unit.Dispose();
        Collision.Dispose();
        Globals.ALL_CIRCLES.Remove(Player);
    }

    public void KittyDied(Kitty kitty)
    {
        Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
        ShowCircle();
    }

    public void SetMana(float mana, int maxMana, float regenRate)
    {
        Unit.Mana = mana;
        Unit.MaxMana = maxMana;
        Unit.ManaRegeneration = regenRate;
    }

    public void HideCircle() => Unit.IsVisible = false;


    private void ShowCircle() => Unit.IsVisible = true;

}
