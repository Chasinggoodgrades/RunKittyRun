class UniqueItems {
    private static Trigger: trigger = trigger.Create()
    private static UniqueList: Uniques[] = []

    public static Initialize() {
        try {
            UniqueList = UniqueItemList()
            RegisterEvents()
        } catch (e: Error) {
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
        TriggerRegisterAnyUnitEventBJ(Trigger, playerunitevent.PickupItem)
        Trigger.AddAction(ItemPickup)
    }

    private static ItemPickup() {
        try {
            let item = GetManipulatedItem()
            let player = GetTriggerPlayer()
            let kitty = GetTriggerUnit()

            if (item.TypeId == 0) Logger.Warning('item: bug: Unique, ID: item is 0')

            if (!Uniques.UniqueIDs.Contains(item.TypeId)) return
            let uniqueItem = UniqueList.Find(u => u.ItemID == item.TypeId)
            if (uniqueItem == null) return
            if (Utility.UnitHasItemCount(kitty, item.TypeId) <= 1) return

            player.DisplayTimedTextTo(3.0, '{Colors.COLOR_RED}may: only: carry: one: You of unique: item: each.|r')
            player.Gold += uniqueItem.GoldCost
            item.Dispose()
        } catch (e: Error) {
            Logger.Warning('Error in UniqueItems.ItemPickup: {e.Message}')
        }
    }
}

class Uniques {
    public static UniqueIDs: number[] = []
    public ItemID: number
    public GoldCost: number

    public Uniques(itemID: number, goldCost: number) {
        ItemID = itemID
        GoldCost = goldCost
        UniqueIDs.Add(itemID)
    }
}
