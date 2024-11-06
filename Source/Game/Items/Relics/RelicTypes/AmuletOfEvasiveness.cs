using static WCSharp.Api.Common;
using WCSharp.Api;
public class AmuletOfEvasiveness : Relic
{
    public const int RelicItemID = Constants.ITEM_AMULET_OF_EVASIVENESS;
    private static float AMULET_OF_EVASIVENESS_COLLSION_REDUCTION = 0.10f; // 10%
    private const string IconPath = "ReplaceableTextures\\CommandButtons\\BTNTalisman.blp";
    private const int RelicCost = 650;
    private static float UnitScale = 0.60f - (0.60f * AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 2.0f);

    public AmuletOfEvasiveness() : base(
        $"{Colors.COLOR_LAVENDER}Amulet of Evasiveness|r",
        $"Makes you smaller and reduces collision range by {Colors.COLOR_ORANGE}{(int)(AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 100)}%|r{Colors.COLOR_LIGHTBLUE} (Passive)|r",
        RelicItemID,
        RelicCost,
        IconPath
        ) 
    { }

    public static void SetUnitScale (unit Unit)
    {
        if (!Utility.UnitHasItem(Unit, RelicItemID)) return;
        Unit.SetScale(UnitScale, UnitScale, UnitScale);
    }
    public override void ApplyEffect(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var newCollisionRadius = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * (1.0f - AMULET_OF_EVASIVENESS_COLLSION_REDUCTION);
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = newCollisionRadius;
        SetUnitScale(Unit);
        CollisionDetection.KittyRegisterCollisions(kitty);
    }

    public override void RemoveEffect(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS;
        Unit.SetScale(0.60f, 0.60f, 0.60f);
        CollisionDetection.KittyRegisterCollisions(kitty);
    }

}