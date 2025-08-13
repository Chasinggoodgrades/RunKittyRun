import { Logger } from 'src/Events/Logger/Logger'
import { PlayerUpgrades } from 'src/Game/Items/Relics/PlayerUpgrades'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { blzCreateFrame, blzCreateFrameByType, blzGetFrameByName, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger, Unit } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'
import { RelicFunctions } from './RelicFunctions/RelicFunctions'
import { ShopItem, ShopItemType } from './ShopItems/ShopItems'
import { ShopUtil } from './ShopUtil'

export class ShopFrame {
    public static shopFrame: Frame
    public static upgradeButton: Frame
    public static SelectedItems: Map<player, ShopItem> = new Map()
    private static relicsPanel: Frame
    private static rewardsPanel: Frame
    private static miscPanel: Frame
    private static detailsPanel: Frame
    private static nameLabel: Frame
    private static descriptionLabel: Frame
    private static costLabel: Frame
    private static buyButton: Frame
    private static sellButton: Frame
    private static upgradeTooltip: Frame
    private static GameUI: Frame = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
    private static buttonWidth: number = 0.025
    private static buttonHeight: number = 0.025
    private static panelPadding: number = 0.015
    private static frameX: number = 0.4
    private static frameY: number = 0.25
    private static panelX: number = ShopFrame.frameX / 2 - this.panelPadding
    private static panelY: number = ShopFrame.frameY / 3 - this.panelPadding * 2
    private static detailsPanelX: number = ShopFrame.frameX - (this.panelX + this.panelPadding * 2)
    private static detailsPanelY: number = ShopFrame.frameY - this.panelPadding * 2
    private static ActiveAlpha: number = 255
    private static DisabledAlpha: number = 150
    private static DisabledPath: string = 'UI\\Widgets\\EscMenu\\Human\\human-options-button-background-disabled.blp'

    public static Initialize() {
        ShopFrame.InitializeShopFrame()
        ShopFrame.shopFrame.visible = false
    }

    public static FinishInitialization() {
        try {
            ShopFrame.InitializePanels()
            ShopFrame.InitializeDetailsPanel()
            ShopFrame.InitializePanelTitles()
            ShopFrame.LoadItemsIntoPanels()
            ShopFrame.CreateUpgradeTooltip()
            ShopFrame.SetRewardsFrameHotkey()
            ShopFrame.shopFrame.visible = false
        } catch (ex: any) {
            Logger.Critical('Error in ShopFrame: {ex.Message}')
            throw ex
        }
    }

