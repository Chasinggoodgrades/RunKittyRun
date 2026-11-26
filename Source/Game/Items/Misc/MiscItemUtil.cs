using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class MiscItemUtil
{
    /// <summary>
    /// Buys a behaviour-carrying misc item. The caller has already verified the player can afford it.
    /// </summary>
    public static void HandlePurchase(player player, ShopItem shopItem, Kitty kitty)
    {
        try
        {
            if (Utility.UnitHasItem(kitty.Unit, shopItem.ItemID))
            {
                player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already own this item!{Colors.COLOR_RESET}");
                return;
            }

            if (!HasInventorySpace(kitty.Unit))
            {
                player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You do not have enough inventory space to purchase this item!{Colors.COLOR_RESET}");
                return;
            }

            var miscItem = Activator.CreateInstance(shopItem.MiscItem.GetType()) as MiscItem;
            if (miscItem == null) return;

            player.Gold -= shopItem.Cost;
            kitty.MiscItems.Add(miscItem);
            miscItem.ApplyEffect(kitty.Unit);
            kitty.Unit.AddItem(shopItem.ItemID);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in MiscItemUtil.HandlePurchase: {e.Message}");
        }
    }

    /// <summary>
    /// Sells a behaviour-carrying misc item, tearing its effect down first. Returns true if sold.
    /// </summary>
    public static bool HandleSell(player player, ShopItem shopItem, Kitty kitty)
    {
        try
        {
            if (!kitty.Alive)
            {
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell this item while your kitty is dead!{Colors.COLOR_RESET}");
                return false;
            }

            var owned = kitty.MiscItems.Find(x => x.GetType() == shopItem.MiscItem.GetType());
            owned?.RemoveEffect(kitty.Unit);
            kitty.MiscItems.Remove(owned);
            Utility.RemoveItemFromUnit(kitty.Unit, shopItem.ItemID);
            player.Gold += shopItem.Cost;
            return true;
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in MiscItemUtil.HandleSell: {e.Message}");
            return false;
        }
    }

    /// <summary>
    /// Tears down every misc item effect the kitty owns, e.g. on a full game reset.
    /// </summary>
    public static void RemoveAll(Kitty kitty)
    {
        for (int i = 0; i < kitty.MiscItems.Count; i++)
            kitty.MiscItems[i]?.RemoveEffect(kitty.Unit);
        kitty.MiscItems = new List<MiscItem>();
    }

    private static bool HasInventorySpace(unit unit)
    {
        for (int i = 0; i < 6; i++)
            if (unit.ItemAtOrDefault(i) == null) return true;
        return false;
    }
}
