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
    private const float buttonWidth = 0.025f;
    private const float buttonHeight = 0.025f;
    private const float panelPadding = 0.015f;
    private const float frameX = 0.4f;
    private const float frameY = 0.25f;
    private const float panelX = (frameX/2) - panelPadding;
    private const float panelY = (frameY/3) - panelPadding*2;
    private const float detailsPanelX = frameX - (panelX + panelPadding * 2);
    private const float detailsPanelY = frameY - (panelPadding * 2);
    private static Dictionary<player, Relic> SelectedItems = new Dictionary<player, Relic>();

    public static void Initialize()
    {
        InitializeShopFrame();
        InitializePanels();
        InitializeDetailsPanel();
        InitializePanelTitles();
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

    private static void InitializePanelTitles()
    {
        CreatePanelTitle(relicsPanel, "Relics");
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
        BlzFrameSetPoint(detailsPanel, FRAMEPOINT_TOPRIGHT, shopFrame, FRAMEPOINT_TOPRIGHT, -panelPadding, -panelPadding);
        BlzFrameSetSize(detailsPanel, detailsPanelX, detailsPanelY);

        nameLabel = BlzCreateFrameByType("TEXT", "nameLabel", detailsPanel, "", 0);
        costLabel = BlzCreateFrameByType("TEXT", "costLabel", detailsPanel, "", 0);
        descriptionLabel = BlzCreateFrameByType("TEXT", "descriptionLabel", detailsPanel, "", 0);

        nameLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY/6);
        costLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY/6);
        descriptionLabel.SetSize(detailsPanelX - panelPadding, detailsPanelY / 6);

        buyButton = BlzCreateFrame("ScriptDialogButton", detailsPanel, 0, 0);
        buyButton.SetSize(detailsPanelX/3, detailsPanelY/6);

        BlzFrameSetPoint(nameLabel, FRAMEPOINT_TOPLEFT, detailsPanel, FRAMEPOINT_TOPLEFT, panelPadding/2, -panelPadding);
        BlzFrameSetPoint(costLabel, FRAMEPOINT_TOPLEFT, nameLabel, FRAMEPOINT_TOPLEFT, 0, -panelPadding);
        BlzFrameSetPoint(descriptionLabel, FRAMEPOINT_TOPLEFT, costLabel, FRAMEPOINT_BOTTOMLEFT, 0, -panelPadding);
        BlzFrameSetPoint(buyButton, FRAMEPOINT_BOTTOMRIGHT, detailsPanel, FRAMEPOINT_BOTTOMRIGHT, -panelPadding, panelPadding);

        buyButton.Text = "Buy";

        var trigger = CreateTrigger();
        trigger.RegisterFrameEvent(buyButton, FRAMEEVENT_CONTROL_CLICK);
        trigger.AddAction( () => BuySelectedItem() );

    }

    private static void LoadItemsIntoPanels()
    {
        AddItemsToPanel(relicsPanel, GetRelicItems());
        AddItemsToPanel(rewardsPanel, GetRewardItems());
        AddItemsToPanel(miscPanel, GetMiscItems());
    }

    private static void AddItemsToPanel(framehandle panel, List<Relic> items)
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
            button.SetPoint(FRAMEPOINT_TOPLEFT, x, y, panel, FRAMEPOINT_TOPLEFT);
            icon.SetTexture(items[i].IconPath, 0, false);
            icon.SetPoints(button);

            var trigger = CreateTrigger();
            var relic = items[i];
            trigger.RegisterFrameEvent(BlzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK);
            trigger.AddAction(() => ShowItemDetails(relic));
        }

        float panelHeight = rows * (buttonHeight) + panelPadding;
        panel.SetSize(columns * (buttonWidth) + panelPadding, panelHeight);
        if (panelHeight > panelY)
        {
            shopFrame.SetSize(frameX, frameY + (panelHeight - panelY));
            detailsPanel.SetSize(detailsPanelX, detailsPanelY + (panelHeight - panelY));
        }
    }


    private static void ShowItemDetails(Relic relic)
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        BlzFrameSetText(nameLabel, $"{Colors.COLOR_YELLOW_ORANGE}Name:|r {relic.Name}");
        BlzFrameSetText(costLabel, $"{Colors.COLOR_YELLOW}Cost:|r {relic.Cost}");
        BlzFrameSetText(descriptionLabel, $"{Colors.COLOR_YELLOW_ORANGE}Description:|r {relic.Description}");

        if(SelectedItems.ContainsKey(player))
            SelectedItems[player] = relic;
        else
            SelectedItems.Add(player, relic);
    }

    private static void BuySelectedItem()
    {
        var player = @event.Player;
        if (SelectedItems[player] != null)
        {
            if (!HasEnoughGold(player, SelectedItems[player].Cost)) return;

            ReduceGold(player, SelectedItems[player].Cost);
            AddItem(player, SelectedItems[player].ItemID);
            BlzDisplayChatMessage(player, 0, $"Purchased {SelectedItems[player].Name}!");
        }
    }

    // Placeholder methods for item retrieval
    private static List<Relic> GetRelicItems() => new List<Relic> {
        new OneOfNine(),
        new FangOfShadows(),
        new RingOfSummoning(),
        new AmuletOfEvasiveness(),
        new FrostbiteRing(),
        new BeaconOfUnitedLifeforce(),
        new OneOfNine(),
    };
    private static List<Relic> GetRewardItems() => new List<Relic> {
        new OneOfNine(),
        new FangOfShadows(),
        new RingOfSummoning(),
        new AmuletOfEvasiveness(),
        new FrostbiteRing(),
        new BeaconOfUnitedLifeforce(),
    };
    private static List<Relic> GetMiscItems() => new List<Relic> {
        new OneOfNine(),
        new FangOfShadows(),
        new RingOfSummoning(),
        new AmuletOfEvasiveness(),
        new FrostbiteRing(),
        new BeaconOfUnitedLifeforce(),
    };

    // Placeholder methods for player interaction
    private static bool HasEnoughGold(player player, int cost) => player.Gold >= cost;
    private static void ReduceGold(player player, int amount) => player.Gold -= amount;
    private static void RelicMaxedOut(player player) => BlzDisplayChatMessage(player, 0, "You already have the maximum amount of this relic!");
    private static void AddItem(player player, int itemID) => Globals.ALL_KITTIES[player].Unit.AddItem(itemID);

    public static void ShopFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        FrameManager.ShopButton.Visible = false;
        FrameManager.ShopButton.Visible = true;
        shopFrame.Visible = !shopFrame.Visible;

    }
}
