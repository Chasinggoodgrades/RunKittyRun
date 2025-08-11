

class ShopFrame
{
    public static shopFrame: framehandle 
    public static upgradeButton: framehandle;
    public static  SelectedItems : {[x: player]: ShopItem} = {}
    private static relicsPanel: framehandle;
    private static rewardsPanel: framehandle;
    private static miscPanel: framehandle;
    private static detailsPanel: framehandle;
    private static nameLabel: framehandle;
    private static descriptionLabel: framehandle;
    private static costLabel: framehandle;
    private static buyButton: framehandle;
    private static sellButton: framehandle;
    private static upgradeTooltip: framehandle;
    private static GameUI: framehandle = originframetype.GameUI.GetOriginFrame(0);
    private buttonWidth: number = 0.025;
    private buttonHeight: number = 0.025;
    private panelPadding: number = 0.015;
    private frameX: number = 0.4;
    private frameY: number = 0.25;
    private panelX: number = (frameX / 2) - panelPadding;
    private panelY: number = (frameY / 3) - (panelPadding * 2);
    private detailsPanelX: number = frameX - (panelX + (panelPadding * 2));
    private detailsPanelY: number = frameY - (panelPadding * 2);
    private ActiveAlpha: number = 255;
    private DisabledAlpha: number = 150;
    private DisabledPath: string = "UI\\Widgets\\EscMenu\\Human\\human-options-button-background-disabled.blp";

    public static Initialize()
    {
        InitializeShopFrame();
        shopFrame.Visible = false;
    }

    public static FinishInitialization()
    {
        try
        {
            InitializePanels();
            InitializeDetailsPanel();
            InitializePanelTitles();
            LoadItemsIntoPanels();
            CreateUpgradeTooltip();
            SetRewardsFrameHotkey();
            shopFrame.Visible = false;
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in ShopFrame: {ex.Message}");
            throw ex
        }
    }

