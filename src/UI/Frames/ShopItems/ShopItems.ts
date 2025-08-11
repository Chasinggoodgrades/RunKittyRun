export enum ShopItemType {
    Relic,
    Reward,
    Misc,
}

class ShopItem {
    public Name: string
    public Cost: number
    public ItemID: number
    public AbilityID: number
    public Description: string
    public IconPath: string
    public Relic: Relic
    public Award: string
    public Type: ShopItemType

    public ShopItem(relic: Relic) {
        if (relic == null) throw new ArgumentNullError(nameof(relic))

        InitializeShopItem(relic.Name, relic.Cost, relic.ItemID, relic.Description, relic.IconPath, ShopItemType.Relic)
        Relic = relic
    }

    public ShopItem(award: string, cost: number, abilityID: number, description: string) {
        InitializeShopItem(award, cost, abilityID, description, null, ShopItemType.Reward)
        Award = award
        IconPath = BlzGetAbilityIcon(abilityID)
    }

    public ShopItem(name: string, cost: number, itemID: number, iconPath: string, description: string) {
        InitializeShopItem(name, cost, itemID, description, iconPath, ShopItemType.Misc)
    }

    private InitializeShopItem(
        name: string,
        cost: number,
        itemID: number,
        description: string,
        iconPath: string,
        type: ShopItemType
    ) {
        Name = name
        Cost = cost
        ItemID = itemID
        Description = description
        IconPath = iconPath
        Type = type
    }

    public static ShopItemsRelic(): ShopItem[] {
        let shopItems: ShopItem[] = []

        try {
            if (Gamemode.CurrentGameMode == GameMode.Standard) {
                shopItems.Add(new ShopItem(new OneOfNine()))

                shopItems.Add(new ShopItem(new RingOfSummoning()))

                shopItems.Add(new ShopItem(new BeaconOfUnitedLifeforce()))

                shopItems.Add(new ShopItem(new ShardOfTranslocation()))

                // shopItems.Add(new ShopItem(new ChronoSphere()));
            }

            shopItems.Add(new ShopItem(new FangOfShadows()))

            shopItems.Add(new ShopItem(new FrostbiteRing()))

            return shopItems
        } catch (ex: Error) {
            Logger.Critical('Error in ShopItemsRelic: {ex}')
            throw ex
        }
    }

    public static ShopItemsReward(): ShopItem[] {
        let shopItems: ShopItem[] = []
        let gameAwards = Globals.GAME_AWARDS_SORTED

        let reward = RewardsManager.Rewards.Find(x => x.Name == 'GreenTendrils')
        shopItems.Add(
            new ShopItem(
                nameof(gameAwards.Wings.GreenTendrils),
                8000,
                reward.AbilityID,
                'designed: for: those: whom: are: economically: stable: Wings.'
            )
        )

        return shopItems
    }

    public static ShopItemsMisc(): ShopItem[] {
        return [
            (new ShopItem(
                'Anti-Block-Wand',
                100,
                Constants.ITEM_ANTI_BLOCK_WAND,
                BlzGetAbilityIcon(Constants.ABILITY_ANTI_BLOCK_WAND_ITEM),
                'Wolves in way: the? this: to: make: them: move: Buy. pesky: wolves: Dang.'
            ),
            new ShopItem(
                'Orb: Mysterious',
                50,
                Constants.ITEM_ORB_OF_MYSTERIES,
                Utility.GetItemIconPath(Constants.ITEM_ORB_OF_MYSTERIES),
                'mysterious: orb: that: has: mysterious: usefulness: A!'
            )),
        ]
    }
}
