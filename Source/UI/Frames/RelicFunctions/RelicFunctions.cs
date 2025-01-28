using System;
using WCSharp.Api;

public static class RelicFunctions
{
    public static void HandleRelicPurchase(player player, ShopItem selectedItem, Kitty kitty)
    {
        try
        {
            if (Utility.UnitHasItem(kitty.Unit, selectedItem.ItemID))
            {
                AlreadyHaveRelic(player);
                return;
            }

            if (!RelicLevel(kitty.Unit))
            {
                NotHighEnoughLevel(player);
                return;
            }

            if (!HasInventorySpace(kitty.Unit))
            {
                player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You do not have enough inventory space to purchase this relic!|r");
                return;
            }

            if (!CanGetAnotherRelic(kitty.Unit)) return;

            if (RelicMaxedOut(player)) return;

            ReduceGold(player, selectedItem.Cost);
            var newRelic = Activator.CreateInstance(selectedItem.Relic.GetType()) as Relic;
            if (newRelic != null)
            {
                kitty.Relics.Add(newRelic);
                newRelic.ApplyEffect(kitty.Unit);
                AddItem(player, selectedItem.ItemID);
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            throw;
        }
    }

    public static void UpgradeRelic()
    {
        var player = @event.Player;
        if (player.IsLocal)
        {
            ShopFrame.upgradeButton.Visible = false; ShopFrame.upgradeButton.Visible = true;
        }
        if (ShopFrame.SelectedItems.TryGetValue(player, out var selectedItem) && selectedItem != null)
        {
            var itemID = selectedItem.ItemID;
            var relicType = selectedItem.Relic.GetType();
            var playerRelic = Globals.ALL_KITTIES[player].Relics.Find(x => x.GetType() == relicType);
            var playerUpgrades = PlayerUpgrades.GetPlayerUpgrades(player);
            if (playerRelic == null) return;
            var goldCost = playerRelic.GetCurrentUpgrade().Cost;
            if (ActiveShadowKitty(player)) return;
            if (player.Gold < goldCost)
            {
                ShopFrame.NotEnoughGold(player, goldCost);
                return;
            }
            if (playerRelic.Upgrade(Globals.ALL_KITTIES[player].Unit))
            {
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}You've upgraded {playerRelic.Name}.");
                player.Gold -= goldCost;
                if (player.IsLocal) ShopFrame.RefreshUpgradeTooltip(playerRelic);
            }
            else
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}You've reached the maximum upgrade level for {playerRelic.Name}.");
        }
    }

    private static bool HasInventorySpace(unit unit)
    {
        for(int i = 0; i < 6; i++)
            if (unit.ItemAtOrDefault(i) == null) return true;
        return false;
    }

    private static void ReduceGold(player player, int amount) => player.Gold -= amount;
    private static bool RelicLevel(unit unit) => unit.Level >= Relic.RequiredLevel;

    private static void NotHighEnoughLevel(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You are not high enough level to purchase this shopItem!|r {Colors.COLOR_YELLOW}(Level {Relic.RequiredLevel})");
    private static void AlreadyHaveRelic(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already own this shopItem!");
    private static void AddItem(player player, int itemID) => Globals.ALL_KITTIES[player].Unit.AddItem(itemID);
    private static bool RelicMaxedOut(player player)
    {
        var relics = Globals.ALL_KITTIES[player].Relics;
        if (relics.Count < Relic.MaxRelics) return false;
        player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already have the maximum number of relics!!");
        return true;
    }

    private static bool CanGetAnotherRelic(unit unit)
    {
        var relicCount = Globals.ALL_KITTIES[unit.Owner].Relics.Count;
        if (relicCount < 1) return true; // can get a first relic ofc.
        if(Relic.GetRelicCountForLevel(unit.HeroLevel) < relicCount) {
            unit.Owner.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_RED}You must have reached {Relic.RelicIncrease} to obtain a second relic. Then +1 for each level after up to {Relic.MaxRelics} relics.");
            return false;
        }
        return true;
    }

    private static bool ActiveShadowKitty(player player)
    {
        var shadowkitty = ShadowKitty.ALL_SHADOWKITTIES[player];
        if(shadowkitty.Active)
        {
            player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You cannot upgrade your while your shadow kitty is active!|r");
            return true;
        }
        return false;
    }


}