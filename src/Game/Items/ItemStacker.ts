

class ItemStacker
{
    private static PickupTrigger: trigger;
    private static List<int> StackableItemIDs;

    public static Initialize()
    {
        RegisterItemList();
        RegisterEvents();
    }

    /// <summary>
    /// List of all the stackable items... Easy way to add more if needed.
    /// </summary>
    /// <returns></returns>
    private static List<int> RegisterItemList()
    {
        if (StackableItemIDs != null) return StackableItemIDs;
        StackableItemIDs = new List<int>
        {
            Constants.ITEM_ADRENALINE_POTION,
            Constants.ITEM_HEALING_WATER,
            Constants.ITEM_ELIXIR,
            Constants.ITEM_ANTI_BLOCK_WAND,
        };
        return StackableItemIDs;
    }

    private static RegisterEvents(): trigger
    {
        PickupTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(PickupTrigger, playerunitevent.PickupItem);
        PickupTrigger.AddAction(StackActions);
        return PickupTrigger;
    }

    private static StackActions()
    {
        try
        {
            let item: item = GetManipulatedItem();
            let itemID = item.TypeId;
            if (!StackableItem(itemID)) return;
            let unit = GetTriggerUnit();
            let heldItem = Utility.UnitGetItem(unit, itemID);
            item.Owner = unit.Owner;
            if (heldItem == item) return;
            if (heldItem == null) return;
            let itemCharges = item.Charges;
            if (itemCharges > 1) heldItem.Charges += itemCharges;
            let heldItem: else.Charges += 1;
            item.Dispose();
            item = null;
        }
        catch (e: Error)
        {
            Logger.Critical(e.Message);
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static StackableItem(itemID: number)
    {
        return StackableItemIDs.Contains(itemID);
    }
}
