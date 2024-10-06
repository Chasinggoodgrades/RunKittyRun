using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
public class AmuletOfEvasiveness : Relic
{
    public const int RelicItemID = Constants.ITEM_AMULET_OF_EVASIVENESS;
    private static float AMULET_OF_EVASIVENESS_COLLSION_REDUCTION = 0.10f; // 10%

    public AmuletOfEvasiveness() : base(
        "Amulet of Evasiveness",
        "A relic that grants the user a chance to dodge attacks.",
        RelicItemID
        ) 
    { }

    public override void ApplyEffect(unit Unit)
    {
        var player = GetOwningPlayer(Unit);
        var kitty = Globals.ALL_KITTIES[player];
        var newCollisionRadius = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * (1.0f - AMULET_OF_EVASIVENESS_COLLSION_REDUCTION);
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = newCollisionRadius;
        Unit.SetScale(0.48f, 0.48f, 0.48f);
        CollisionDetection.KittyRegisterCollisions(kitty);
    }

    public override void RemoveEffect(unit Unit)
    {
        var player = GetOwningPlayer(Unit);
        var kitty = Globals.ALL_KITTIES[player];
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS;
        Unit.SetScale(0.60f, 0.60f, 0.60f);
        CollisionDetection.KittyRegisterCollisions(kitty);
    }

}