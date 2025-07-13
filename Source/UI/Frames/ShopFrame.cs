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
    private static framehandle nameLabel;
    private static framehandle descriptionLabel;
    private static framehandle costLabel;
    private static framehandle buyButton;
    private static framehandle sellButton;
    private static framehandle upgradeTooltip;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private const float buttonWidth = 0.025f;
    private const float buttonHeight = 0.025f;
    private const float panelPadding = 0.015f;
    private const float frameX = 0.4f;
    private const float frameY = 0.25f;
    private const float panelX = (frameX / 2) - panelPadding;
    private const float panelY = (frameY / 3) - (panelPadding * 2);
    private const float detailsPanelX = frameX - (panelX + (panelPadding * 2));
    private const float detailsPanelY = frameY - (panelPadding * 2);
    private const int ActiveAlpha = 255;
    private const int DisabledAlpha = 150;
    private const string DisabledPath = "UI\\Widgets\\EscMenu\\Human\\human-options-button-background-disabled.blp";

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
        shopFrame = BlzCreateFrameByType("BACKDROP", "Shop Frame", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        BlzFrameSetAbsPoint(shopFrame, FRAMEPOINT_CENTER, 0.40f, 0.375f);
        BlzFrameSetSize(shopFrame, frameX, frameY);
        FrameManager.CreateHeaderFrame(shopFrame);
    }

    private static void InitializePanels()
    {
        relicsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        relicsPanel.SetPoint(FRAMEPOINT_TOPLEFT, panelPadding, -panelPadding * 2, shopFrame, FRAMEPOINT_TOPLEFT);
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
        var detailsPanelX = frameX - (panelX + (panelPadding * 2));
        var detailsPanelY = frameY - (panelPadding * 2);
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

        buyButton.SetSize(detailsPanelX / 3.00f, detailsPanelY / 6);
        sellButton.SetSize(detailsPanelX / 3.00f, detailsPanelY / 6);
        upgradeButton.SetSize(detailsPanelX / 3.0f, detailsPanelY / 6);

        nameLabel.SetPoint(framepointtype.TopLeft, panelPadding / 2, -panelPadding, detailsPanel, framepointtype.TopLeft);
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

            var x = column * buttonWidth;
            var y = -row * buttonHeight;

            x += panelPadding / 2;
            y -= panelPadding / 2;

            button.SetSize(buttonWidth, buttonHeight);
            button.SetPoint(framepointtype.TopLeft, x, y, panel, framepointtype.TopLeft);
            icon.SetTexture(items[i].IconPath, 0, false);
            icon.SetPoints(button);

            var itemDetails = trigger.Create();
            var relic = items[i];
            CreateShopitemTooltips(button, relic);
            itemDetails.RegisterFrameEvent(BlzGetFrameByName(name, 0), frameeventtype.Click);
            itemDetails.AddAction( () => ShowItemDetails(relic));
        }

        float panelHeight = (rows * buttonHeight) + panelPadding;
        panel.SetSize((columns * buttonWidth) + panelPadding, panelHeight);
        if (panelHeight > panelY)
        {
            shopFrame.SetSize(frameX, frameY + (panelHeight - panelY));
            detailsPanel.SetSize(detailsPanelX, detailsPanelY + (panelHeight - panelY));
        }
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

    private static void ShowItemDetails(ShopItem shopItem)
    {
        var player = @event.Player;
        var frame = @event.Frame;

        if (SelectedItems.ContainsKey(player)) SelectedItems[player] = shopItem;
        else SelectedItems.Add(player, shopItem);

        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);
        nameLabel.Text = $"{Colors.COLOR_YELLOW_ORANGE}Name:{Colors.COLOR_RESET} {shopItem.Name}";
        costLabel.Text = $"{Colors.COLOR_YELLOW}Cost:{Colors.COLOR_RESET} {shopItem.Cost}";
        descriptionLabel.Text = $"{Colors.COLOR_YELLOW_ORANGE}Description:{Colors.COLOR_RESET} {shopItem.Description}";
        UpdateButtonStatus(player);
        if (shopItem.Type == ShopItemType.Relic)
            RefreshUpgradeTooltip(shopItem.Relic);
    }

    private static void CreateUpgradeTooltip()
    {
        var background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        upgradeTooltip = framehandle.Create("TEXT", $"UpgradeTooltip", background, "", 0);

        upgradeTooltip.SetSize(0.25f, 0);
        background.SetPoint(framepointtype.BottomLeft, -0.01f, -0.01f, upgradeTooltip, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, 0.01f, 0.01f, upgradeTooltip, framepointtype.TopRight);

        upgradeButton.SetTooltip(background);
        upgradeTooltip.SetPoint(framepointtype.Bottom, 0, 0.01f, upgradeButton, framepointtype.Top);
        upgradeTooltip.Enabled = false;
    }

    private static void CreateShopitemTooltips(framehandle parent, ShopItem item)
    {
        var background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        var tooltip = framehandle.Create("TEXT", $"{parent.Name}Tooltip", background, "", 0);

        tooltip.SetSize(0.10f, 0);
        background.SetPoint(framepointtype.BottomLeft, -0.01f, -0.01f, tooltip, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, 0.01f, 0.01f, tooltip, framepointtype.TopRight);

        parent.SetTooltip(background);
        tooltip.SetPoint(framepointtype.Bottom, 0, 0.01f, parent, framepointtype.Top);
        tooltip.Enabled = false;

        tooltip.Text = item.Name;
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

                    if (!CanSellRelic(kitty.Unit))
                    {
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot sell relics until level {Relic.RelicSellLevel}.{Colors.COLOR_RESET}");
                        return;
                    }

                    // Find the shopItem type associated with the selected item that the player owns.
                    var relic = kitty.Relics.Find(x => x.GetType() == selectedItem.Relic.GetType());

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
        trigger shopFrameHotkey = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            shopFrameHotkey.RegisterPlayerKeyEvent(player, OSKEY_OEM_PLUS, 0, true);
        }
        shopFrameHotkey.AddAction(ErrorHandler.Wrap(() => ShopFrameActions()));
    }

    public static void ShopFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        FrameManager.ShopButton.Visible = false;
        FrameManager.ShopButton.Visible = true;
        FrameManager.HideOtherFrames(shopFrame);
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) // solo mode.
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
