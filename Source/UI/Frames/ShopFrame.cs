using WCSharp.Api;
using static WCSharp.Api.Common;
using System.Collections.Generic;
using System;

public static class ShopFrame
{
    public static framehandle shopFrame;
    private static framehandle relicsPanel;
    private static framehandle rewardsPanel;
    private static framehandle miscPanel;
    private static framehandle detailsPanel;
    private static framehandle nameLabel;
    private static framehandle descriptionLabel;
    private static framehandle costLabel;
    private static framehandle buyButton;
    private static framehandle sellButton;
    private static framehandle upgradeButton;
    private const float buttonWidth = 0.025f;
    private const float buttonHeight = 0.025f;
    private const float panelPadding = 0.015f;
    private const float frameX = 0.4f;
    private const float frameY = 0.25f;
    private const float panelX = (frameX/2) - panelPadding;
    private const float panelY = (frameY/3) - panelPadding*2;
    private const float detailsPanelX = frameX - (panelX + panelPadding * 2);
    private const float detailsPanelY = frameY - (panelPadding * 2);
    private const int ActiveAlpha = 255;
    private const int DisabledAlpha = 150;
    private const string DisabledPath = "UI\\Widgets\\EscMenu\\Human\\human-options-button-background-disabled.blp";
    private static Dictionary<player, ShopItem> SelectedItems = new Dictionary<player, ShopItem>();

    public static void Initialize()
    {
        InitializeShopFrame();
        shopFrame.Visible = false;
    }

    public static void FinishInitialization()
    {
        InitializePanels();
        InitializeDetailsPanel();
        InitializePanelTitles();
        LoadItemsIntoPanels();
        shopFrame.Visible = false;
    }

    private static void InitializeShopFrame()
    {
        shopFrame = BlzCreateFrameByType("BACKDROP", "Shop Frame", BlzGetFrameByName("ConsoleUIBackdrop", 0), "QuestButtonPushedBackdropTemplate", 0);
        BlzFrameSetAbsPoint(shopFrame, FRAMEPOINT_CENTER, 0.40f, 0.375f);
        BlzFrameSetSize(shopFrame, frameX, frameY);
        FrameManager.CreateHeaderFrame(shopFrame);
    }

    private static void InitializePanels()
    {
        relicsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        relicsPanel.SetPoint(FRAMEPOINT_TOPLEFT, panelPadding, -panelPadding*2, shopFrame, FRAMEPOINT_TOPLEFT);
        relicsPanel.SetSize(panelX, panelY);
        rewardsPanel = CreatePanel(relicsPanel, 0, -panelPadding);
        miscPanel = CreatePanel(rewardsPanel, 0, -panelPadding);
    }

    private static void InitializePanelTitles()
    {
        CreatePanelTitle(relicsPanel, $"Relics (Lvl:{Relic.RequiredLevel})");
        CreatePanelTitle(rewardsPanel, "Rewards");
        CreatePanelTitle(miscPanel, "Miscellaneous");
    }

    private static void CreatePanelTitle(framehandle panel, string title)
    {
        var titleFrame = BlzCreateFrameByType("TEXT", "titleFrame", panel, "", 0);
        BlzFrameSetPoint(titleFrame, FRAMEPOINT_TOP, panel, FRAMEPOINT_TOP, 0, 0.01f);
        BlzFrameSetText(titleFrame, title);
        BlzFrameSetTextColor(titleFrame, BlzConvertColor(255, 255, 255, 0));
        BlzFrameSetScale(titleFrame, 1.2f);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y)
    {
        var panel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", parent, 0, 0);
        BlzFrameSetPoint(panel, FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, x, y);
        panel.SetSize(panelX, panelY);
        return panel;
    }