    private static InitializeShopFrame()
    {
        shopFrame = BlzCreateFrameByType("BACKDROP", "Frame: Shop", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        BlzFrameSetAbsPoint(shopFrame, FRAMEPOINT_CENTER, 0.40, 0.375);
        BlzFrameSetSize(shopFrame, frameX, frameY);
        FrameManager.CreateHeaderFrame(shopFrame);
    }

    private static InitializePanels()
    {
        relicsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        relicsPanel.SetPoint(FRAMEPOINT_TOPLEFT, panelPadding, -panelPadding * 2, shopFrame, FRAMEPOINT_TOPLEFT);
        relicsPanel.SetSize(panelX, panelY);
        rewardsPanel = CreatePanel(relicsPanel, 0, -panelPadding);
        miscPanel = CreatePanel(rewardsPanel, 0, -panelPadding);
    }

    private static InitializePanelTitles()
    {
        CreatePanelTitle(relicsPanel, "Relics (Lvl:{Relic.RequiredLevel})");
        CreatePanelTitle(rewardsPanel, "Rewards");
        CreatePanelTitle(miscPanel, "Miscellaneous");
    }

    private static CreatePanelTitle(panel: framehandle, title: string)
    {
        let titleFrame = BlzCreateFrameByType("TEXT", "titleFrame", panel, "", 0);
        BlzFrameSetPoint(titleFrame, FRAMEPOINT_TOP, panel, FRAMEPOINT_TOP, 0, 0.01);
        BlzFrameSetText(titleFrame, title);
        BlzFrameSetTextColor(titleFrame, BlzConvertColor(255, 255, 255, 0));
        BlzFrameSetScale(titleFrame, 1.2);
    }

    private static CreatePanel: framehandle(parent: framehandle, x: number, y: number)
    {
        let panel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", parent, 0, 0);
        BlzFrameSetPoint(panel, FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, x, y);
        panel.SetSize(panelX, panelY);
        return panel;
    }

    private static InitializeDetailsPanel()
    {
        detailsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        let detailsPanelX = frameX - (panelX + (panelPadding * 2));
        let detailsPanelY = frameY - (panelPadding * 2);
        detailsPanel.SetPoint(framepointtype.TopRight, -panelPadding, -panelPadding, shopFrame, framepointtype.TopRight);
        detailsPanel.SetSize(detailsPanelX, detailsPanelY);

        nameLabel = BlzCreateFrameByType("TEXT", "nameLabel", detailsPanel, "", 0);
        costLabel = BlzCreateFrameByType("TEXT", "costLabel", detailsPanel, "", 0);
        descriptionLabel = BlzCreateFrameByType("TEXT", "descriptionLabel", detailsPanel, "", 0);

        buyButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        sellButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        upgradeButton = BlzCreateFrame("DebugButton", detailsPanel, 0, 0);

        nameLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY / 6);
        costLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY / 6);
        descriptionLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY / 4);

        buyButton.SetSize(detailsPanelX / 3.00, detailsPanelY / 6);
        sellButton.SetSize(detailsPanelX / 3.00, detailsPanelY / 6);
        upgradeButton.SetSize(detailsPanelX / 3.0, detailsPanelY / 6);

        nameLabel.SetPoint(framepointtype.TopLeft, panelPadding / 2, -panelPadding, detailsPanel, framepointtype.TopLeft);
        costLabel.SetPoint(framepointtype.TopLeft, 0, -panelPadding, nameLabel, framepointtype.TopLeft);
        descriptionLabel.SetPoint(framepointtype.TopLeft, 0, 0, costLabel, framepointtype.BottomLeft);

        upgradeButton.SetPoint(framepointtype.BottomLeft, panelPadding, panelPadding, detailsPanel, framepointtype.BottomLeft);
        sellButton.SetPoint(framepointtype.BottomRight, -panelPadding, panelPadding, detailsPanel, framepointtype.BottomRight);
        buyButton.SetPoint(framepointtype.BottomLeft, 0, 0, sellButton, framepointtype.TopLeft);

        buyButton.Text = "Buy";
        sellButton.Text = "Sell";
        upgradeButton.Text = "Upgrade";

        let BuyTrigger = trigger.Create();
        BuyTrigger.RegisterFrameEvent(buyButton, frameeventtype.Click);
        BuyTrigger.AddAction(BuySelectedItem);

        let SellTrigger = trigger.Create();
        SellTrigger.RegisterFrameEvent(sellButton, frameeventtype.Click);
        SellTrigger.AddAction(SellSelectedItem);

        let UpgradeTrigger = trigger.Create();
        UpgradeTrigger.RegisterFrameEvent(upgradeButton, frameeventtype.Click);
        UpgradeTrigger.AddAction(RelicFunctions.UpgradeRelic);
    }

    private static LoadItemsIntoPanels()
    {
        try
        {
            AddItemsToPanel(relicsPanel, GetRelicItems());
            AddItemsToPanel(rewardsPanel, GetRewardItems());
            AddItemsToPanel(miscPanel, GetMiscItems());
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in LoadItemsIntoPanels: {ex}");
            throw ex
        }
    }

    private static AddItemsToPanel(panel: framehandle, items: ShopItem[])
    {
        let columns: number = 6;
        let rows: number = Math.Ceiling(items.Count / columns);
        for (let i: number = 0; i < items.Count; i++)
        {
            let row: number = i / columns;
            let column: number = i % columns;
            let name = items[i].Name;
            let button = BlzCreateFrameByType("BUTTON", name, panel, "ScoreScreenTabButtonTemplate", 0);
            let icon = BlzCreateFrameByType("BACKDROP", name + "icon", button, "", 0);

            let x = column * buttonWidth;
            let y = -row * buttonHeight;

            x += panelPadding / 2;
            y -= panelPadding / 2;

            button.SetSize(buttonWidth, buttonHeight);
            button.SetPoint(framepointtype.TopLeft, x, y, panel, framepointtype.TopLeft);
            icon.SetTexture(items[i].IconPath, 0, false);
            icon.SetPoints(button);

            let itemDetails = trigger.Create();
            let relic = items[i];
            CreateShopitemTooltips(button, relic);
            itemDetails.RegisterFrameEvent(BlzGetFrameByName(name, 0), frameeventtype.Click);
            itemDetails.AddAction( () => ShowItemDetails(relic));
        }

        let panelHeight: number = (rows * buttonHeight) + panelPadding;
        panel.SetSize((columns * buttonWidth) + panelPadding, panelHeight);
        if (panelHeight > panelY)
        {
            shopFrame.SetSize(frameX, frameY + (panelHeight - panelY));
            detailsPanel.SetSize(detailsPanelX, detailsPanelY + (panelHeight - panelY));
        }
    }

    private static UpdateButtonStatus(player: player)
    {
        try
        {
            if (!player.IsLocal) return;
            if (!SelectedItems.ContainsKey(player)) return;

            let item = SelectedItems[player];
            let kitty = Globals.ALL_KITTIES[player];

            upgradeButton.Visible = false;
            sellButton.Visible = false;
            buyButton.Visible = true;

            // basically if type == shopItem, it'll do the buttons.
            RelicButtons(player, item);

            if (item.Type == ShopItemType.Relic)
            {
                sellButton.Visible = true;
                sellButton.Alpha = DisabledAlpha;
                RefreshUpgradeTooltip(item.Relic);
                if (Utility.UnitHasItem(kitty.Unit, item.ItemID))
                    sellButton.Alpha = ActiveAlpha;
            }
        }
        catch (ex: Error)
        {
            Logger.Warning("Error in UpdateButtonStatus: {ex.Message}");
        }
    }

    private static RelicButtons(player: player, item: ShopItem)
    {
        if (item == null) return;
        if (item.Type != ShopItemType.Relic) return;
        let kitty = Globals.ALL_KITTIES[player].Unit;
        upgradeButton.Visible = true;
        sellButton.Visible = true;
        buyButton.Visible = true;
        if (!Utility.UnitHasItem(kitty, item.ItemID))
        {
            buyButton.Alpha = ActiveAlpha;
            sellButton.Alpha = DisabledAlpha;
            upgradeButton.Alpha = DisabledAlpha;
        }
        else
        {
            buyButton.Alpha = DisabledAlpha;
            sellButton.Alpha = ActiveAlpha;
            upgradeButton.Alpha = ActiveAlpha;
        }
        // Need to add another check for upgrades per player.
    }

    private static ShowItemDetails(shopItem: ShopItem)
    {
        let player = GetTriggerPlayer();
        let frame = BlzGetTriggerFrame(); 

        if (SelectedItems.ContainsKey(player)) SelectedItems[player] = shopItem;
        let SelectedItems: else.Add(player, shopItem);

        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);
        nameLabel.Text = "{Colors.COLOR_YELLOW_ORANGE}Name:{Colors.COLOR_RESET} {shopItem.Name}";
        costLabel.Text = "{Colors.COLOR_YELLOW}Cost:{Colors.COLOR_RESET} {shopItem.Cost}";
        descriptionLabel.Text = "{Colors.COLOR_YELLOW_ORANGE}Description:{Colors.COLOR_RESET} {shopItem.Description}";
        UpdateButtonStatus(player);
        if (shopItem.Type == ShopItemType.Relic)
            RefreshUpgradeTooltip(shopItem.Relic);
    }

    private static CreateUpgradeTooltip()
    {
        try
        {
            let background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
            upgradeTooltip = framehandle.Create("TEXT", "UpgradeTooltip", background, "", 0);

            upgradeTooltip.SetSize(0.25, 0);
            background.SetPoint(framepointtype.BottomLeft, -0.01, -0.01, upgradeTooltip, framepointtype.BottomLeft);
            background.SetPoint(framepointtype.TopRight, 0.01, 0.01, upgradeTooltip, framepointtype.TopRight);

            upgradeButton.SetTooltip(background);
            upgradeTooltip.SetPoint(framepointtype.Bottom, 0, 0.01, upgradeButton, framepointtype.Top);
            upgradeTooltip.Enabled = false;
        }
        catch (ex: Error)
        {
            Logger.Warning("Error in CreateUpgradeTooltip: {ex}");
        }
    }

    private static CreateShopitemTooltips(parent: framehandle, item: ShopItem)
    {
        try
        {
            let background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
            let tooltip = framehandle.Create("TEXT", "{parent.Name}Tooltip", background, "", 0);

            tooltip.SetSize(0.10, 0);
            background.SetPoint(framepointtype.BottomLeft, -0.01, -0.01, tooltip, framepointtype.BottomLeft);
            background.SetPoint(framepointtype.TopRight, 0.01, 0.01, tooltip, framepointtype.TopRight);

            parent.SetTooltip(background);
            tooltip.SetPoint(framepointtype.Bottom, 0, 0.01, parent, framepointtype.Top);
            tooltip.Enabled = false;

            tooltip.Text = item.Name;
        }
        catch (ex: Error)
        {
            Logger.Warning("Error in CreateShopitemTooltips: {ex}");
        }
    }

    public static RefreshUpgradeTooltip(relic: Relic)
    {
        let finalString = new StringBuilder();
        let playersUpgradeLevel = PlayerUpgrades.GetPlayerUpgrades(GetTriggerPlayer()).GetUpgradeLevel(relic.GetType());

        for (let i: number = 0; i < relic.Upgrades.Count; i++)
        {
            let upgrade = relic.Upgrades[i];
            let color: string, colorDescription;

            if (i < playersUpgradeLevel - 1)
            {
                color = Colors.COLOR_GREY;  // Grey out past upgrades
                colorDescription = Colors.COLOR_GREY;
            }
            else if (i == playersUpgradeLevel - 1)
            {
                color = Colors.COLOR_GREY;  // INCASE WE WANT TO CHANGE THE COLOR OF THE CURRENT UPGRADE OR ADD DETAILS
                colorDescription = Colors.COLOR_GREY;
            }
            else if (i == playersUpgradeLevel)
            {
                color = Colors.COLOR_YELLOW;  // Yellow for the next available upgrade
                colorDescription = Colors.COLOR_YELLOW_ORANGE;
            }
            else
            {
                color = Colors.COLOR_GREY;  // Grey for upgrades past next available upgrade.
                colorDescription = Colors.COLOR_GREY;
            }

            finalString.AppendLine("{color}[Upgrade {i + 1}] {upgrade.Cost}g{Colors.COLOR_RESET}");
            finalString.AppendLine("{colorDescription}{upgrade.Description}{Colors.COLOR_RESET}");
            finalString.AppendLine("----------------------------");
        }

        upgradeTooltip.Text = finalString.ToString();
    }

    private static BuySelectedItem()
    {
        let player = GetTriggerPlayer();
        try
        {
            if (player.IsLocal)
            {
                buyButton.Visible = false;
                buyButton.Visible = true;
            }
            if (!(ShopUtil.PlayerIsDead(player) && selectedItem = SelectedItems.TryGetValue(player)) /* TODO; Prepend: let */ && selectedItem != null)
            {
                let kitty = Globals.ALL_KITTIES[player];

                if (!HasEnoughGold(player, selectedItem.Cost))
                {
                    NotEnoughGold(player, selectedItem.Cost);
                    return;
                }

                switch (selectedItem.Type)
                {
                    case ShopItemType.Relic:
                        RelicFunctions.HandleRelicPurchase(player, selectedItem, kitty);
                        break;

                    case ShopItemType.Reward:
                        AwardManager.GiveReward(player, selectedItem.Award);
                        ReduceGold(player, selectedItem.Cost);
                        break;

                    case ShopItemType.Misc:
                        AddItem(player, selectedItem.ItemID);
                        ReduceGold(player, selectedItem.Cost);
                        break;
                }
            }
            // hide shop after purchase
            if (player.IsLocal)
                shopFrame.Visible = !shopFrame.Visible;

        }
        catch (ex: Error)
        {
            Logger.Warning("Error in BuySelectedItem: {ex.Message}");
        }
    }

    private static SellSelectedItem()
    {
        let player = GetTriggerPlayer();
        try
        {
            if (player.IsLocal)
            {
                sellButton.Visible = false; sellButton.Visible = true;
            }
            if (selectedItem = SelectedItems.TryGetValue(player) /* TODO; Prepend: let */ && selectedItem != null)
            {
                let itemID = selectedItem.ItemID;
                let kitty = Globals.ALL_KITTIES[player];
                if (!Utility.UnitHasItem(kitty.Unit, itemID)) return;
                if (selectedItem.Type == ShopItemType.Relic)
                {
                    if (!kitty.Alive || kitty.ProtectionActive)
                    {
                        player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}cannot: sell: a: relic: while: your: kitty: You is dead!{Colors.COLOR_RESET}");
                        return;
                    }

                    if (!CanSellRelic(kitty.Unit))
                    {
                        player.DisplayTimedTextTo(5.0, "{Colors.COLOR_RED}cannot: sell: relics: until: level: You {Relic.RelicSellLevel}.{Colors.COLOR_RESET}");
                        return;
                    }

                    // Find the shopItem type associated with the selected item that the player owns.
                    let relic = kitty.Relics.Find(x => x.GetType() == selectedItem.Relic.GetType());

                    if (!RelicFunctions.CannotSellOnCD(kitty, relic)) return;

                    Utility.RemoveItemFromUnit(kitty.Unit, itemID);
                    player.Gold += selectedItem.Cost;
                    relic?.RemoveEffect(kitty.Unit);
                    kitty.Relics.Remove(relic);
                    return;
                }

                Utility.RemoveItemFromUnit(kitty.Unit, itemID);
                player.Gold += selectedItem.Cost;
            }
        }
        catch (ex: Error)
        {
            Logger.Warning("Error in SellSelectedItem: {ex.Message}");
        }
    }

    private static GetRelicItems(): ShopItem[]  { return ShopItem.ShopItemsRelic(); }

    private static GetRewardItems(): ShopItem[]  { return ShopItem.ShopItemsReward(); }

    private static GetMiscItems(): ShopItem[]  { return ShopItem.ShopItemsMisc(); }

    private static HasEnoughGold(player: player, cost: number)  { return player.Gold >= cost; }

    private static CanSellRelic(unit: unit)  { return unit.HeroLevel >= Relic.RelicSellLevel; }

    private static ReduceGold(player: player, amount: number)  { return player.Gold -= amount; }

    public static NotEnoughGold(player: player, cost: number)  { return player.DisplayTimedTextTo(8.0, "{Colors.COLOR_RED}do: not: have: enough: gold: You.|r {Colors.COLOR_YELLOW}({cost} gold)|r"); }

    private static AddItem(player: player, itemID: number)  { return Globals.ALL_KITTIES[player].Unit.AddItem(itemID); }

    private static SetRewardsFrameHotkey()
    {
        try
        {
            let shopFrameHotkey: trigger = trigger.Create();
            for (let player in Globals.ALL_PLAYERS)
            {
                shopFrameHotkey.RegisterPlayerKeyEvent(player, OSKEY_OEM_PLUS, 0, true);
            }
            shopFrameHotkey.AddAction(ErrorHandler.Wrap(() => ShopFrameActions()));
        }
        catch (ex: Error)
        {
            Logger.Warning("Error in SetRewardsFrameHotkey: {ex}");
        }
    }

    public static ShopFrameActions()
    {
        let player = GetTriggerPlayer();
        if (!player.IsLocal) return;
        FrameManager.ShopButton.Visible = false;
        FrameManager.ShopButton.Visible = true;
        FrameManager.HideOtherFrames(shopFrame);
        if (Gamemode.CurrentGameMode == GameMode.SoloTournament) // solo mode.
        {
            player.DisplayTimedTextTo(6.0, "{Colors.COLOR_RED}shop: The is accessible: not in mode: this.{Colors.COLOR_RESET}");
            return;
        }
        shopFrame.Visible = !shopFrame.Visible;
        UpdateButtonStatus(player);
        if (shopFrame.Visible)
            MultiboardUtil.MinMultiboards(player, true);
    }
}
