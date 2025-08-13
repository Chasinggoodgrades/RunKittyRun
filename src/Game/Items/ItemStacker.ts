export class ItemStacker {
    private static PickupTrigger: Trigger
    private static StackableItemIDs: number[]

    public static Initialize() {
        RegisterItemList()
        RegisterEvents()
    }

    /// <summary>
    /// List of all the stackable items... Easy way to add more if needed.
    /// </summary>
    /// <returns></returns>
    private static RegisterItemList(): number[] {
        if (StackableItemIDs != null) return StackableItemIDs
        StackableItemIDs = [
            Constants.ITEM_ADRENALINE_POTION,
            Constants.ITEM_HEALING_WATER,
            Constants.ITEM_ELIXIR,
            Constants.ITEM_ANTI_BLOCK_WAND,
        ]
        return StackableItemIDs
    }

    private static RegisterEvents(): Trigger {
        let PickupTrigger = Trigger.create()!
        PickupTrigger.registerAnyUnitEvent(playerunitevent.PickupItem)
        PickupTrigger.addAction(StackActions)
        return PickupTrigger
    }

    private static StackActions() {
        try {
            let item: item = GetManipulatedItem()
            let itemID = item.TypeId
            if (!StackableItem(itemID)) return
            let unit = getTriggerUnit()
            let heldItem = Utility.UnitGetItem(unit, itemID)
            item.owner = unit.owner
            if (heldItem == item) return
            if (heldItem == null) return
            let itemCharges = item.Charges
            if (itemCharges > 1) heldItem.Charges += itemCharges
            else heldItem.Charges += 1
            item.destroy()
            item = null
        } catch (e: any) {
            Logger.Critical(e.Message)
            throw e
        }
    }

    private static StackableItem(itemID: number) {
        return StackableItemIDs.includes(itemID)
    }
}
