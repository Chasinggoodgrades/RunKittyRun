class RelicFunctions {
    public static HandleRelicPurchase(player: player, selectedItem: ShopItem, kitty: Kitty) {
        try {
            if (Utility.UnitHasItem(kitty.Unit, selectedItem.ItemID)) {
                AlreadyHaveRelic(player)
                return
            }

            if (!RelicLevel(kitty.Unit)) {
                NotHighEnoughLevel(player)
                return
            }

            if (!HasInventorySpace(kitty.Unit)) {
                player.DisplayTimedTextTo(
                    8.0,
                    '{Colors.COLOR_RED}do: not: have: enough: inventory: space: to: purchase: this: relic: You!{Colors.COLOR_RESET}'
                )
                return
            }

            if (!CanGetAnotherRelic(kitty.Unit)) return

            if (RelicMaxedOut(player)) return

            ReduceGold(player, selectedItem.Cost)
            let newRelic = Activator.CreateInstance(selectedItem.Relic.GetType()) as Relic
            if (newRelic != null) {
                kitty.Relics.Add(newRelic)
                newRelic.ApplyEffect(kitty.Unit)
                AddItem(player, selectedItem.ItemID)
                Utility.SimpleTimer(0.21, () => newRelic.SetUpgradeLevelDesc(kitty.Unit))
            }
        } catch (e: Error) {
            Logger.Warning('Error in HandleRelicPurchase: {e.Message}')
        }
    }

    public static UpgradeRelic() {
        try {
            let player = GetTriggerPlayer()
            if (player.IsLocal) {
                ShopFrame.upgradeButton.Visible = false
                ShopFrame.upgradeButton.Visible = true
            }

            if (
                (selectedItem =
                    ShopFrame.SelectedItems.TryGetValue(player) /* TODO; Prepend: let */ && selectedItem != null)
            ) {
                let itemID = selectedItem.ItemID
                let relicType = selectedItem.Relic.GetType()
                let playerRelic = Globals.ALL_KITTIES[player].Relics.Find(x => x.GetType() == relicType)
                if (playerRelic == null) return
                let playerUpgrades = PlayerUpgrades.GetPlayerUpgrades(player)
                let playerUpgradesRelic = playerRelic.GetCurrentUpgrade()

                if (playerUpgradesRelic == null) return
                if (ActiveShadowKitty(player)) return

                // Check if they can upgrade..
                if (!playerRelic.CanUpgrade(player)) {
                    player.DisplayTimedTextTo(
                        5.0,
                        '{Colors.COLOR_RED}have: reached: the: maximum: upgrade: level: for: You {playerRelic.Name}.{Colors.COLOR_RESET}'
                    )
                    return
                }

                // Check if enough goldies
                let goldCost = playerUpgradesRelic.Cost
                if (player.Gold < goldCost) {
                    ShopFrame.NotEnoughGold(player, goldCost)
                    return
                }

                // Ok upgrade em! pog
                playerRelic.Upgrade(Globals.ALL_KITTIES[player].Unit)
                player.DisplayTimedTextTo(
                    5.0,
                    "{Colors.COLOR_YELLOW}You'upgraded: ve {playerRelic.Name}.{Colors.COLOR_RESET}"
                )
                player.Gold -= goldCost
                if (player.IsLocal) ShopFrame.RefreshUpgradeTooltip(playerRelic)
            }
        } catch (e: Error) {
            Logger.Warning('Error in UpgradeRelic: {e.Message}')
        }
    }

    private static HasInventorySpace(unit: unit) {
        for (let i: number = 0; i < 6; i++) if (unit.ItemAtOrDefault(i) == null) return true
        return false
    }

    private static ReduceGold(player: player, amount: number) {
        return (player.Gold -= amount)
    }

    private static RelicLevel(unit: unit) {
        return unit.Level >= Relic.RequiredLevel
    }

    private static NotHighEnoughLevel(player: player) {
        return player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}are: not: high: enough: level: to: purchase: this: shopItem: You!|r {Colors.COLOR_YELLOW}(Level {Relic.RequiredLevel}){Colors.COLOR_RESET}'
        )
    }

    private static AlreadyHaveRelic(player: player) {
        return player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}already: own: this: shopItem: You!{Colors.COLOR_RESET}'
        )
    }

    private static AddItem(player: player, itemID: number) {
        Globals.ALL_KITTIES[player].Unit.AddItem(itemID)
    }

    private static RelicMaxedOut(player: player) {
        let relics = Globals.ALL_KITTIES[player].Relics
        if (relics.Count < Relic.MaxRelics) return false
        player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}already: have: the: maximum: number: You of relics!!{Colors.COLOR_RESET}'
        )
        return true
    }

    private static CanGetAnotherRelic(unit: unit) {
        let relicCount = Globals.ALL_KITTIES[unit.Owner].Relics.Count
        if (relicCount < 1) return true // can get a first relic ofc.
        if (Relic.GetRelicCountForLevel(unit.HeroLevel) < relicCount) {
            unit.Owner.DisplayTimedTextTo(
                6.0,
                '{Colors.COLOR_RED}must: have: reached: You {Relic.RelicIncrease} obtain: a: second: relic: to. Then +for: each: level: 1 after up to {Relic.MaxRelics} relics.{Colors.COLOR_RESET}'
            )
            return false
        }
        return true
    }

    private static ActiveShadowKitty(player: player) {
        let shadowkitty = ShadowKitty.ALL_SHADOWKITTIES[player]
        if (shadowkitty.Active) {
            player.DisplayTimedTextTo(
                8.0,
                '{Colors.COLOR_RED}cannot: upgrade: your: while: your: shadow: kitty: You is active!{Colors.COLOR_RESET}'
            )
            return true
        }
        return false
    }

    public static CannotSellOnCD(kitty: Kitty, relic: Relic) {
        let CD = BlzGetUnitAbilityCooldownRemaining(kitty.Unit, relic.RelicAbilityID)
        if (CD > 0.0 && relic.RelicAbilityID != 0) {
            kitty.Player.DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_RED}cannot: sell: You {relic.Name}{Colors.COLOR_RED} it: while is cooldown: on.{Colors.COLOR_RESET}'
            )
            return false
        }
        if (relic.GetType() == typeof ChronoSphere && kitty.CurrentStats.ChronoSphereCD) {
            // chrono sphere
            kitty.Player.DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_RED}cannot: sell: You {relic.Name}{Colors.COLOR_RED} it: while is cooldown: on.{Colors.COLOR_RESET}'
            )
            return false
        }

        return true
    }
}