    private static InitializeShopFrame() {
        ShopFrame.shopFrame = blzCreateFrameByType(
            'BACKDROP',
            'Frame: Shop',
            ShopFrame.GameUI,
            'QuestButtonPushedBackdropTemplate',
            0
        )
        ShopFrame.shopFrame.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.375)
        ShopFrame.shopFrame.setSize(ShopFrame.frameX, ShopFrame.frameY)
        FrameManager.CreateHeaderFrame(ShopFrame.shopFrame)
    }

    private static InitializePanels() {
        ShopFrame.relicsPanel = blzCreateFrame('QuestButtonDisabledBackdropTemplate', ShopFrame.shopFrame, 0, 0)
        ShopFrame.relicsPanel.setPoint(
            FRAMEPOINT_TOPLEFT,
            ShopFrame.shopFrame,
            FRAMEPOINT_TOPLEFT,
            ShopFrame.panelPadding,
            -ShopFrame.panelPadding * 2
        )
        ShopFrame.relicsPanel.setSize(ShopFrame.panelX, ShopFrame.panelY)
        ShopFrame.rewardsPanel = ShopFrame.CreatePanel(ShopFrame.relicsPanel, 0, -ShopFrame.panelPadding)
        ShopFrame.miscPanel = ShopFrame.CreatePanel(ShopFrame.rewardsPanel, 0, -ShopFrame.panelPadding)
    }

    private static InitializePanelTitles() {
        ShopFrame.CreatePanelTitle(ShopFrame.relicsPanel, 'Relics (Lvl:{Relic.RequiredLevel})')
        ShopFrame.CreatePanelTitle(ShopFrame.rewardsPanel, 'Rewards')
        ShopFrame.CreatePanelTitle(ShopFrame.miscPanel, 'Miscellaneous')
    }

    private static CreatePanelTitle(panel: Frame, title: string) {
        let titleFrame = blzCreateFrameByType('TEXT', 'titleFrame', panel, '', 0)
        titleFrame.setPoint(FRAMEPOINT_TOP, panel, FRAMEPOINT_TOP, 0, 0.01)
        titleFrame.setText(title)
        titleFrame.setTextColor(BlzConvertColor(255, 255, 255, 0))
        titleFrame.setScale(1.2)
    }

    private static CreatePanel(parent: Frame, x: number, y: number): Frame {
        let panel = blzCreateFrame('QuestButtonDisabledBackdropTemplate', parent, 0, 0)
        panel.setPoint(FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, x, y)
        panel.setSize(ShopFrame.panelX, ShopFrame.panelY)
        return panel
    }

    private static InitializeDetailsPanel() {
        ShopFrame.detailsPanel = blzCreateFrame('QuestButtonDisabledBackdropTemplate', ShopFrame.shopFrame, 0, 0)
        let detailsPanelX = ShopFrame.frameX - (ShopFrame.panelX + ShopFrame.panelPadding * 2)
        let detailsPanelY = ShopFrame.frameY - ShopFrame.panelPadding * 2
        ShopFrame.detailsPanel.setPoint(
            FRAMEPOINT_TOPRIGHT,
            ShopFrame.shopFrame,
            FRAMEPOINT_TOPRIGHT,
            -ShopFrame.panelPadding,
            -ShopFrame.panelPadding
        )
        ShopFrame.detailsPanel.setSize(detailsPanelX, detailsPanelY)

        ShopFrame.nameLabel = blzCreateFrameByType('TEXT', 'nameLabel', ShopFrame.detailsPanel, '', 0)
        ShopFrame.costLabel = blzCreateFrameByType('TEXT', 'costLabel', ShopFrame.detailsPanel, '', 0)
        ShopFrame.descriptionLabel = blzCreateFrameByType('TEXT', 'descriptionLabel', ShopFrame.detailsPanel, '', 0)

        ShopFrame.buyButton = blzCreateFrame('ScriptDialogButton', ShopFrame.detailsPanel, 0, 0)
        ShopFrame.sellButton = blzCreateFrame('ScriptDialogButton', ShopFrame.detailsPanel, 0, 0)
        ShopFrame.upgradeButton = blzCreateFrame('DebugButton', ShopFrame.detailsPanel, 0, 0)

        ShopFrame.nameLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 6)
        ShopFrame.costLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 6)
        ShopFrame.descriptionLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 4)

        ShopFrame.buyButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)
        ShopFrame.sellButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)
        ShopFrame.upgradeButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)

        ShopFrame.nameLabel.setPoint(
            FRAMEPOINT_TOPLEFT,
            ShopFrame.detailsPanel,
            FRAMEPOINT_TOPLEFT,
            ShopFrame.panelPadding / 2,
            -ShopFrame.panelPadding
        )
        ShopFrame.costLabel.setPoint(
            FRAMEPOINT_TOPLEFT,
            ShopFrame.nameLabel,
            FRAMEPOINT_TOPLEFT,
            0,
            -ShopFrame.panelPadding
        )
        ShopFrame.descriptionLabel.setPoint(FRAMEPOINT_TOPLEFT, ShopFrame.costLabel, FRAMEPOINT_BOTTOMLEFT, 0, 0)

        ShopFrame.upgradeButton.setPoint(
            FRAMEPOINT_BOTTOMLEFT,
            ShopFrame.detailsPanel,
            FRAMEPOINT_BOTTOMLEFT,
            ShopFrame.panelPadding,
            ShopFrame.panelPadding
        )
        ShopFrame.sellButton.setPoint(
            FRAMEPOINT_BOTTOMRIGHT,
            ShopFrame.detailsPanel,
            FRAMEPOINT_BOTTOMRIGHT,
            -ShopFrame.panelPadding,
            ShopFrame.panelPadding
        )
        ShopFrame.buyButton.setPoint(FRAMEPOINT_BOTTOMLEFT, ShopFrame.sellButton, FRAMEPOINT_TOPLEFT, 0, 0)

        ShopFrame.buyButton.text = 'Buy'
        ShopFrame.sellButton.text = 'Sell'
        ShopFrame.upgradeButton.text = 'Upgrade'

        let BuyTrigger = Trigger.create()!
        BuyTrigger.triggerRegisterFrameEvent(ShopFrame.buyButton, FRAMEEVENT_CONTROL_CLICK)
        BuyTrigger.addAction(ShopFrame.BuySelectedItem)

        let SellTrigger = Trigger.create()!
        SellTrigger.triggerRegisterFrameEvent(ShopFrame.sellButton, FRAMEEVENT_CONTROL_CLICK)
        SellTrigger.addAction(ShopFrame.SellSelectedItem)

        let UpgradeTrigger = Trigger.create()!
        UpgradeTrigger.triggerRegisterFrameEvent(ShopFrame.upgradeButton, FRAMEEVENT_CONTROL_CLICK)
        UpgradeTrigger.addAction(RelicFunctions.UpgradeRelic)
    }

    private static LoadItemsIntoPanels() {
        try {
            ShopFrame.AddItemsToPanel(ShopFrame.relicsPanel, ShopFrame.GetRelicItems())
            ShopFrame.AddItemsToPanel(ShopFrame.rewardsPanel, ShopFrame.GetRewardItems())
            ShopFrame.AddItemsToPanel(ShopFrame.miscPanel, ShopFrame.GetMiscItems())
        } catch (ex: any) {
            Logger.Critical('Error in LoadItemsIntoPanels: {ex}')
            throw ex
        }
    }

    private static AddItemsToPanel(panel: Frame, items: ShopItem[]) {
        let columns: number = 6
        let rows: number = Math.Ceiling(items.length / columns)
        for (let i: number = 0; i < items.length; i++) {
            let row: number = i / columns
            let column: number = i % columns
            let name = items[i].name
            let button = blzCreateFrameByType('BUTTON', name, panel, 'ScoreScreenTabButtonTemplate', 0)
            let icon = blzCreateFrameByType('BACKDROP', name + 'icon', button, '', 0)

            let x = column * ShopFrame.buttonWidth
            let y = -row * ShopFrame.buttonHeight

            x += ShopFrame.panelPadding / 2
            y -= ShopFrame.panelPadding / 2

            button.setSize(ShopFrame.buttonWidth, ShopFrame.buttonHeight)
            button.setPoint(FRAMEPOINT_TOPLEFT, x, y, panel, FRAMEPOINT_TOPLEFT)
            icon.setTexture(items[i].IconPath, 0, false)
            icon.setAllPoints(button)

            let itemDetails = Trigger.create()!
            let relic = items[i]
            ShopFrame.CreateShopitemTooltips(button, relic)
            itemDetails.triggerRegisterFrameEvent(blzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK)
            itemDetails.addAction(() => ShopFrame.ShowItemDetails(relic))
        }

        let panelHeight: number = rows * ShopFrame.buttonHeight + ShopFrame.panelPadding
        panel.setSize(columns * ShopFrame.buttonWidth + ShopFrame.panelPadding, panelHeight)
        if (panelHeight > ShopFrame.panelY) {
            ShopFrame.shopFrame.setSize(ShopFrame.frameX, ShopFrame.frameY + (panelHeight - ShopFrame.panelY))
            ShopFrame.detailsPanel.setSize(
                ShopFrame.detailsPanelX,
                ShopFrame.detailsPanelY + (panelHeight - ShopFrame.panelY)
            )
        }
    }

    private static UpdateButtonStatus(player: MapPlayer) {
        try {
            if (!player.isLocal()) return
            if (!ShopFrame.SelectedItems.has(player)) return

            let item = ShopFrame.SelectedItems[player]
            let kitty = Globals.ALL_KITTIES.get(player)!

            ShopFrame.upgradeButton.visible = false
            ShopFrame.sellButton.visible = false
            ShopFrame.buyButton.visible = true

            // basically if type == shopItem, it'll do the buttons.
            ShopFrame.RelicButtons(player, item)

            if (item.Type == ShopItemType.Relic) {
                ShopFrame.sellButton.visible = true
                ShopFrame.sellButton.alpha = ShopFrame.DisabledAlpha
                ShopFrame.RefreshUpgradeTooltip(item.Relic)
                if (Utility.UnitHasItem(kitty.Unit, item.ItemID)) ShopFrame.sellButton.alpha = ShopFrame.ActiveAlpha
            }
        } catch (ex: any) {
            Logger.Warning('Error in UpdateButtonStatus: {ex.Message}')
        }
    }

    private static RelicButtons(player: MapPlayer, item: ShopItem) {
        if (item == null) return
        if (item.Type != ShopItemType.Relic) return
        let kitty = Globals.ALL_KITTIES.get(player)!.Unit
        ShopFrame.upgradeButton.visible = true
        ShopFrame.sellButton.visible = true
        ShopFrame.buyButton.visible = true
        if (!Utility.UnitHasItem(kitty, item.ItemID)) {
            ShopFrame.buyButton.alpha = ShopFrame.ActiveAlpha
            ShopFrame.sellButton.alpha = ShopFrame.DisabledAlpha
            ShopFrame.upgradeButton.alpha = ShopFrame.DisabledAlpha
        } else {
            ShopFrame.buyButton.alpha = ShopFrame.DisabledAlpha
            ShopFrame.sellButton.alpha = ShopFrame.ActiveAlpha
            ShopFrame.upgradeButton.alpha = ShopFrame.ActiveAlpha
        }
        // Need to add another check for upgrades per player.
    }

    private static ShowItemDetails(shopItem: ShopItem) {
        let player = getTriggerPlayer()
        let frame = BlzGetTriggerFrame()

        if (ShopFrame.SelectedItems.has(player)) {
            ShopFrame.SelectedItems.set(player, shopItem)
        } else {
            ShopFrame.SelectedItems.set(player, shopItem)
        }

        if (!player.isLocal()) return
        FrameManager.RefreshFrame(frame)
        ShopFrame.nameLabel.text = '{Colors.COLOR_YELLOW_ORANGE}Name:{Colors.COLOR_RESET} {shopItem.name}'
        ShopFrame.costLabel.text = '{Colors.COLOR_YELLOW}Cost:{Colors.COLOR_RESET} {shopItem.Cost}'
        ShopFrame.descriptionLabel.text =
            '{Colors.COLOR_YELLOW_ORANGE}Description:{Colors.COLOR_RESET} {shopItem.Description}'
        ShopFrame.UpdateButtonStatus(player)
        if (shopItem.Type == ShopItemType.Relic) ShopFrame.RefreshUpgradeTooltip(shopItem.Relic)
    }

    private static CreateUpgradeTooltip() {
        try {
            let background = blzCreateFrameByType('QuestButtonBaseTemplate', ShopFrame.GameUI, 0, 0)
            ShopFrame.upgradeTooltip = blzCreateFrameByType('TEXT', 'UpgradeTooltip', background, '', 0)

            ShopFrame.upgradeTooltip.setSize(0.25, 0)
            background.setPoint(FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01, ShopFrame.upgradeTooltip, FRAMEPOINT_BOTTOMLEFT)
            background.setPoint(FRAMEPOINT_TOPRIGHT, ShopFrame.upgradeTooltip, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

            ShopFrame.upgradeButton.setTooltip(background)
            ShopFrame.upgradeTooltip.setPoint(FRAMEPOINT_BOTTOM, ShopFrame.upgradeButton, FRAMEPOINT_TOP, 0, 0.01)
            ShopFrame.upgradeTooltip.Enabled = false
        } catch (ex: any) {
            Logger.Warning('Error in CreateUpgradeTooltip: {ex}')
        }
    }

    private static CreateShopitemTooltips(parent: Frame, item: ShopItem) {
        try {
            let background = blzCreateFrameByType('QuestButtonBaseTemplate', ShopFrame.GameUI, 0, 0)
            let tooltip = blzCreateFrameByType('TEXT', '{parent.name}Tooltip', background, '', 0)

            tooltip.setSize(0.1, 0)
            background.setPoint(FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01, tooltip, FRAMEPOINT_BOTTOMLEFT)
            background.setPoint(FRAMEPOINT_TOPRIGHT, tooltip, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

            parent.setTooltip(background)
            tooltip.setPoint(FRAMEPOINT_BOTTOM, parent, FRAMEPOINT_TOP, 0, 0.01)
            tooltip.Enabled = false

            tooltip.text = item.name
        } catch (ex: any) {
            Logger.Warning('Error in CreateShopitemTooltips: {ex}')
        }
    }

    public static RefreshUpgradeTooltip(relic: Relic) {
        let finalString = new StringBuilder()
        let playersUpgradeLevel = PlayerUpgrades.GetPlayerUpgrades(getTriggerPlayer()).GetUpgradeLevel(relic.GetType())

        for (let i: number = 0; i < relic.Upgrades.length; i++) {
            let upgrade = relic.Upgrades[i]
            let color: string, colorDescription

            if (i < playersUpgradeLevel - 1) {
                color = Colors.COLOR_GREY // Grey out past upgrades
                colorDescription = Colors.COLOR_GREY
            } else if (i == playersUpgradeLevel - 1) {
                color = Colors.COLOR_GREY // INCASE WE WANT TO CHANGE THE COLOR OF THE CURRENT UPGRADE OR ADD DETAILS
                colorDescription = Colors.COLOR_GREY
            } else if (i == playersUpgradeLevel) {
                color = Colors.COLOR_YELLOW // Yellow for the next available upgrade
                colorDescription = Colors.COLOR_YELLOW_ORANGE
            } else {
                color = Colors.COLOR_GREY // Grey for upgrades past next available upgrade.
                colorDescription = Colors.COLOR_GREY
            }

            finalString.AppendLine('{color}[Upgrade {i + 1}] {upgrade.Cost}g{Colors.COLOR_RESET}')
            finalString.AppendLine('{colorDescription}{upgrade.Description}{Colors.COLOR_RESET}')
            finalString.AppendLine('----------------------------')
        }

        ShopFrame.upgradeTooltip.text = finalString.toString()
    }

    private static BuySelectedItem() {
        let player = getTriggerPlayer()
        try {
            if (player.isLocal()) {
                ShopFrame.buyButton.visible = false
                ShopFrame.buyButton.visible = true
            }
            const selectedItem = ShopFrame.SelectedItems.TryGetValue(player)

            if (!ShopUtil.PlayerIsDead(player!) && selectedItem != null) {
                // your logic here
                let kitty = Globals.ALL_KITTIES.get(player)!

                if (!ShopFrame.HasEnoughGold(player, selectedItem.Cost)) {
                    ShopFrame.NotEnoughGold(player, selectedItem.Cost)
                    return
                }

                switch (selectedItem.Type) {
                    case ShopItemType.Relic:
                        RelicFunctions.HandleRelicPurchase(player, selectedItem, kitty)
                        break

                    case ShopItemType.Reward:
                        AwardManager.GiveReward(player, selectedItem.Award)
                        ShopFrame.ReduceGold(player, selectedItem.Cost)
                        break

                    case ShopItemType.Misc:
                        ShopFrame.AddItem(player, selectedItem.ItemID)
                        ShopFrame.ReduceGold(player, selectedItem.Cost)
                        break
                }
            }
            // hide shop after purchase
            if (player.isLocal()) ShopFrame.shopFrame.visible = !ShopFrame.shopFrame.visible
        } catch (ex: any) {
            Logger.Warning('Error in BuySelectedItem: {ex.Message}')
        }
    }

    private static SellSelectedItem() {
        let player = getTriggerPlayer()
        try {
            if (player.isLocal()) {
                ShopFrame.sellButton.visible = false
                ShopFrame.sellButton.visible = true
            }
            if (
                (selectedItem =
                    ShopFrame.SelectedItems.TryGetValue(player) /* TODO; Prepend: let */ && selectedItem != null)
            ) {
                let itemID = selectedItem.ItemID
                let kitty = Globals.ALL_KITTIES.get(player)!
                if (!Utility.UnitHasItem(kitty.Unit, itemID)) return
                if (selectedItem.Type == ShopItemType.Relic) {
                    if (!kitty.isAlive() || kitty.ProtectionActive) {
                        player.DisplayTimedTextTo(
                            5.0,
                            '{Colors.COLOR_RED}cannot: sell: a: relic: while: your: kitty: You is dead!{Colors.COLOR_RESET}'
                        )
                        return
                    }

                    if (!ShopFrame.CanSellRelic(kitty.Unit)) {
                        player.DisplayTimedTextTo(
                            5.0,
                            '{Colors.COLOR_RED}cannot: sell: relics: until: level: You {Relic.RelicSellLevel}.{Colors.COLOR_RESET}'
                        )
                        return
                    }

                    // Find the shopItem type associated with the selected item that the player owns.
                    let relic = kitty.Relics.find(x => x.GetType() == selectedItem.Relic.GetType())

                    if (!RelicFunctions.CannotSellOnCD(kitty, relic)) return

                    Utility.RemoveItemFromUnit(kitty.Unit, itemID)
                    player.Gold += selectedItem.Cost
                    relic?.RemoveEffect(kitty.Unit)
                    kitty.Relics.Remove(relic)
                    return
                }

                Utility.RemoveItemFromUnit(kitty.Unit, itemID)
                player.Gold += selectedItem.Cost
            }
        } catch (ex: any) {
            Logger.Warning('Error in SellSelectedItem: {ex.Message}')
        }
    }

    private static GetRelicItems(): ShopItem[] {
        return ShopItem.ShopItemsRelic()
    }

    private static GetRewardItems(): ShopItem[] {
        return ShopItem.ShopItemsReward()
    }

    private static GetMiscItems(): ShopItem[] {
        return ShopItem.ShopItemsMisc()
    }

    private static HasEnoughGold(player: MapPlayer, cost: number) {
        return player.Gold >= cost
    }

    private static CanSellRelic(unit: Unit) {
        return unit.getHeroLevel() >= Relic.RelicSellLevel
    }

    private static ReduceGold(player: MapPlayer, amount: number) {
        return (player.Gold -= amount)
    }

    public static NotEnoughGold(player: MapPlayer, cost: number) {
        return player.DisplayTimedTextTo(
            8.0,
            '{Colors.COLOR_RED}do: not: have: enough: gold: You.|r {Colors.COLOR_YELLOW}({cost} gold)|r'
        )
    }

    private static AddItem(player: MapPlayer, itemID: number) {
        return Globals.ALL_KITTIES.get(player)!.Unit.AddItem(itemID)
    }

    private static SetRewardsFrameHotkey() {
        try {
            let shopFrameHotkey: Trigger = Trigger.create()!
            for (let player of Globals.ALL_PLAYERS) {
                shopFrameHotkey.RegisterPlayerKeyEvent(player, OSKEY_OEM_PLUS, 0, true)
            }
            shopFrameHotkey.addAction(ErrorHandler.Wrap(() => ShopFrame.ShopFrameActions()))
        } catch (ex: any) {
            Logger.Warning('Error in SetRewardsFrameHotkey: {ex}')
        }
    }

    public static ShopFrameActions() {
        let player = getTriggerPlayer()
        if (!player.isLocal()) return
        FrameManager.ShopButton.visible = false
        FrameManager.ShopButton.visible = true
        FrameManager.HideOtherFrames(ShopFrame.shopFrame)
        if (Gamemode.CurrentGameMode == GameMode.SoloTournament) {
            // solo mode.
            player.DisplayTimedTextTo(
                6.0,
                '{Colors.COLOR_RED}shop: The is accessible: not in mode: this.{Colors.COLOR_RESET}'
            )
            return
        }
        ShopFrame.shopFrame.visible = !ShopFrame.shopFrame.visible
        ShopFrame.UpdateButtonStatus(player)
        if (ShopFrame.shopFrame.visible) MultiboardUtil.MinMultiboards(player, true)
    }
}
