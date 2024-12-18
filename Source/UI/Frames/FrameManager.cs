using WCSharp.Api;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = trigger.Create();
    public static trigger ShopTrigger = trigger.Create();
    public static trigger RewardsTrigger = trigger.Create();
    public static framehandle MusicButton;
    public static framehandle ShopButton;
    public static framehandle RewardsButton;
    public static framehandle Backdrop;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static trigger ESCTrigger = trigger.Create();
    public static void Initialize()
    {
        BlzLoadTOCFile("war3mapImported\\templates.toc");
        RemoveUnwantedFrames();
        ButtonsBackdrop();
        CreateRewardsButton();
        CreateMusicButton();
        CreateShopButton();
        MusicFrame.Initialize();
        Utility.SimpleTimer(1.0f, ESCHideFrames);
    }

    public static void InitAllFrames()
    {
        ShopFrame.Initialize();
        RewardsFrame.Initialize();
        InitalizeButtons();
    }

    public static void InitalizeButtons()
    {
        Backdrop.Visible = true;
        RewardsButton.Visible = true;
        MusicButton.Visible = true;
        ShopButton.Visible = true;
    }

    public static framehandle CreateHeaderFrame(framehandle parent)
    {
        var header = framehandle.Create("BACKDROP", $"{parent.Name}Header", parent, "QuestButtonDisabledBackdropTemplate", 0);
        var width = parent.Width;
        var height = 0.0225f;
        header.SetPoint(framepointtype.TopLeft, 0, 0.0125f, parent, framepointtype.TopLeft);
        header.SetSize(width, height);

        var title = framehandle.Create("TEXT", $"{parent.Name}Title", header, "ScriptDialogText", 0);
        title.SetPoint(framepointtype.Center, 0, 0, header, framepointtype.Center);
        title.SetSize(width, height);
        title.Text = $"{Colors.COLOR_YELLOW}{parent.Name}{Colors.COLOR_RESET}";
        title.SetTextAlignment(textaligntype.Center, textaligntype.Center);

        var closeButton = framehandle.Create("GLUETEXTBUTTON", $"{parent.Name}CloseButton", header, "ScriptDialogButton", 0);
        closeButton.SetPoint(framepointtype.TopRight, -0.0025f, -0.0025f, header, framepointtype.TopRight);
        closeButton.SetSize(height - 0.005f, height - 0.005f);
        closeButton.Text = "X";

        // Close Actions
        var closeTrigger = trigger.Create();
        closeTrigger.RegisterFrameEvent(closeButton, frameeventtype.Click);
        closeTrigger.AddAction(() =>
        {
            if (!@event.Player.IsLocal) return;
            parent.Visible = false;
        });

        return header;
    }

    private static void RemoveUnwantedFrames()
    {
        var resourceBarText = BlzGetFrameByName("ResourceBarSupplyText", 0);
        var timeDayDisplay = BlzFrameGetChild(BlzFrameGetChild(GameUI, 5), 0);
        resourceBarText.Text = "0:00";
        timeDayDisplay.Visible = false;
    }

    private static void CreateRewardsButton()
    {
        RewardsButton = framehandle.Create("UpperButtonBarButtonTemplate", "RewardsButton", Backdrop, "DebugButton", 0);
        RewardsButton.SetPoint(framepointtype.Center, 0, 0, Backdrop, framepointtype.Center);
        RewardsButton.SetSize(0.0525f, 0.025f);
        RewardsButton.Text = "(-) Rewards";
        RewardsTrigger.RegisterFrameEvent(RewardsButton, frameeventtype.Click);
        RewardsTrigger.AddAction(RewardsFrame.RewardsFrameActions);
        RewardsButton.Visible = false;
    }

    private static void CreateMusicButton()
    {
        MusicButton = framehandle.Create("UpperButtonBarButtonTemplate", "MusicButton", Backdrop, "DebugButton", 0);
        MusicButton.SetPoint(framepointtype.TopRight, 0, 0, RewardsButton, framepointtype.TopLeft);
        MusicButton.SetSize(0.0525f, 0.025f);
        MusicButton.Text = "(0) Music";
        StatsTrigger.RegisterFrameEvent(MusicButton, frameeventtype.Click);
        StatsTrigger.AddAction(MusicFrame.MusicFrameActions);
        MusicButton.Visible = false;
    }

    private static void CreateShopButton()
    {
        ShopButton = framehandle.Create("UpperButtonBarButtonTemplate", "ShopButton", Backdrop, "DebugButton", 0);
        ShopButton.SetPoint(framepointtype.TopLeft, 0, 0, RewardsButton, framepointtype.TopRight);
        ShopButton.SetSize(0.0525f, 0.025f);
        ShopButton.Text = "(=) Shop";
        ShopTrigger.RegisterFrameEvent(ShopButton, frameeventtype.Click);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
        ShopButton.Visible = false;
    }

    private static void ButtonsBackdrop()
    {
        Backdrop = framehandle.Create("BACKDROP", "ButtonsBackdrop", GameUI, "QuestButtonDisabledBackdropTemplate", 0);
        var statsFrameParent = BlzGetFrameByName("SimpleUnitStatsPanel", 0);
        Backdrop.SetPoint(framepointtype.Center, 0, 0.075f, statsFrameParent, framepointtype.Center);
        Backdrop.SetSize(0.18f, 0.035f);
        Backdrop.Visible = false;
    }

    public static void UpdateButtonPositions()
    {
        Backdrop.SetPoint(framepointtype.Center, 0, 0.075f, BlzGetFrameByName("SimpleUnitStatsPanel", 0), framepointtype.Center);
    }

    private static void ESCHideFrames()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        }
        ESCTrigger.AddAction(ESCActions);
    }

    public static void RefreshFrame(framehandle frame)
    {
        frame.Visible = !frame.Visible;
        frame.Visible = !frame.Visible;
    }

    private static void ESCActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        RewardsFrame.RewardFrame.Visible = false;
        ShopFrame.shopFrame.Visible = false;
        MusicFrame.MusicFramehandle.Visible = false;
    }

    public static void HideOtherFrames(framehandle currentFrame)
    {
        var frames = new List<framehandle>
        {
            RewardsFrame.RewardFrame,
            ShopFrame.shopFrame,
            MusicFrame.MusicFramehandle
        };

        // Hide all frames except the current one
        foreach (var frame in frames)
            if (frame != currentFrame) frame.Visible = false;
    }

}


