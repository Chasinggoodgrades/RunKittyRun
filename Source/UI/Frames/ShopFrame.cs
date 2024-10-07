using WCSharp.Api;
using static WCSharp.Api.Common;
using System.Collections.Generic;
using System;

public static class ShopFrame
{
    private static framehandle shopFrame;
    private static framehandle relicsPanel;
    private static framehandle rewardsPanel;
    private static framehandle miscPanel;
    private static framehandle detailsPanel;
    private static framehandle nameLabel;
    private static framehandle descriptionLabel;
    private static framehandle costLabel;
    private static framehandle buyButton;
    private const float buttonWidth = 0.05f;
    private const float buttonHeight = 0.05f;
    private const float panelPadding = 0.015f;
    private const float frameX = 0.5f;
    private const float frameY = 0.3f;
    private const float panelX = (frameX/2) - panelPadding*2;
    private const float panelY = (frameY/3) - panelPadding*6;
    private static Relic selectedItem;

    public static void Initialize()
    {
        InitializeShopFrame();
        InitializePanels();
        InitializeDetailsPanel();
        LoadItemsIntoPanels();
        shopFrame.Visible = false;
    }

    private static void InitializeShopFrame()
    {
        shopFrame = BlzCreateFrameByType("BACKDROP", "ShopFrame", BlzGetFrameByName("ConsoleUIBackdrop", 0), "QuestButtonPushedBackdropTemplate", 0);
        BlzFrameSetAbsPoint(shopFrame, FRAMEPOINT_CENTER, 0.40f, 0.375f);
        BlzFrameSetSize(shopFrame, frameX, frameY);
    }

    private static void InitializePanels()
    {
        relicsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        relicsPanel.SetPoint(FRAMEPOINT_TOPLEFT, panelPadding, -panelPadding*2, shopFrame, FRAMEPOINT_TOPLEFT);
        relicsPanel.SetSize(panelX, panelY);
        rewardsPanel = CreatePanel(relicsPanel, 0, -panelPadding);
        miscPanel = CreatePanel(rewardsPanel, 0, -panelPadding);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y)
    {
        var panel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", parent, 0, 0);
        BlzFrameSetPoint(panel, FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_BOTTOMLEFT, x, y);
        BlzFrameSetSize(panel, panelX, panelY);
        return panel;
    }

    private static void InitializeDetailsPanel()
    {
        detailsPanel = BlzCreateFrame("QuestButtonDisabledBackdropTemplate", shopFrame, 0, 0);
        BlzFrameSetPoint(detailsPanel, FRAMEPOINT_TOPRIGHT, shopFrame, FRAMEPOINT_TOPRIGHT, -panelPadding, -panelPadding);
        BlzFrameSetSize(detailsPanel, frameX / 2.5f, frameY - (panelPadding * 2));

        nameLabel = BlzCreateFrameByType("TEXT", "nameLabel", detailsPanel, "", 0);
        costLabel = BlzCreateFrameByType("TEXT", "costLabel", detailsPanel, "", 0);
        descriptionLabel = BlzCreateFrameByType("TEXT", "descriptionLabel", detailsPanel, "", 0);
        buyButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        buyButton.SetSize(0.1f, 0.03f);

        BlzFrameSetPoint(nameLabel, FRAMEPOINT_TOPLEFT, detailsPanel, FRAMEPOINT_TOPLEFT, 0, -panelPadding);
        BlzFrameSetPoint(costLabel, FRAMEPOINT_TOPLEFT, nameLabel, FRAMEPOINT_BOTTOMLEFT, 0, -panelPadding);
        BlzFrameSetPoint(descriptionLabel, FRAMEPOINT_TOPLEFT, costLabel, FRAMEPOINT_BOTTOMLEFT, 0, -panelPadding);
        BlzFrameSetPoint(buyButton, FRAMEPOINT_BOTTOMRIGHT, detailsPanel, FRAMEPOINT_BOTTOMRIGHT, -panelPadding, panelPadding);

        BlzFrameSetText(buyButton, "Buy");
    }

    private static void LoadItemsIntoPanels()
    {
        AddItemsToPanel(relicsPanel, GetRelicItems());
        AddItemsToPanel(rewardsPanel, GetRewardItems());
        AddItemsToPanel(miscPanel, GetMiscItems());
    }

    private static void AddItemsToPanel(framehandle panel, List<Relic> items)
    {
        int columns = 4;
        int rows = (int)Math.Ceiling((double)items.Count / columns);

        for (int i = 0; i < items.Count; i++)
        {
            int row = i / columns;
            int column = i % columns;

            var button = BlzCreateFrame("ScriptDialogButton", panel, 0, 0);
            BlzFrameSetSize(button, buttonWidth, buttonHeight);
            BlzFrameSetText(button, items[i].Name);
            BlzFrameSetPoint(button, FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, column * (buttonWidth + panelPadding), -row * (buttonHeight + panelPadding));

            var relic = items[i];
        }

        float panelHeight = rows * (buttonHeight + panelPadding);
        BlzFrameSetSize(panel, columns * (buttonWidth + panelPadding), panelHeight);
    }

    private static void ShowItemDetails(Relic relic)
    {
        BlzFrameSetText(nameLabel, $"Name: {relic.Name}");
        BlzFrameSetText(costLabel, $"Cost: {relic.Cost}");
        BlzFrameSetText(descriptionLabel, $"Description: {relic.Description}");
        selectedItem = relic;
    }

    private static void BuySelectedItem()
    {
        if (selectedItem != null)
        {
            if (HasEnoughGold(selectedItem.Cost))
            {
                ReduceGold(selectedItem.Cost);
                BlzDisplayChatMessage(GetLocalPlayer(), 0, $"Purchased {selectedItem.Name}!");
            }
            else
            {
                BlzDisplayChatMessage(GetLocalPlayer(), 0, "Not enough gold!");
            }
        }
    }

    // Placeholder methods for item retrieval
    private static List<Relic> GetRelicItems() => new List<Relic> { /* your relic items */ };
    private static List<Relic> GetRewardItems() => new List<Relic> { /* your reward items */ };
    private static List<Relic> GetMiscItems() => new List<Relic> { /* your misc items */ };

    // Placeholder methods for player interaction
    private static bool HasEnoughGold(int cost) => true; // implement your logic
    private static void ReduceGold(int amount) { /* implement your logic */ }
    private static void AddItem(item newItem) { /* implement your logic */ }

    public static void ShopFrameActions()
    {
        var player = GetTriggerPlayer();
        if (!player.IsLocal) return;
        shopFrame.Visible = !shopFrame.Visible;
    }
}
