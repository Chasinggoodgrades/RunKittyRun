using System.Collections.Generic;
using WCSharp.Api;

public static class UniqueItems
{
    private static trigger Trigger;
    private static List<Uniques> UniqueList;
    public static void Initialize()
    {
        UniqueList = UniqueItemList();
        Trigger = RegisterEvents();
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
    private static trigger RegisterEvents()
    {
        var trig = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            _ = trig.RegisterPlayerUnitEvent(player, playerunitevent.PickupItem);
        _ = trig.AddAction(ItemPickup);
        return trig;
    }


    private static void ItemPickup()
    {
        var item = @event.ManipulatedItem;
        var player = @event.Player;
        var kitty = @event.Unit;
        var uniqueItem = UniqueList.Find(u => u.ItemID == item.TypeId);

        if (uniqueItem == null) return;
        if (Utility.UnitHasItemCount(kitty, item.TypeId) <= 1) return;

        player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}You may only carry one of each unique item.|r");
        player.Gold += uniqueItem.GoldCost;
        item.Dispose();
        return;
    }
}

public class Uniques
{
    public int ItemID;
    public int GoldCost;

    public Uniques(int itemID, int goldCost)
    {
        ItemID = itemID;
        GoldCost = goldCost;
    }
}