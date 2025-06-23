using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
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
                player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You do not have enough inventory space to purchase this relic!{Colors.COLOR_RESET}");
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
                Utility.SimpleTimer(0.21f, () => newRelic.SetUpgradeLevelDesc(kitty.Unit));
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in HandleRelicPurchase: {e.Message}");
        }
    }

    public static void UpgradeRelic()
    {
        try
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
                if (playerRelic == null) return;
                var playerUpgrades = PlayerUpgrades.GetPlayerUpgrades(player);
                var playerUpgradesRelic = playerRelic.GetCurrentUpgrade();

                if (playerUpgradesRelic == null) return;
                if (ActiveShadowKitty(player)) return;

                // Check if they can upgrade.. 
                if (!playerRelic.CanUpgrade(player))
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You have reached the maximum upgrade level for {playerRelic.Name}.{Colors.COLOR_RESET}");
                    return;
                }

                // Check if enough goldies
                var goldCost = playerUpgradesRelic.Cost;
                if (player.Gold < goldCost)
                {
                    ShopFrame.NotEnoughGold(player, goldCost);
                    return;
                }

                // Ok upgrade em! pog
                playerRelic.Upgrade(Globals.ALL_KITTIES[player].Unit);
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW}You've upgraded {playerRelic.Name}.{Colors.COLOR_RESET}");
                player.Gold -= goldCost;
                if (player.IsLocal) ShopFrame.RefreshUpgradeTooltip(playerRelic);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in UpgradeRelic: {e.Message}");
        }
    }

    private static bool HasInventorySpace(unit unit)
    {
        for (int i = 0; i < 6; i++)
            if (unit.ItemAtOrDefault(i) == null) return true;
        return false;
    }

    private static void ReduceGold(player player, int amount) => player.Gold -= amount;

    private static bool RelicLevel(unit unit) => unit.Level >= Relic.RequiredLevel;

    private static void NotHighEnoughLevel(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You are not high enough level to purchase this shopItem!|r {Colors.COLOR_YELLOW}(Level {Relic.RequiredLevel}){Colors.COLOR_RESET}");

    private static void AlreadyHaveRelic(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already own this shopItem!{Colors.COLOR_RESET}");

    private static void AddItem(player player, int itemID)
    {
        Globals.ALL_KITTIES[player].Unit.AddItem(itemID);
    }

    private static bool RelicMaxedOut(player player)
    {
        var relics = Globals.ALL_KITTIES[player].Relics;
        if (relics.Count < Relic.MaxRelics) return false;
        player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already have the maximum number of relics!!{Colors.COLOR_RESET}");
        return true;
    }

    private static bool CanGetAnotherRelic(unit unit)
    {
        var relicCount = Globals.ALL_KITTIES[unit.Owner].Relics.Count;
        if (relicCount < 1) return true; // can get a first relic ofc.
        if (Relic.GetRelicCountForLevel(unit.HeroLevel) < relicCount)
        {
            unit.Owner.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_RED}You must have reached {Relic.RelicIncrease} to obtain a second relic. Then +1 for each level after up to {Relic.MaxRelics} relics.{Colors.COLOR_RESET}");
            return false;
        }
        return true;
    }

    private static bool ActiveShadowKitty(player player)
    {
        var shadowkitty = ShadowKitty.ALL_SHADOWKITTIES[player];
        if (shadowkitty.Active)
        {
            player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You cannot upgrade your while your shadow kitty is active!{Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }

    public static bool CannotSellOnCD(Kitty kitty, Relic relic)
    {
        var CD = BlzGetUnitAbilityCooldownRemaining(kitty.Unit, relic.RelicAbilityID);
        if (CD > 0.0f && relic.RelicAbilityID != 0)
        {
            kitty.Player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell {relic.Name}{Colors.COLOR_RED} while it is on cooldown.{Colors.COLOR_RESET}");
            return false;
        }
        if (relic.GetType() == typeof(ChronoSphere) && kitty.CurrentStats.ChronoSphereCD) // chrono sphere
        {
            kitty.Player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell {relic.Name}{Colors.COLOR_RED} while it is on cooldown.{Colors.COLOR_RESET}");
            return false;
        }

        return true;
    }

}
