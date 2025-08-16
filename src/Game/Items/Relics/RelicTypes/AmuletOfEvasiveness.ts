//

//class AmuletOfEvasiveness extends Relic
//{
//    public number RelicItemID = Constants.ITEM_AMULET_OF_EVASIVENESS;
//    public static number AMULET_UPGRADE_WW_COLLISION_REDUCTION = 0.02; // 2%
//    public static number WINDWALK_COLLISION_DURATION = 5.0;
//    private static number AMULET_UPGRADE_COLLISION_REDUCTION = 0.01; // 1%
//    private static number AMULET_OF_EVASIVENESS_COLLSION_REDUCTION = 0.10; // 10%
//    private static string IconPath = "ReplaceableTextures\\CommandButtons\\BTNTalisman.blp";
//    private number RelicCost = 650;
//    private static number UnitScale = 0.60 - (0.60 * AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 2.0);

//    public AmuletOfEvasiveness() // TODO; CALL super(
//        `${Colors.COLOR_LAVENDER}Amulet of Evasiveness|r`,
//        `Makes you smaller and reduces collision range by ${Colors.COLOR_ORANGE}${(AMULET_OF_EVASIVENESS_COLLSION_REDUCTION * 100)}%|r${Colors.COLOR_LIGHTBLUE} (Passive)|r`,
//        0,
//        RelicItemID,
//        RelicCost,
//        IconPath
//        )
//    {
//        Upgrades.push(new RelicUpgrade(0, "Collision reduced by 1% per upgrade level.", 15, 800));
//        Upgrades.push(new RelicUpgrade(1, `Windwalk reduces your collision range by an additional 2% for ${WINDWALK_COLLISION_DURATION} seconds.`, 20, 1000));
//    }

//    public override ApplyEffect(unit Unit)
//    {
//        let player = Unit.owner;
//        let kitty = Globals.ALL_KITTIES.get(player)!;
//        let newCollisionRadius = DEFAULT_WOLF_COLLISION_RADIUS * GetCollisionReduction(Unit);
//        UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty);
//        kitty.CurrentStats.CollisonRadius = newCollisionRadius;
//        CollisionDetection.KittyRegisterCollisions(kitty);
//        Utility.SimpleTimer(0.1, () => ScaleUnit(Unit));
//    }

//    public override RemoveEffect(unit Unit)
//    {
//        let player = Unit.owner;
//        let kitty = Globals.ALL_KITTIES.get(player)!;
//        UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty);
//        kitty.CurrentStats.CollisonRadius = DEFAULT_WOLF_COLLISION_RADIUS;
//        Unit.setScale(0.60, 0.60, 0.60);
//        CollisionDetection.KittyRegisterCollisions(kitty);
//    }

//    public static number GetCollisionReduction(unit Unit)
//    {
//        let player = Unit.owner;
//        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
//        return 1.0 - AMULET_OF_EVASIVENESS_COLLSION_REDUCTION - (AMULET_UPGRADE_COLLISION_REDUCTION * upgradeLevel);
//    }

//    /// <summary>
//    /// Changes the visual scale of the unit assuming they have the relic. This is particularly used whenever the player casts reset.
//    /// References: <see cref="RewardsManager.CastedReward"/> and <see cref="Reward.SetSkin(player)"/>
//    /// </summary>
//    /// <param name="Unit">The unit to scale.</param>
//    public static ScaleUnit(unit Unit)
//    {
//        if (!Utility.UnitHasItem(Unit, RelicItemID)) return;

//        // Scale based on upgrade level
//        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.owner).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
//        let scale = UnitScale - (AMULET_UPGRADE_COLLISION_REDUCTION * upgradeLevel);

//        Unit.setScale(scale, scale, scale);
//    }

//    /// <summary>
//    /// Upgrade Level 2, Windwalk Collision Reduction
//    /// </summary>
//    /// <param name="Unit"></param>
//    public static AmuletWindwalkEffect(unit Unit)
//    {
//        let player = Unit.owner;
//        let kitty = Globals.ALL_KITTIES.get(player)!;
//        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(typeof(AmuletOfEvasiveness));
//        if (upgradeLevel < 2) return;
//        let newCollisionRadius = GetCollisionReduction(Unit) - AMULET_UPGRADE_WW_COLLISION_REDUCTION;
//        UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty);
//        kitty.CurrentStats.CollisonRadius = DEFAULT_WOLF_COLLISION_RADIUS * newCollisionRadius;
//        CollisionDetection.KittyRegisterCollisions(kitty);

//        let t = createAchesTimer()
//        t.Timer.start(WINDWALK_COLLISION_DURATION, false, () =>
//        {
//            kitty.CurrentStats.CollisonRadius = GetCollisionReduction(Unit);
//            CollisionDetection.KittyRegisterCollisions(kitty);
//            t.dispose();
//        });
//    }
//}
