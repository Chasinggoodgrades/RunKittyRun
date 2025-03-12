using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class UniqueItems
{
    private static trigger Trigger = trigger.Create();
    private static List<Uniques> UniqueList = new List<Uniques>();
    public static void Initialize()
    {
        try
        {
            UniqueList = UniqueItemList();
            RegisterEvents();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in UniqueItems.Initialize. {e.Message}");
            throw;
        }
    }

    private static List<Uniques> UniqueItemList()
    {
        return new List<Uniques>
        {
            new Uniques(Constants.ITEM_ENERGY_STONE, 200),
            new Uniques(Constants.ITEM_PEGASUS_BOOTS, 175),
            new Uniques(Constants.ITEM_RITUAL_MASK, 400),
            new Uniques(Constants.ITEM_MEDITATION_CLOAK, 375),
        };
    }
    private static void RegisterEvents()
    {
        Blizzard.TriggerRegisterAnyUnitEventBJ(Trigger, playerunitevent.PickupItem);
        Trigger.AddAction(ItemPickup);
    }


    private static void ItemPickup()
    {
        try
        {
            var item = @event.ManipulatedItem;
            var player = @event.Player;
            var kitty = @event.Unit;

            if (item.TypeId == 0) Logger.Warning("Unique item bug, item ID is 0");

            if (!Uniques.UniqueIDs.Contains(item.TypeId)) return;
            var uniqueItem = UniqueList.Find(u => u.ItemID == item.TypeId);
            if (uniqueItem == null) return;
            if (Utility.UnitHasItemCount(kitty, item.TypeId) <= 1) return;

            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}You may only carry one of each unique item.|r");
            player.Gold += uniqueItem.GoldCost;
            item.Dispose();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in UniqueItems.ItemPickup. {e.Message}");
            throw;
        }
    }
}

public class Uniques
{
    public static List<int> UniqueIDs = new List<int>();
    public int ItemID;
    public int GoldCost;
    
    public Uniques(int itemID, int goldCost)
    {
        ItemID = itemID;
        GoldCost = goldCost;
        UniqueIDs.Add(itemID);
    }
}