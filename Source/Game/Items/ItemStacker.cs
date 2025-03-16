using System.Collections.Generic;
using WCSharp.Api;

public static class ItemStacker
{
    private static trigger PickupTrigger;
    private static List<int> StackableItemIDs;

    public static void Initialize()
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

    private static trigger RegisterEvents()
    {
        PickupTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(PickupTrigger, playerunitevent.PickupItem);
        PickupTrigger.AddAction(StackActions);
        return PickupTrigger;
    }

    private static void StackActions()
    {
        try
        {
            var item = @event.ManipulatedItem;
            var itemID = item.TypeId;
            if (!StackableItem(itemID)) return;
            var unit = @event.Unit;
            var heldItem = Utility.UnitGetItem(unit, itemID);
            item.Owner = unit.Owner;
            if (heldItem == item) return;
            if (heldItem == null) return;
            var itemCharges = item.Charges;
            if (itemCharges > 1) heldItem.Charges += itemCharges;
            else heldItem.Charges += 1;
            item.Dispose();
            item = null;
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in Stack Actions: {e.Message}");
            throw;
        }
    }

    private static bool StackableItem(int itemID)
    {
        return StackableItemIDs.Contains(itemID);
    }
}
