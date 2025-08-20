import { Logger } from 'src/Events/Logger/Logger'
import { Relic } from 'src/Game/Items/Relics/Relic'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { safeArraySplice } from 'src/Utility/ArrayUtils'
import { Colors } from 'src/Utility/Colors/Colors'
import { RemoveItemFromUnit } from 'src/Utility/UnitUtility'
import { Utility } from 'src/Utility/Utility'
import { blzCreateFrame, blzCreateFrameByType, blzGetFrameByName, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger, Unit } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'
import { CreateHeaderFrame, HideOtherFrames } from './FrameUtil'
import { RelicFunctions } from './RelicFunctions/RelicFunctions'
import { ShopItem, ShopItemType } from './ShopItems/ShopItems'
import { RefreshUpgradeTooltip, ShopUtil } from './ShopUtil'

export class ShopFrame {
    public static shopFrame: Frame
    private static relicsPanel: Frame
    private static rewardsPanel: Frame
    private static miscPanel: Frame
    private static detailsPanel: Frame
    private static nameLabel: Frame
    private static descriptionLabel: Frame
    private static costLabel: Frame
    private static buyButton: Frame
    private static sellButton: Frame
    private static GameUI: Frame
    private static buttonWidth = 0.025
    private static buttonHeight = 0.025
    private static panelPadding = 0.015
    private static frameX = 0.4
    private static frameY = 0.25
    private static panelX: number
    private static panelY: number
    private static detailsPanelX: number
    private static detailsPanelY: number
    private static ActiveAlpha = 255
    private static DisabledAlpha = 150
    private static DisabledPath: string = 'UI\\Widgets\\EscMenu\\Human\\human-options-button-background-disabled.blp'

    public static Initialize = () => {
        ShopFrame.GameUI = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
        ShopFrame.panelX = ShopFrame.frameX / 2 - ShopFrame.panelPadding
        ShopFrame.panelY = ShopFrame.frameY / 3 - ShopFrame.panelPadding * 2
        ShopFrame.detailsPanelX = ShopFrame.frameX - (ShopFrame.panelX + ShopFrame.panelPadding * 2)
        ShopFrame.detailsPanelY = ShopFrame.frameY - ShopFrame.panelPadding * 2

        ShopFrame.InitializeShopFrame()
        ShopFrame.shopFrame.visible = false
    }

    public static FinishInitialization = () => {
        try {
            ShopFrame.InitializePanels()
            ShopFrame.InitializeDetailsPanel()
            ShopFrame.InitializePanelTitles()
            ShopFrame.LoadItemsIntoPanels()
            ShopFrame.CreateUpgradeTooltip()
            ShopFrame.SetRewardsFrameHotkey()
            ShopFrame.shopFrame.visible = false
        } catch (e) {
            Logger.Critical(`Error in ShopFrame: ${e}`)
            throw e
        }
    }

