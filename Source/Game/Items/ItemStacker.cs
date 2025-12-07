using System;
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
            item pickedUpItem = @event.ManipulatedItem;
            var itemID = pickedUpItem.TypeId;
            if (!StackableItem(itemID)) return;
            var unit = @event.Unit;

            item existingItem = null;
            for (int slot = 1; slot <= 6; slot++)
            {
                var invItem = Blizzard.UnitItemInSlotBJ(unit, slot);
                if (invItem != null && invItem != pickedUpItem && invItem.TypeId == itemID)
                {
                    existingItem = invItem;
                    break;
                }
            }

            if (existingItem == null) return;

            pickedUpItem.Owner = unit.Owner;
            var itemCharges = pickedUpItem.Charges;
            existingItem.Charges += Math.Max(1, itemCharges);
            pickedUpItem.Dispose();
        }
        catch (System.Exception e)
        {
            Logger.Critical(e.Message);
            throw;
        }
    }


    private static bool StackableItem(int itemID)
    {
        return StackableItemIDs.Contains(itemID);
    }
}
