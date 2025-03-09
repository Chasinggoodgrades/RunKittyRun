using WCSharp.Api;
public class AmuletOfEvasiveness : Relic
{
    public const int RelicItemID = Constants.ITEM_AMULET_OF_EVASIVENESS;
    public static float AMULET_UPGRADE_WW_COLLISION_REDUCTION = 0.02f; // 2%
    public static float WINDWALK_COLLISION_DURATION = 5.0f;
    private static float AMULET_UPGRADE_COLLISION_REDUCTION = 0.01f; // 1%
    private static float AMULET_OF_EVASIVENESS_COLLSION_REDUCTION = 0.10f; // 10%
    private static new string IconPath = "ReplaceableTextures\\CommandButtons\\BTNTalisman.blp";
    private const int RelicCost = 650;
    private static float UnitScale = 0.60f - (0.60f * AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 2.0f);

    public AmuletOfEvasiveness() : base(
        $"{Colors.COLOR_LAVENDER}Amulet of Evasiveness|r",
        $"Makes you smaller and reduces collision range by {Colors.COLOR_ORANGE}{(int)(AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 100)}%|r{Colors.COLOR_LIGHTBLUE} (Passive)|r",
        0,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Collision reduced by 1% per upgrade level.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Windwalk reduces your collision range by an additional 2% for {WINDWALK_COLLISION_DURATION} seconds.", 20, 1000));

    }

    public override void ApplyEffect(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var newCollisionRadius = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * GetCollisionReduction(Unit);
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = newCollisionRadius;
        CollisionDetection.KittyRegisterCollisions(kitty);
        Utility.SimpleTimer(0.1f, () => ScaleUnit(Unit));
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

    public static float GetCollisionReduction(unit Unit)
    {
        var player = Unit.Owner;
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
        return 1.0f - AMULET_OF_EVASIVENESS_COLLSION_REDUCTION - (AMULET_UPGRADE_COLLISION_REDUCTION * upgradeLevel);
    }

    /// <summary>
    /// Changes the visual scale of the unit assuming they have the relic. This is particularly used whenever the player casts reset.
    /// References: <see cref="RewardsManager.CastedReward"/> and <see cref="Reward.SetSkin(player)"/>
    /// </summary>
    /// <param name="Unit">The unit to scale.</param>
    public static void ScaleUnit(unit Unit)
    {
        if (!Utility.UnitHasItem(Unit, RelicItemID)) return;

        // Scale based on upgrade level
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
        var scale = UnitScale - (AMULET_UPGRADE_COLLISION_REDUCTION * upgradeLevel);

        Unit.SetScale(scale, scale, scale);
    }

    /// <summary>
    /// Upgrade Level 2, Windwalk Collision Reduction
    /// </summary>
    /// <param name="Unit"></param>
    public static void AmuletWindwalkEffect(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
        if (upgradeLevel < 2) return;
        var newCollisionRadius = GetCollisionReduction(Unit) - AMULET_UPGRADE_WW_COLLISION_REDUCTION;
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        CollisionDetection.KITTY_COLLISION_RADIUS[player] = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * newCollisionRadius;
        CollisionDetection.KittyRegisterCollisions(kitty);

        var t = timer.Create();
        t.Start(WINDWALK_COLLISION_DURATION, false, () =>
        {
            CollisionDetection.KITTY_COLLISION_RADIUS[player] = GetCollisionReduction(Unit);
            CollisionDetection.KittyRegisterCollisions(kitty);
            t.Dispose();
        });
    }

}