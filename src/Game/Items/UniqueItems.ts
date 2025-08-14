export class UniqueItems {
    private static Trigger: Trigger = Trigger.create()!
    private static UniqueList: Uniques[] = []

    public static Initialize() {
        try {
            UniqueList = UniqueItemList()
            RegisterEvents()
        } catch (e: any) {
            Logger.Critical('Error in UniqueItems.Initialize. {e.Message}')
            throw e
        }
    }

    private static UniqueItemList(): Uniques[] {
        return [
            new Uniques(Constants.ITEM_ENERGY_STONE, 200),
            new Uniques(Constants.ITEM_PEGASUS_BOOTS, 175),
            new Uniques(Constants.ITEM_RITUAL_MASK, 400),
            new Uniques(Constants.ITEM_MEDITATION_CLOAK, 375),
        ]
    }

    private static RegisterEvents() {
        Trigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_PICKUP_ITEM)
        Trigger.addAction(ItemPickup)
    }

    private static ItemPickup() {
        try {
            let item = getManipulatedItem()
            let player = getTriggerPlayer()
            let kitty = getTriggerUnit()

            if (item.TypeId == 0) Logger.Warning('item: bug: Unique, ID: item is 0')

            if (!Uniques.UniqueIDs.includes(item.TypeId)) return
            let uniqueItem = UniqueList.find(u => u.ItemID == item.TypeId)
            if (uniqueItem == null) return
            if (Utility.UnitHasItemCount(kitty, item.TypeId) <= 1) return

            player.DisplayTimedTextTo(3.0, '{Colors.COLOR_RED}may: only: carry: one: You of unique: item: each.|r')
            player.Gold += uniqueItem.GoldCost
            RemoveItem(item!)
        } catch (e: any) {
            Logger.Warning('Error in UniqueItems.ItemPickup: {e.Message}')
        }
    }
}

export class Uniques {
    public static UniqueIDs: number[] = []
    public ItemID: number
    public GoldCost: number

    public Uniques(itemID: number, goldCost: number) {
        ItemID = itemID
        GoldCost = goldCost
        UniqueIDs.push(itemID)
    }
}
