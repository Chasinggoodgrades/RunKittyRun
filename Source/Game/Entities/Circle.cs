using WCSharp.Api;
using static WCSharp.Api.Common;

public class Circle
{
    private const int CIRCLE_UNIT_MODEL = Constants.UNIT_KITTY_CIRCLE;
    private static rect CIRCLE_SPAWN_REGION = Regions.Circle_Area.Rect;
    private int ID { get; set; }
    public player Player { get; set; }
    public unit Unit { get; set; }
    public trigger Collision { get; set; }
    private effect protectionEffect; // shown while the dead Kitty is protected and about to be revived

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
        GC.RemoveEffect(ref protectionEffect);
        Unit.Dispose();
        Collision.Dispose();
        Globals.ALL_CIRCLES.Remove(Player);
    }

    public void KittyDied(ICircleOwner owner)
    {
        Unit.SetPosition(owner.Unit.X, owner.Unit.Y);
        ShowCircle();
    }

    public void SetMana(float mana, int maxMana, float regenRate)
    {
        Unit.Mana = mana;
        Unit.MaxMana = maxMana;
        Unit.ManaRegeneration = regenRate;
    }

    /// <summary>Puts an effect on the circle (call after KittyDied, when it is shown). Gone when the circle hides.</summary>
    public void ShowProtection(string model)
    {
        if (protectionEffect != null) return;

        protectionEffect = AddSpecialEffectTarget(model, Unit, "origin");
    }

    public void ClearProtection() => GC.RemoveEffect(ref protectionEffect);

    public void HideCircle()
    {
        ClearProtection();
        Unit.IsVisible = false;
    }

    private void ShowCircle() => Unit.IsVisible = true;
}
