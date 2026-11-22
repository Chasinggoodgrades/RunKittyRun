using System;
using System.Collections.Generic;
using System.Text;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ShopFrame
{
    public static framehandle shopFrame { get; private set; }
    public static framehandle upgradeButton;
    public static Dictionary<player, ShopItem> SelectedItems { get; set; } = new Dictionary<player, ShopItem>();
    private static framehandle relicsPanel;
    private static framehandle rewardsPanel;
    private static framehandle miscPanel;
    private static framehandle detailsPanel;
    private static framehandle detailIcon;
    private static framehandle detailIconFrame;
    private static framehandle detailDivider;
    private static framehandle costIcon;
    private static framehandle nameLabel;
    private static framehandle descriptionLabel;
    private static framehandle costLabel;
    private static framehandle buyButton;
    private static framehandle sellButton;
    private static framehandle upgradeTooltip;
    private static framehandle selectedMarker; // local only: the highlight of the slot this machine's player picked
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);

    // Layout (frame coordinates). Everything is derived from these, so the look can be tuned here.
    private const float slotSize = 0.026f;
    private const float slotPitch = 0.0285f;
    private const int slotColumns = 6;
    private const float slotMargin = 0.008f;
    private const float panelPadding = 0.015f;
    private const float panelGap = 0.022f;       // between two item panels, room for the panel title
    private const float topInset = 0.032f;       // header + first panel title
    private const float bottomInset = 0.014f;
    private const float frameX = 0.4f;
    private const float minFrameY = 0.25f;
    private const float panelX = (frameX / 2) - panelPadding;
    private const float detailsPanelX = frameX - (panelX + (panelPadding * 2));
    private const float detailsIconSize = 0.04f;
    private const float detailsPad = 0.012f;
    private const float buttonHeight = 0.024f;
    private const float buttonGap = 0.005f;
    private const int ActiveAlpha = 255;
    private const int DisabledAlpha = 150;
    private const string GoldIconPath = "UI\\Widgets\\ToolTips\\Human\\ToolTipGoldIcon.blp";
    private const string EmptyIconPath = "UI\\Widgets\\EscMenu\\Human\\blank-background.blp";

    public static void Initialize()
    {
        InitializeShopFrame();
        shopFrame.Visible = false;
    }

    public static void FinishInitialization()
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
        catch (Exception ex)
        {
            Logger.Critical($"Error in ShopFrame: {ex.Message}");
            throw;
        }
    }

    private static void InitializeShopFrame()
    {
        shopFrame = BlzCreateFrame("ShopWindowBackdrop", GameUI, 0, 0);
        BlzFrameSetAbsPoint(shopFrame, FRAMEPOINT_CENTER, 0.40f, 0.375f);
        BlzFrameSetSize(shopFrame, frameX, minFrameY);
        FrameManager.CreateHeaderFrame(shopFrame, "Shop");
    }

    private static void InitializePanels()
    {
        relicsPanel = BlzCreateFrame("ShopPanelBackdrop", shopFrame, 0, 0);
        relicsPanel.SetPoint(FRAMEPOINT_TOPLEFT, panelPadding, -topInset, shopFrame, FRAMEPOINT_TOPLEFT);
        relicsPanel.SetSize(panelX, 0.05f);
        rewardsPanel = CreatePanel(relicsPanel);
        miscPanel = CreatePanel(rewardsPanel);
    }

    private static void InitializePanelTitles()
    {
        CreatePanelTitle(relicsPanel, $"Relics (Lvl:{Relic.RequiredLevel})");
        CreatePanelTitle(rewardsPanel, "Rewards");
        CreatePanelTitle(miscPanel, "Miscellaneous");
    }

    private static void CreatePanelTitle(framehandle panel, string title)
    {
        var titleFrame = BlzCreateFrame("ShopPanelTitleText", panel, 0, 0);
        titleFrame.SetSize(panelX, 0.014f);
        BlzFrameSetPoint(titleFrame, FRAMEPOINT_BOTTOM, panel, FRAMEPOINT_TOP, 0, 0.002f);
        BlzFrameSetText(titleFrame, title);
        titleFrame.SetTextAlignment(textaligntype.Center, textaligntype.Center);
    }

    private static framehandle CreatePanel(framehandle parent)
    {
        var panel = BlzCreateFrame("ShopPanelBackdrop", parent, 0, 0);
        BlzFrameSetPoint(panel, FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, 0, -panelGap);
        panel.SetSize(panelX, 0.05f);
        return panel;
    }

    private static void InitializeDetailsPanel()
    {
        detailsPanel = BlzCreateFrame("ShopPanelBackdrop", shopFrame, 0, 0);
        detailsPanel.SetPoint(framepointtype.TopRight, -panelPadding, -panelPadding, shopFrame, framepointtype.TopRight);
        detailsPanel.SetSize(detailsPanelX, minFrameY - (panelPadding * 2));

        var contentWidth = detailsPanelX - (detailsPad * 2);

        // item icon with its own slot frame, name and cost beside it
        detailIconFrame = BlzCreateFrame("ShopSlotBackdropFrame", detailsPanel, 0, 0);
        detailIconFrame.SetSize(detailsIconSize, detailsIconSize);
        detailIconFrame.SetPoint(framepointtype.TopLeft, detailsPad, -detailsPad, detailsPanel, framepointtype.TopLeft);
        detailIcon = BlzCreateFrameByType("BACKDROP", "ShopDetailsIcon", detailIconFrame, "", 0);
        detailIcon.SetPoint(framepointtype.TopLeft, 0.003f, -0.003f, detailIconFrame, framepointtype.TopLeft);
        detailIcon.SetPoint(framepointtype.BottomRight, -0.003f, 0.003f, detailIconFrame, framepointtype.BottomRight);
        detailIcon.SetTexture(EmptyIconPath, 0, false);

        nameLabel = BlzCreateFrame("ShopNameText", detailsPanel, 0, 0);
        nameLabel.SetSize(contentWidth - detailsIconSize - 0.008f, 0.026f);
        nameLabel.SetPoint(framepointtype.TopLeft, 0.008f, 0, detailIconFrame, framepointtype.TopRight);

        costIcon = BlzCreateFrameByType("BACKDROP", "ShopCostIcon", detailsPanel, "", 0);
        costIcon.SetSize(0.012f, 0.012f);
        costIcon.SetPoint(framepointtype.BottomLeft, 0.008f, 0.001f, detailIconFrame, framepointtype.BottomRight);
        costIcon.SetTexture(GoldIconPath, 0, true);

        costLabel = BlzCreateFrame("ShopCostText", detailsPanel, 0, 0);
        costLabel.SetSize(contentWidth - detailsIconSize - 0.024f, 0.014f);
        costLabel.SetPoint(framepointtype.Left, 0.003f, 0, costIcon, framepointtype.Right);

        detailDivider = BlzCreateFrame("ShopDividerBackdrop", detailsPanel, 0, 0);
        detailDivider.SetSize(contentWidth, 0.004f);
        detailDivider.SetPoint(framepointtype.TopLeft, 0, -0.007f, detailIconFrame, framepointtype.BottomLeft);

        // buttons: Buy / Sell on the bottom row, Upgrade across the row above
        buyButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        sellButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        upgradeButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);

        var halfWidth = (contentWidth - buttonGap) / 2;
        buyButton.SetSize(halfWidth, buttonHeight);
        sellButton.SetSize(halfWidth, buttonHeight);
        upgradeButton.SetSize(contentWidth, buttonHeight);

        buyButton.SetPoint(framepointtype.BottomLeft, detailsPad, detailsPad, detailsPanel, framepointtype.BottomLeft);
        sellButton.SetPoint(framepointtype.BottomRight, -detailsPad, detailsPad, detailsPanel, framepointtype.BottomRight);
        upgradeButton.SetPoint(framepointtype.BottomLeft, 0, buttonGap, buyButton, framepointtype.TopLeft);

        // the description takes everything between the divider and the button stack (a text frame clips at its height)
        descriptionLabel = BlzCreateFrame("ShopDescText", detailsPanel, 0, 0);
        descriptionLabel.SetPoint(framepointtype.TopLeft, 0, -0.005f, detailDivider, framepointtype.BottomLeft);
        descriptionLabel.SetPoint(framepointtype.BottomRight, -detailsPad, detailsPad + (buttonHeight * 2) + (buttonGap * 2), detailsPanel, framepointtype.BottomRight);

        buyButton.Text = "Buy";
        sellButton.Text = "Sell";
        upgradeButton.Text = "Upgrade";

        // nothing picked yet
        nameLabel.Text = "Shop";
        descriptionLabel.Text = "Select an item to see its details.";
        costIcon.Visible = false;
        costLabel.Visible = false;
        detailIconFrame.Visible = false;
        buyButton.Visible = false;
        sellButton.Visible = false;
        upgradeButton.Visible = false;

        var BuyTrigger = trigger.Create();
        BuyTrigger.RegisterFrameEvent(buyButton, frameeventtype.Click);
        BuyTrigger.AddAction(BuySelectedItem);

        var SellTrigger = trigger.Create();
        SellTrigger.RegisterFrameEvent(sellButton, frameeventtype.Click);
        SellTrigger.AddAction(SellSelectedItem);

        var UpgradeTrigger = trigger.Create();
        UpgradeTrigger.RegisterFrameEvent(upgradeButton, frameeventtype.Click);
        UpgradeTrigger.AddAction(RelicFunctions.UpgradeRelic);
    }

    private static void LoadItemsIntoPanels()
    {
        try
        {
            var total = AddItemsToPanel(relicsPanel, GetRelicItems());
            total += AddItemsToPanel(rewardsPanel, GetRewardItems());
            total += AddItemsToPanel(miscPanel, GetMiscItems());

            // the window grows to fit every panel; the details panel follows it
            var frameY = topInset + total + (panelGap * 2) + bottomInset;
            if (frameY < minFrameY) frameY = minFrameY;
            shopFrame.SetSize(frameX, frameY);
            detailsPanel.SetSize(detailsPanelX, frameY - (panelPadding * 2));
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in LoadItemsIntoPanels: {ex}");
            throw;
        }
    }

    /// <summary>Fills a panel with item slots and returns the height the panel needs.</summary>
    private static float AddItemsToPanel(framehandle panel, List<ShopItem> items)
    {
        int rows = (int)Math.Ceiling((double)items.Count / slotColumns);
        for (int i = 0; i < items.Count; i++)
        {
            int row = i / slotColumns;
            int column = i % slotColumns;
            var item = items[i];
            var button = FrameManager.CreateSlotButton(panel, out var icon);
            var marker = BlzCreateFrame("ShopSelectorBackdrop", button, 0, 0);

            button.SetSize(slotSize, slotSize);
            button.SetPoint(framepointtype.TopLeft, slotMargin + (column * slotPitch), -(slotMargin + (row * slotPitch)), panel, framepointtype.TopLeft);

            var iconPath = item.IconPath;
            if (string.IsNullOrWhiteSpace(iconPath) || iconPath.EndsWith(".dds", StringComparison.OrdinalIgnoreCase))
            {
                iconPath = Utility.GetItemIconPath(item.ItemID);
            }
            item.IconPath = iconPath; // the details panel shows it too
            icon.SetTexture(iconPath, 0, false);

            marker.SetPoint(framepointtype.TopLeft, -0.001f, 0.001f, button, framepointtype.TopLeft);
            marker.SetPoint(framepointtype.BottomRight, 0.001f, -0.001f, button, framepointtype.BottomRight);
            marker.Visible = false;

            var itemDetails = trigger.Create();
            CreateShopitemTooltips(button, item, i);
            itemDetails.RegisterFrameEvent(button, frameeventtype.Click);
            itemDetails.AddAction(() => ShowItemDetails(item, marker));
        }

        float panelHeight = (rows * slotPitch) + (slotMargin * 2) - (slotPitch - slotSize);
        panel.SetSize(panelX, panelHeight);
        return panelHeight;
    }

    private static void UpdateButtonStatus(player player)
    {
        try
        {
            if (!player.IsLocal) return;
            if (!SelectedItems.ContainsKey(player)) return;

            var item = SelectedItems[player];
            var kitty = Globals.ALL_KITTIES[player];

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
        catch (Exception ex)
        {
            Logger.Warning($"Error in UpdateButtonStatus: {ex.Message}");
        }
    }

    private static void RelicButtons(player player, ShopItem item)
    {
        if (item == null) return;
        if (item.Type != ShopItemType.Relic) return;
        var kitty = Globals.ALL_KITTIES[player].Unit;
        upgradeButton.Visible = item.Relic.Upgrades.Count > 0;
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

    private static void ShowItemDetails(ShopItem shopItem, framehandle marker)
    {
        var player = @event.Player;
        var frame = @event.Frame;

        if (SelectedItems.ContainsKey(player)) SelectedItems[player] = shopItem;
        else SelectedItems.Add(player, shopItem);

        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);

        if (selectedMarker != null) selectedMarker.Visible = false;
        selectedMarker = marker;
        selectedMarker.Visible = true;

        detailIcon.SetTexture(shopItem.IconPath ?? EmptyIconPath, 0, false);
        detailIconFrame.Visible = true;
        costIcon.Visible = true;
        costLabel.Visible = true;

        nameLabel.Text = shopItem.Name;
        costLabel.Text = $"{Colors.COLOR_YELLOW}{shopItem.Cost}{Colors.COLOR_RESET}";
        descriptionLabel.Text = shopItem.Description;
        UpdateButtonStatus(player);
        if (shopItem.Type == ShopItemType.Relic)
            RefreshUpgradeTooltip(shopItem.Relic);
    }

    private static void CreateUpgradeTooltip()
    {
        try
        {
            upgradeTooltip = FrameManager.CreateThemedTooltip(0.25f, 0.01f, out var background);

            upgradeButton.SetTooltip(background);
            upgradeTooltip.SetPoint(framepointtype.Bottom, 0, 0.01f, upgradeButton, framepointtype.Top);
            upgradeTooltip.Enabled = false;
        }
        catch (Exception ex)
        {
            Logger.Warning($"Error in CreateUpgradeTooltip: {ex}");
        }
    }

    private static void CreateShopitemTooltips(framehandle parent, ShopItem item, int index)
    {
        try
        {
            var tooltip = FrameManager.CreateThemedTooltip(0.10f, 0.008f, out var background);

            parent.SetTooltip(background);
            tooltip.SetPoint(framepointtype.Bottom, 0, 0.01f, parent, framepointtype.Top);
            tooltip.Enabled = false;

            tooltip.Text = item.Name;
            tooltip.SetTextAlignment(textaligntype.Center, textaligntype.Center);
        }
        catch (Exception ex)
        {
            Logger.Warning($"Error in CreateShopitemTooltips: {ex}");
        }
    }

    public static void RefreshUpgradeTooltip(Relic relic)
    {
        var finalString = new StringBuilder();
        var playersUpgradeLevel = PlayerUpgrades.GetPlayerUpgrades(@event.Player).GetUpgradeLevel(relic.GetType());

        for (int i = 0; i < relic.Upgrades.Count; i++)
        {
            var upgrade = relic.Upgrades[i];
            string color, colorDescription;

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

            finalString.AppendLine($"{color}[Upgrade {i + 1}] {upgrade.Cost}g{Colors.COLOR_RESET}");
            finalString.AppendLine($"{colorDescription}{upgrade.Description}{Colors.COLOR_RESET}");
            finalString.AppendLine("----------------------------");
        }

        upgradeTooltip.Text = finalString.ToString();
    }

    private static void BuySelectedItem()
    {
        var player = @event.Player;
        try
        {
            if (player.IsLocal)
            {
                buyButton.Visible = false;
                buyButton.Visible = true;
            }
            if (!ShopUtil.PlayerIsDead(player) && SelectedItems.TryGetValue(player, out var selectedItem) && selectedItem != null)
            {
                var kitty = Globals.ALL_KITTIES[player];

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
        catch (Exception ex)
        {
            Logger.Warning($"Error in BuySelectedItem: {ex.Message}");
        }
    }

    private static void SellSelectedItem()
    {
        var player = @event.Player;
        try
        {
            if (player.IsLocal)
            {
                sellButton.Visible = false; sellButton.Visible = true;
            }
            if (SelectedItems.TryGetValue(player, out var selectedItem) && selectedItem != null)
            {
                var itemID = selectedItem.ItemID;
                var kitty = Globals.ALL_KITTIES[player];
                if (!Utility.UnitHasItem(kitty.Unit, itemID)) return;
                if (selectedItem.Type == ShopItemType.Relic)
                {
                    if (!kitty.Alive || kitty.ProtectionActive)
                    {
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell a relic while your kitty is dead!{Colors.COLOR_RESET}");
                        return;
                    }

                    /*
                    if (!CanSellRelic(kitty.Unit))
                    {
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell relics until level {Relic.RelicSellLevel}.{Colors.COLOR_RESET}");
                        return;
                    }
                    */

                    // Find the shopItem type associated with the selected item that the player owns.
                    var relic = kitty.Relics.Find(x => x.GetType() == selectedItem.Relic.GetType());

                    if (!RelicFunctions.CannotSellOnCD(kitty, relic)) return;

                    Utility.RemoveItemFromUnit(kitty.Unit, itemID);
                    player.Gold += selectedItem.Cost;
                    relic?.RemoveEffect(kitty.Unit);
                    kitty.Relics.Remove(relic);
                    UpdateButtonStatus(player);
                    return;
                }

                Utility.RemoveItemFromUnit(kitty.Unit, itemID);
                player.Gold += selectedItem.Cost;
                UpdateButtonStatus(player);
            }
        }
        catch (Exception ex)
        {
            Logger.Warning($"Error in SellSelectedItem: {ex.Message}");
        }
    }

    private static List<ShopItem> GetRelicItems() => ShopItem.ShopItemsRelic();

    private static List<ShopItem> GetRewardItems() => ShopItem.ShopItemsReward();

    private static List<ShopItem> GetMiscItems() => ShopItem.ShopItemsMisc();

    private static bool HasEnoughGold(player player, int cost) => player.Gold >= cost;

    private static bool CanSellRelic(unit unit) => unit.HeroLevel >= Relic.RelicSellLevel;

    private static void ReduceGold(player player, int amount) => player.Gold -= amount;

    public static void NotEnoughGold(player player, int cost) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You do not have enough gold.|r {Colors.COLOR_YELLOW}({cost} gold)|r");

    private static void AddItem(player player, int itemID) => Globals.ALL_KITTIES[player].Unit.AddItem(itemID);

    private static void SetRewardsFrameHotkey()
    {
        try
        {
            trigger shopFrameHotkey = trigger.Create();
            foreach (var player in Globals.ALL_PLAYERS)
            {
                shopFrameHotkey.RegisterPlayerKeyEvent(player, OSKEY_OEM_PLUS, 0, true);
            }
            shopFrameHotkey.AddAction(ErrorHandler.Wrap(() => ShopFrameActions()));
        }
        catch (Exception ex)
        {
            Logger.Warning($"Error in SetRewardsFrameHotkey: {ex}");
        }
    }

    public static void ShopFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        FrameManager.ShopButton.Visible = false;
        FrameManager.ShopButton.Visible = true;
        FrameManager.HideOtherFrames(shopFrame);
        if (Gamemode.CurrentGameMode == GameMode.Solo) // solo mode.
        {
            player.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_RED}The shop is not accessible in this mode.{Colors.COLOR_RESET}");
            return;
        }
        shopFrame.Visible = !shopFrame.Visible;
        UpdateButtonStatus(player);
        if (shopFrame.Visible)
            MultiboardUtil.MinMultiboards(player, true);
    }
}
