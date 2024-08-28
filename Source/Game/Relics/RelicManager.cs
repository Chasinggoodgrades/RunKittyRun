using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RelicManager
{
    private static trigger PICKUP_EVENT_TRIGGER;
    private static trigger DROP_EVENT_TRIGGER;
    private static List<int> RelicIDs;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[0]) return;
        RegisterEvents();
        RelicEffects.Initialize();
    }

    private static void RegisterEvents()
    {
        PICKUP_EVENT_TRIGGER = CreateTrigger();
        DROP_EVENT_TRIGGER = CreateTrigger();

        // REGISTER PICKUP EVENT
        foreach (var player in Globals.ALL_PLAYERS)
            TriggerRegisterPlayerUnitEvent(PICKUP_EVENT_TRIGGER, player, EVENT_PLAYER_UNIT_PICKUP_ITEM, null);
        TriggerAddAction(PICKUP_EVENT_TRIGGER, HandlePickup);
        // REGISTER DROP EVENT
        foreach(var player in Globals.ALL_PLAYERS)
            TriggerRegisterPlayerUnitEvent(DROP_EVENT_TRIGGER, player, EVENT_PLAYER_UNIT_DROP_ITEM, null);
        TriggerAddAction(DROP_EVENT_TRIGGER, HandleDrop);

        // REGISTER RELICS
        RelicIDs = RelicRegisteration();
    }

    private static List<int> RelicRegisteration()
    {
        return new List<int>
        {
            Constants.ITEM_AMULET_OF_EVASIVENESS,
            Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE,
            Constants.ITEM_FANG_OF_SHADOWS,
            Constants.ITEM_SACRED_RING_OF_SUMMONING,
            Constants.ITEM_ONE_OF_NINE,
            Constants.ITEM_FROSTBITE_RING,
        };
    }

    private static void HandlePickup()
    {
        var item = GetManipulatedItem();

        var player = GetTriggerPlayer();
        var unit = GetTriggerUnit();
        var kitty = Globals.ALL_KITTIES[player];

        if (!RelicIDs.Contains(item.TypeId)) return;

        // Theres the ability to have more than 1 relic, but i'm creating this with the intention of 1 relic
        if (kitty.Relics.Count != 0 || !kitty.CanBuyRelic)
        {
            RefundHandler(player, item);
            return;
        }
        kitty.Relics.Add(item);
        RelicEffects.HandleRelicEffect(player, item, true);
    }

    private static void HandleDrop()
    {
        var item = GetManipulatedItem();
        var player = GetTriggerPlayer();
        var kitty = Globals.ALL_KITTIES[player];
        if (!RelicIDs.Contains(item.TypeId)) return;
        if (kitty.Relics.Count == 0) return;
        RelicEffects.HandleRelicEffect(player, item, false);
        kitty.Relics.Remove(item);
    }
    private static void RefundHandler(player Player, item Item)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        var itemCost = 650; // Theres no built in function to determine item cost, so it's just gonna be set at 650. 
        if (kitty.Unit.Level < 10)
            Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You must have reached level 10 to purchase a relic.|r");
        else if (kitty.Relics.Count != 0)
            Player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}You already have a relic!|r");
        else
            Console.WriteLine($"{Colors.COLOR_RED}Error Refunding, report to developer.|r {Colors.COLOR_GOLD}Relic Manager: {Item.Name}|r");
        Player.Gold += itemCost;
        kitty.Unit.RemoveItem(Item);
        Item.Dispose();
    }

}