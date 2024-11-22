using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class ItemStacker
{
    private static trigger PickupTrigger;
    private static List<int> StackableItemIDs;
    public static void Initialize()
    {
        RegisterItemList();
        RegisterEvents();
    }

    private static List<int> RegisterItemList()
    {
        if (StackableItemIDs != null) return StackableItemIDs;
        StackableItemIDs = new List<int>
        {
            Constants.ITEM_ADRENALINE_POTION,
            Constants.ITEM_HEALING_WATER,
            Constants.ITEM_ELIXIR,
            Constants.ITEM_ANTI_BLOCK_WAND
        };
        return StackableItemIDs;
    }

    private static trigger RegisterEvents()
    {
        PickupTrigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            PickupTrigger.RegisterPlayerUnitEvent(player, playerunitevent.PickupItem, null);
        PickupTrigger.AddAction(StackActions);
        return PickupTrigger;
    }

    private static void StackActions()
    {
        var item = @event.ManipulatedItem;
        var itemID = item.TypeId;
        if (!StackableItem(itemID)) return;
        var unit = @event.Unit;
        var heldItem = Utility.UnitGetItem(unit, itemID);
        if (heldItem == item) return;
        if (heldItem == null) return;
        item.Dispose();
        heldItem.Charges += 1;
    }


    private static bool StackableItem(int itemID)
    {
        return StackableItemIDs.Contains(itemID);
    }





}