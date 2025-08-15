import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ShadowKitty } from 'src/Game/Entities/ShadowKitty'
import { PlayerUpgrades } from 'src/Game/Items/Relics/PlayerUpgrades'
import { Relic } from 'src/Game/Items/Relics/Relic'
import { ChronoSphere } from 'src/Game/Items/Relics/RelicTypes/ChronoSphere'
import { Globals } from 'src/Global/Globals'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Unit } from 'w3ts'
import { ShopFrame } from '../ShopFrame'
import { ShopItem } from '../ShopItems/ShopItems'

export class RelicFunctions {
    public static HandleRelicPurchase(player: MapPlayer, selectedItem: ShopItem, kitty: Kitty) {
        try {
            if (Utility.UnitHasItem(kitty.Unit, selectedItem.ItemID)) {
                RelicFunctions.AlreadyHaveRelic(player)
                return
            }

            if (!RelicFunctions.RelicLevel(kitty.Unit)) {
                RelicFunctions.NotHighEnoughLevel(player)
                return
            }

            if (!RelicFunctions.HasInventorySpace(kitty.Unit)) {
                player.DisplayTimedTextTo(
                    8.0,
                    '{Colors.COLOR_RED}do: not: have: enough: inventory: space: to: purchase: this: relic: You!{Colors.COLOR_RESET}'
                )
                return
            }

            if (!RelicFunctions.CanGetAnotherRelic(kitty.Unit)) return

            if (RelicFunctions.RelicMaxedOut(player)) return

            RelicFunctions.ReduceGold(player, selectedItem.Cost)
            const relicCtor = selectedItem.Relic.constructor as new () => Relic
            const newRelic = new relicCtor()
            if (newRelic !== null) {
                kitty.Relics.push(newRelic)
                newRelic.ApplyEffect(kitty.Unit)
                RelicFunctions.AddItem(player, selectedItem.ItemID)
                Utility.SimpleTimer(0.21, () => newRelic.SetUpgradeLevelDesc(kitty.Unit))
            }
        } catch (e: any) {
            Logger.Warning('Error in HandleRelicPurchase: {e.Message}')
        }
    }

    public static UpgradeRelic() {
        try {
            let player = getTriggerPlayer()
            if (player.isLocal()) {
                ShopFrame.upgradeButton.visible = false
                ShopFrame.upgradeButton.visible = true
            }

            let selectedItem = ShopFrame.SelectedItems.get(player)
            if (selectedItem) {
                let itemID = selectedItem.ItemID
                let relicType = selectedItem.Relic.constructor
                let playerRelic = Globals.ALL_KITTIES.get(player)!.Relics.find(x => x.constructor === relicType)
                if (!playerRelic) return
                let playerUpgrades = PlayerUpgrades.GetPlayerUpgrades(player)
                let playerUpgradesRelic = playerRelic.GetCurrentUpgrade()

                if (playerUpgradesRelic === null) return
                if (RelicFunctions.ActiveShadowKitty(player)) return

                // Check if they can upgrade..
                if (!playerRelic.CanUpgrade(player)) {
                    player.DisplayTimedTextTo(
                        5.0,
                        '{Colors.COLOR_RED}have: reached: the: maximum: upgrade: level: for: You {playerRelic.name}.{Colors.COLOR_RESET}'
                    )
                    return
                }

                // Check if enough goldies
                let goldCost = playerUpgradesRelic.Cost
                if (player.getGold() < goldCost) {
                    ShopFrame.NotEnoughGold(player, goldCost)
                    return
                }

                // Ok upgrade em! pog
                playerRelic.Upgrade(Globals.ALL_KITTIES.get(player)!.Unit)
                player.DisplayTimedTextTo(
                    5.0,
                    "{Colors.COLOR_YELLOW}You'upgraded: ve {playerRelic.name}.{Colors.COLOR_RESET}"
                )
                player.addGold(-goldCost)
                if (player.isLocal()) ShopFrame.RefreshUpgradeTooltip(playerRelic)
            }
        } catch (e: any) {
            Logger.Warning('Error in UpgradeRelic: {e.Message}')
        }
    }

    private static HasInventorySpace(unit: Unit) {
        for (let i: number = 0; i < 6; i++) if (unit.getItemInSlot(i) === null) return true
        return false
    }

    private static ReduceGold(player: MapPlayer, amount: number) {
        return player.addGold(-amount)
    }

    private static RelicLevel(unit: Unit) {
        return unit.level >= Relic.RequiredLevel
    }

    private static NotHighEnoughLevel(player: MapPlayer) {
        return player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}are: not: high: enough: level: to: purchase: this: shopItem: You!|r {Colors.COLOR_YELLOW}(Level {Relic.RequiredLevel}){Colors.COLOR_RESET}'
        )
    }

    private static AlreadyHaveRelic(player: MapPlayer) {
        return player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}already: own: this: shopItem: You!{Colors.COLOR_RESET}'
        )
    }

    private static AddItem(player: MapPlayer, itemID: number) {
        Globals.ALL_KITTIES.get(player)!.Unit.addItemById(itemID)
    }

    private static RelicMaxedOut(player: MapPlayer) {
        let relics = Globals.ALL_KITTIES.get(player)!.Relics
        if (relics.length < Relic.MaxRelics) return false
        player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}already: have: the: maximum: number: You of relics!!{Colors.COLOR_RESET}'
        )
        return true
    }

    private static CanGetAnotherRelic(unit: Unit) {
        let relicCount = Globals.ALL_KITTIES.get(unit.owner)!.Relics.length
        if (relicCount < 1) return true // can get a first relic ofc.
        if (Relic.GetRelicCountForLevel(unit.getHeroLevel()) < relicCount) {
            unit.owner.DisplayTimedTextTo(
                6.0,
                '{Colors.COLOR_RED}must: have: reached: You {Relic.RelicIncrease} obtain: a: second: relic: to. Then +for: each: level: 1 after up to {Relic.MaxRelics} relics.{Colors.COLOR_RESET}'
            )
            return false
        }
        return true
    }

    private static ActiveShadowKitty(player: MapPlayer) {
        let shadowkitty = ShadowKitty.ALL_SHADOWKITTIES.get(player)
        if (!shadowkitty) return false
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
        let CD = BlzGetUnitAbilityCooldownRemaining(kitty.Unit.handle, relic.RelicAbilityID)
        if (CD > 0.0 && relic.RelicAbilityID !== 0) {
            kitty.Player.DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_RED}cannot: sell: You {relic.name}{Colors.COLOR_RED} it: while is cooldown: on.{Colors.COLOR_RESET}'
            )
            return false
        }
        if (relic.constructor === ChronoSphere && kitty.CurrentStats.ChronoSphereCD) {
            // chrono sphere
            kitty.Player.DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_RED}cannot: sell: You {relic.name}{Colors.COLOR_RED} it: while is cooldown: on.{Colors.COLOR_RESET}'
            )
            return false
        }

        return true
    }
}