    private static InitializeShopFrame = () => {
        ShopFrame.shopFrame = blzCreateFrameByType(
            'BACKDROP',
            'Frame: Shop',
            ShopFrame.GameUI,
            'QuestButtonPushedBackdropTemplate',
            0
        )
        ShopFrame.shopFrame.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.375)
        ShopFrame.shopFrame.setSize(ShopFrame.frameX, ShopFrame.frameY)
        CreateHeaderFrame(ShopFrame.shopFrame)
    }

    private static InitializePanels = () => {
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

    private static InitializePanelTitles = () => {
        ShopFrame.CreatePanelTitle(ShopFrame.relicsPanel, `Relics (Lvl:${Relic.RequiredLevel})`)
        ShopFrame.CreatePanelTitle(ShopFrame.rewardsPanel, 'Rewards')
        ShopFrame.CreatePanelTitle(ShopFrame.miscPanel, 'Miscellaneous')
    }

    private static CreatePanelTitle = (panel: Frame, title: string) => {
        const titleFrame = blzCreateFrameByType('TEXT', 'titleFrame', panel, '', 0)
        titleFrame.setPoint(FRAMEPOINT_TOP, panel, FRAMEPOINT_TOP, 0, 0.01)
        titleFrame.setText(title)
        titleFrame.setTextColor(BlzConvertColor(255, 255, 255, 0))
        titleFrame.setScale(1.2)
    }

    private static CreatePanel(parent: Frame, x: number, y: number): Frame {
        const panel = blzCreateFrame('QuestButtonDisabledBackdropTemplate', parent, 0, 0)
        panel.setPoint(FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, x, y)
        panel.setSize(ShopFrame.panelX, ShopFrame.panelY)
        return panel
    }

    private static InitializeDetailsPanel = () => {
        ShopFrame.detailsPanel = blzCreateFrame('QuestButtonDisabledBackdropTemplate', ShopFrame.shopFrame, 0, 0)
        const detailsPanelX = ShopFrame.frameX - (ShopFrame.panelX + ShopFrame.panelPadding * 2)
        const detailsPanelY = ShopFrame.frameY - ShopFrame.panelPadding * 2
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
        Globals.upgradeButton = blzCreateFrame('DebugButton', ShopFrame.detailsPanel, 0, 0)

        ShopFrame.nameLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 6)
        ShopFrame.costLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 6)
        ShopFrame.descriptionLabel.setSize(detailsPanelX - ShopFrame.panelPadding, detailsPanelY / 4)

        ShopFrame.buyButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)
        ShopFrame.sellButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)
        Globals.upgradeButton.setSize(detailsPanelX / 3.0, detailsPanelY / 6)

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

        Globals.upgradeButton.setPoint(
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
        Globals.upgradeButton.text = 'Upgrade'

        const BuyTrigger = Trigger.create()!
        BuyTrigger.triggerRegisterFrameEvent(ShopFrame.buyButton, FRAMEEVENT_CONTROL_CLICK)
        BuyTrigger.addAction(ShopFrame.BuySelectedItem)

        const SellTrigger = Trigger.create()!
        SellTrigger.triggerRegisterFrameEvent(ShopFrame.sellButton, FRAMEEVENT_CONTROL_CLICK)
        SellTrigger.addAction(ShopFrame.SellSelectedItem)

        const UpgradeTrigger = Trigger.create()!
        UpgradeTrigger.triggerRegisterFrameEvent(Globals.upgradeButton, FRAMEEVENT_CONTROL_CLICK)
        UpgradeTrigger.addAction(RelicFunctions.UpgradeRelic)
    }

    private static LoadItemsIntoPanels = () => {
        try {
            ShopFrame.AddItemsToPanel(ShopFrame.relicsPanel, ShopFrame.GetRelicItems())
            ShopFrame.AddItemsToPanel(ShopFrame.rewardsPanel, ShopFrame.GetRewardItems())
            ShopFrame.AddItemsToPanel(ShopFrame.miscPanel, ShopFrame.GetMiscItems())
        } catch (e) {
            Logger.Critical(`Error in LoadItemsIntoPanels: ${e}`)
            throw e
        }
    }

    private static AddItemsToPanel = (panel: Frame, items: ShopItem[]) => {
        const columns = 6
        const rows: number = Math.ceil(items.length / columns)
        for (let i = 0; i < items.length; i++) {
            const relic = items[i]

            const row: number = Math.floor(i / columns)
            const column: number = i % columns
            const name = relic.name
            const button = blzCreateFrameByType('BUTTON', name, panel, 'ScoreScreenTabButtonTemplate', 0)
            const icon = blzCreateFrameByType('BACKDROP', name + 'icon', button, '', 0)

            let x = column * ShopFrame.buttonWidth
            let y = -row * ShopFrame.buttonHeight

            x += ShopFrame.panelPadding / 2
            y -= ShopFrame.panelPadding / 2

            button.setSize(ShopFrame.buttonWidth, ShopFrame.buttonHeight)
            button.setPoint(FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, x, y)
            relic.IconPath && icon.setTexture(relic.IconPath, 0, false)
            icon.setAllPoints(button)

            const itemDetails = Trigger.create()!
            ShopFrame.CreateShopitemTooltips(button, relic)
            itemDetails.triggerRegisterFrameEvent(blzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK)
            itemDetails.addAction(() => ShopFrame.ShowItemDetails(relic))
        }

        const panelHeight: number = rows * ShopFrame.buttonHeight + ShopFrame.panelPadding
        panel.setSize(columns * ShopFrame.buttonWidth + ShopFrame.panelPadding, panelHeight)
        if (panelHeight > ShopFrame.panelY) {
            ShopFrame.shopFrame.setSize(ShopFrame.frameX, ShopFrame.frameY + (panelHeight - ShopFrame.panelY))
            ShopFrame.detailsPanel.setSize(
                ShopFrame.detailsPanelX,
                ShopFrame.detailsPanelY + (panelHeight - ShopFrame.panelY)
            )
        }
    }

    private static UpdateButtonStatus = (player: MapPlayer) => {
        try {
            if (!player.isLocal()) return
            if (!Globals.SelectedItems.has(player)) return

            const item = Globals.SelectedItems.get(player)!
            const kitty = Globals.ALL_KITTIES.get(player)!

            Globals.upgradeButton.visible = false
            ShopFrame.sellButton.visible = false
            ShopFrame.buyButton.visible = true

            // basically if type === shopItem, it'll do the buttons.
            ShopFrame.RelicButtons(player, item)

            if (item.Type === ShopItemType.Relic) {
                ShopFrame.sellButton.visible = true
                ShopFrame.sellButton.alpha = ShopFrame.DisabledAlpha
                RefreshUpgradeTooltip(item.Relic)
                if (Utility.UnitHasItem(kitty.Unit, item.ItemID)) ShopFrame.sellButton.alpha = ShopFrame.ActiveAlpha
            }
        } catch (e) {
            Logger.Warning(`Error in UpdateButtonStatus: ${e}`)
        }
    }

    private static RelicButtons = (player: MapPlayer, item: ShopItem) => {
        if (!item) return
        if (item.Type !== ShopItemType.Relic) return
        const kitty = Globals.ALL_KITTIES.get(player)!.Unit
        Globals.upgradeButton.visible = true
        ShopFrame.sellButton.visible = true
        ShopFrame.buyButton.visible = true
        if (!Utility.UnitHasItem(kitty, item.ItemID)) {
            ShopFrame.buyButton.alpha = ShopFrame.ActiveAlpha
            ShopFrame.sellButton.alpha = ShopFrame.DisabledAlpha
            Globals.upgradeButton.alpha = ShopFrame.DisabledAlpha
        } else {
            ShopFrame.buyButton.alpha = ShopFrame.DisabledAlpha
            ShopFrame.sellButton.alpha = ShopFrame.ActiveAlpha
            Globals.upgradeButton.alpha = ShopFrame.ActiveAlpha
        }
        // Need to add another check for upgrades per player.
    }

    private static ShowItemDetails = (shopItem: ShopItem) => {
        const player = getTriggerPlayer()
        const frame = Frame.fromHandle(BlzGetTriggerFrame())!

        if (Globals.SelectedItems.has(player)) {
            Globals.SelectedItems.set(player, shopItem)
        } else {
            Globals.SelectedItems.set(player, shopItem)
        }

        if (!player.isLocal()) return
        FrameManager.RefreshFrame(frame)
        ShopFrame.nameLabel.text = `${Colors.COLOR_YELLOW_ORANGE}Name:${Colors.COLOR_RESET} ${shopItem.name}`
        ShopFrame.costLabel.text = `${Colors.COLOR_YELLOW}Cost:${Colors.COLOR_RESET} ${shopItem.Cost}`
        ShopFrame.descriptionLabel.text = `${Colors.COLOR_YELLOW_ORANGE}Description:${Colors.COLOR_RESET} ${shopItem.Description}`
        ShopFrame.UpdateButtonStatus(player)
        if (shopItem.Type === ShopItemType.Relic) RefreshUpgradeTooltip(shopItem.Relic)
    }

    private static CreateUpgradeTooltip = () => {
        try {
            const background = blzCreateFrame('QuestButtonBaseTemplate', ShopFrame.GameUI, 0, 0)
            Globals.upgradeTooltip = blzCreateFrameByType('TEXT', 'UpgradeTooltip', background, '', 0)

            Globals.upgradeTooltip.setSize(0.25, 0)
            background.setPoint(FRAMEPOINT_BOTTOMLEFT, Globals.upgradeTooltip, FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01)
            background.setPoint(FRAMEPOINT_TOPRIGHT, Globals.upgradeTooltip, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

            Globals.upgradeButton.setTooltip(background)
            Globals.upgradeTooltip.setPoint(FRAMEPOINT_BOTTOM, Globals.upgradeButton, FRAMEPOINT_TOP, 0, 0.01)
            Globals.upgradeTooltip.enabled = false
        } catch (e) {
            Logger.Warning(`Error in CreateUpgradeTooltip: ${e}`)
        }
    }

    private static CreateShopitemTooltips = (parent: Frame, item: ShopItem) => {
        try {
            const background = blzCreateFrame('QuestButtonBaseTemplate', ShopFrame.GameUI, 0, 0)
            const tooltip = blzCreateFrameByType('TEXT', `${parent.getName()}Tooltip`, background, '', 0)

            tooltip.setSize(0.1, 0)
            background.setPoint(FRAMEPOINT_BOTTOMLEFT, tooltip, FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01)
            background.setPoint(FRAMEPOINT_TOPRIGHT, tooltip, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

            parent.setTooltip(background)
            tooltip.setPoint(FRAMEPOINT_BOTTOM, parent, FRAMEPOINT_TOP, 0, 0.01)
            tooltip.enabled = false

            tooltip.text = item.name
        } catch (e) {
            Logger.Warning(`Error in CreateShopitemTooltips: ${e}`)
        }
    }

    private static BuySelectedItem = () => {
        const player = getTriggerPlayer()
        try {
            if (player.isLocal()) {
                ShopFrame.buyButton.visible = false
                ShopFrame.buyButton.visible = true
            }
            const selectedItem = Globals.SelectedItems.get(player)

            if (!ShopUtil.PlayerIsDead(player!) && selectedItem) {
                // your logic here
                const kitty = Globals.ALL_KITTIES.get(player)!

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
        } catch (e) {
            Logger.Warning(`Error in BuySelectedItem: ${e}`)
        }
    }

    private static SellSelectedItem = () => {
        const player = getTriggerPlayer()
        try {
            if (player.isLocal()) {
                ShopFrame.sellButton.visible = false
                ShopFrame.sellButton.visible = true
            }
            const selectedItem = Globals.SelectedItems.get(player)
            if (selectedItem) {
                const itemID = selectedItem.ItemID
                const kitty = Globals.ALL_KITTIES.get(player)!
                if (!Utility.UnitHasItem(kitty.Unit, itemID)) return
                if (selectedItem.Type === ShopItemType.Relic) {
                    if (!kitty.isAlive() || kitty.ProtectionActive) {
                        player.DisplayTimedTextTo(
                            5.0,
                            `${Colors.COLOR_RED}You cannot sell a relic while your kitty is dead!${Colors.COLOR_RESET}`
                        )
                        return
                    }

                    if (!ShopFrame.CanSellRelic(kitty.Unit)) {
                        player.DisplayTimedTextTo(
                            5.0,
                            `${Colors.COLOR_RED}You cannot sell relics until level ${Relic.RelicSellLevel}.${Colors.COLOR_RESET}`
                        )
                        return
                    }

                    // Find the shopItem type associated with the selected item that the player owns.
                    const relic = kitty.Relics.find(x => x.name === selectedItem.Relic.name)

                    if (!RelicFunctions.CannotSellOnCD(kitty, relic!)) return

                    RemoveItemFromUnit(kitty.Unit, itemID)
                    player.addGold(selectedItem.Cost)
                    relic?.RemoveEffect(kitty.Unit)
                    safeArraySplice(kitty.Relics, p => p === relic)
                    return
                }

                RemoveItemFromUnit(kitty.Unit, itemID)
                player.addGold(selectedItem.Cost)
            }
        } catch (e) {
            Logger.Warning(`Error in SellSelectedItem: ${e}`)
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

    private static HasEnoughGold = (player: MapPlayer, cost: number) => {
        return player.getGold() >= cost
    }

    private static CanSellRelic = (unit: Unit) => {
        return unit.getHeroLevel() >= Relic.RelicSellLevel
    }

    private static ReduceGold = (player: MapPlayer, amount: number) => {
        return player.addGold(-amount)
    }

    public static NotEnoughGold = (player: MapPlayer, cost: number) => {
        return player.DisplayTimedTextTo(
            8.0,
            `${Colors.COLOR_RED}You do not have enough gold.|r ${Colors.COLOR_YELLOW}(${cost} gold)|r`
        )
    }

    private static AddItem = (player: MapPlayer, itemID: number) => {
        return Globals.ALL_KITTIES.get(player)!.Unit.addItemById(itemID)
    }

    private static SetRewardsFrameHotkey = () => {
        try {
            const shopFrameHotkey: Trigger = Trigger.create()!
            for (const player of Globals.ALL_PLAYERS) {
                shopFrameHotkey.registerPlayerKeyEvent(player, OSKEY_OEM_PLUS, 0, true)
            }
            shopFrameHotkey.addAction(ShopFrame.ShopFrameActions)
        } catch (e) {
            Logger.Warning(`Error in SetRewardsFrameHotkey: ${e}`)
        }
    }

    public static ShopFrameActions = () => {
        const player = getTriggerPlayer()
        if (!player.isLocal()) return
        FrameManager.ShopButton.visible = false
        FrameManager.ShopButton.visible = true
        HideOtherFrames(ShopFrame.shopFrame)
        if (CurrentGameMode.active === GameMode.SoloTournament) {
            // solo mode.
            player.DisplayTimedTextTo(
                6.0,
                `${Colors.COLOR_RED}The shop is not accessible in ShopFrame mode.${Colors.COLOR_RESET}`
            )
            return
        }
        ShopFrame.shopFrame.visible = !ShopFrame.shopFrame.visible
        ShopFrame.UpdateButtonStatus(player)
        if (ShopFrame.shopFrame.visible) MultiboardUtil.MinMultiboards(player, true)
    }
}