    private static void InitializeDetailsPanel()
    {
        detailsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        var detailsPanelX = frameX - (panelX + panelPadding*2);
        var detailsPanelY = frameY - (panelPadding * 2);
        detailsPanel.SetPoint(framepointtype.TopRight, -panelPadding, -panelPadding, shopFrame, framepointtype.TopRight);
        detailsPanel.SetSize(detailsPanelX, detailsPanelY);

        nameLabel = BlzCreateFrameByType("TEXT", "nameLabel", detailsPanel, "", 0);
        costLabel = BlzCreateFrameByType("TEXT", "costLabel", detailsPanel, "", 0);
        descriptionLabel = BlzCreateFrameByType("TEXT", "descriptionLabel", detailsPanel, "", 0);
        
        buyButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        sellButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        upgradeButton = BlzCreateFrame("DebugButton", detailsPanel, 0, 0);

        nameLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY/6);
        costLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY/6);
        descriptionLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY / 4);

        buyButton.SetSize(detailsPanelX/3.00f, detailsPanelY/6);
        sellButton.SetSize(detailsPanelX/3.00f, detailsPanelY/6);
        upgradeButton.SetSize(detailsPanelX/3.0f, detailsPanelY/6);

        nameLabel.SetPoint(framepointtype.TopLeft, panelPadding/2, -panelPadding, detailsPanel, framepointtype.TopLeft);
        costLabel.SetPoint(framepointtype.TopLeft, 0, -panelPadding, nameLabel, framepointtype.TopLeft);
        descriptionLabel.SetPoint(framepointtype.TopLeft, 0, 0, costLabel, framepointtype.BottomLeft);

        upgradeButton.SetPoint(framepointtype.BottomLeft, panelPadding, panelPadding, detailsPanel, framepointtype.BottomLeft);
        sellButton.SetPoint(framepointtype.BottomRight, -panelPadding, panelPadding, detailsPanel, framepointtype.BottomRight);
        buyButton.SetPoint(framepointtype.BottomLeft, 0, 0, sellButton, framepointtype.TopLeft);

        buyButton.Text = "Buy";
        sellButton.Text = "Sell";
        upgradeButton.Text = "Upgrade";

        var BuyTrigger = trigger.Create();
        BuyTrigger.RegisterFrameEvent(buyButton, frameeventtype.Click);
        BuyTrigger.AddAction( () => BuySelectedItem() );

        var SellTrigger = trigger.Create();
        SellTrigger.RegisterFrameEvent(sellButton, frameeventtype.Click);
        SellTrigger.AddAction( () => SellSelectedItem() );

        var UpgradeTrigger = trigger.Create();
        UpgradeTrigger.RegisterFrameEvent(upgradeButton, frameeventtype.Click);
        UpgradeTrigger.AddAction( () => UpgradeRelic() );

    }

    private static void LoadItemsIntoPanels()
    {
        AddItemsToPanel(relicsPanel, GetRelicItems());
        AddItemsToPanel(rewardsPanel, GetRewardItems());
        AddItemsToPanel(miscPanel, GetMiscItems());
    }

    private static void AddItemsToPanel(framehandle panel, List<ShopItem> items)
    {
        int columns = 6;
        int rows = (int)Math.Ceiling((double)items.Count / columns);

        for (int i = 0; i < items.Count; i++)
        {
            int row = i / columns;
            int column = i % columns;
            var name = items[i].Name;
            var button = BlzCreateFrameByType("BUTTON", name, panel, "ScoreScreenTabButtonTemplate", 0);
            var icon = BlzCreateFrameByType("BACKDROP", name + "icon", button, "", 0);

            var x = column * (buttonWidth);
            var y = -row * (buttonHeight);

            x += panelPadding / 2;
            y -= panelPadding / 2;

            button.SetSize(buttonWidth, buttonHeight);
            button.SetPoint(framepointtype.TopLeft, x, y, panel, framepointtype.TopLeft);
            icon.SetTexture(items[i].IconPath, 0, false);
            icon.SetPoints(button);

            var itemDetails = trigger.Create();
            var relic = items[i];
            itemDetails.RegisterFrameEvent(BlzGetFrameByName(name, 0), frameeventtype.Click);
            itemDetails.AddAction(() => ShowItemDetails(relic));
        }

        float panelHeight = rows * (buttonHeight) + panelPadding;
        panel.SetSize(columns * (buttonWidth) + panelPadding, panelHeight);
        if (panelHeight > panelY)
        {
            shopFrame.SetSize(frameX, frameY + (panelHeight - panelY));
            detailsPanel.SetSize(detailsPanelX, detailsPanelY + (panelHeight - panelY));
        }
    }

    private static void UpdateButtonStatus(player player)
    {
        if (!player.IsLocal) return;
        if (SelectedItems[player] == null) return;

        var item = SelectedItems[player];
        var kitty = Globals.ALL_KITTIES[player];

        upgradeButton.Visible = false;
        sellButton.Visible = false; 
        buyButton.Visible = true;

        // basically if type == relic, it'll do the buttons.
        RelicButtons(player, item);

        if (item.Type == ShopItemType.Misc)
        {
            sellButton.Visible = true;
            sellButton.Alpha = DisabledAlpha;
            if (Utility.UnitHasItem(kitty.Unit, item.ItemID))
                sellButton.Alpha = ActiveAlpha;
        }
    }

    private static void RelicButtons(player player, ShopItem item)
    {
        if (item == null) return;
        if (item.Type != ShopItemType.Relic) return;
        var kitty = Globals.ALL_KITTIES[player].Unit;
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

        private static void ShowItemDetails(ShopItem relic)
    {
        var player = @event.Player;
        var frame = @event.Frame;

        if (SelectedItems.ContainsKey(player)) SelectedItems[player] = relic;
        else SelectedItems.Add(player, relic);

        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);
        nameLabel.Text = $"{Colors.COLOR_YELLOW_ORANGE}Name:|r {relic.Name}";
        costLabel.Text = $"{Colors.COLOR_YELLOW}Cost:|r {relic.Cost}";
        descriptionLabel.Text = $"{Colors.COLOR_YELLOW_ORANGE}Description:|r {relic.Description}";
        UpdateButtonStatus(player);
    }

    private static void BuySelectedItem()
    {
        var player = @event.Player;

        if (SelectedItems.TryGetValue(player, out var selectedItem) && selectedItem != null)
        {
            var type = selectedItem.Type;
            var cost = selectedItem.Cost;
            var itemID = selectedItem.ItemID;
            var kitty = Globals.ALL_KITTIES[player];

            if (!HasEnoughGold(player, cost))
            {
                NotEnoughGold(player, cost);
                return;
            }

            if (type == ShopItemType.Relic)
            {
                if (Utility.UnitHasItem(kitty.Unit, itemID))
                {
                    AlreadyHaveRelic(player);
                    return;
                }
                if (!RelicLevel(kitty.Unit))
                {
                    NotHighEnoughLevel(player);
                    return;
                }
                selectedItem.Relic.ApplyEffect(kitty.Unit);
            }
            if (type == ShopItemType.Reward)
            {
                AwardManager.GiveReward(player, selectedItem.Award);
            }
            ReduceGold(player, cost);
            if (type != ShopItemType.Reward)
            {
                AddItem(player, itemID);
            }
        }

        // If item is bought, the frame will disappear for the player.
        if (player.IsLocal) shopFrame.Visible = !shopFrame.Visible;
    }

    private static void SellSelectedItem()
    {
        var player = @event.Player;
        if (SelectedItems.TryGetValue(player, out var selectedItem) && selectedItem != null)
        {
            var itemID = selectedItem.ItemID;
            var kitty = Globals.ALL_KITTIES[player].Unit;
            if (!Utility.UnitHasItem(kitty, itemID)) return;
            if (selectedItem.Type == ShopItemType.Relic)
                selectedItem.Relic.RemoveEffect(kitty);
            Utility.RemoveItemFromUnit(kitty, itemID);
            player.Gold += selectedItem.Cost;

        }
    }

    private static void UpgradeRelic()
    {
        var player = @event.Player;
    }

    private static List<ShopItem> GetRelicItems() => ShopItem.ShopItemsRelic;
    private static List<ShopItem> GetRewardItems() => ShopItem.ShopItemsReward();
    private static List<ShopItem> GetMiscItems() => ShopItem.ShopItemsMisc();

    private static bool HasEnoughGold(player player, int cost) => player.Gold >= cost;
    private static void ReduceGold(player player, int amount) => player.Gold -= amount;
    private static bool RelicLevel(unit unit) => unit.Level >= Relic.RequiredLevel;
    private static void NotHighEnoughLevel(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You are not high enough level to purchase this relic!|r {Colors.COLOR_YELLOW}(Level {Relic.RequiredLevel})");
    private static void RelicMaxedOut(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already have the maximum amount of this relic!");
    private static void AlreadyHaveRelic(player player) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You already own this relic!");
    private static void NotEnoughGold(player player, int cost) => player.DisplayTimedTextTo(8.0f, $"{Colors.COLOR_RED}You do not have enough gold.|r {Colors.COLOR_YELLOW}({cost} gold)|r");
    private static void AddItem(player player, int itemID) => Globals.ALL_KITTIES[player].Unit.AddItem(itemID);

    public static void ShopFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        FrameManager.ShopButton.Visible = false;
        FrameManager.ShopButton.Visible = true;
        shopFrame.Visible = !shopFrame.Visible;
        if (shopFrame.Visible) MultiboardUtil.MinMultiboards(player, true);
        else MultiboardUtil.MinMultiboards(player, false);

    }
}
